import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { buildDiscoveryQuery, buildCountQuery } from '../src/engine.js';

export class QueryPool {
    constructor(options = {}) {
        this.databasePath = options.databasePath;
        this.mmapSizeBytes = options.mmapSizeBytes ?? 2147483648; // 2GB default
        this.cacheSizeKb = options.cacheSizeKb ?? 65536; // 64MB default
        this.enableWorkerPool = options.enableWorkerPool ?? true;
        this.poolSize = options.poolSize ?? Math.min(4, Math.max(1, os.availableParallelism?.() || 2));
        this.queryTimeoutMs = options.queryTimeoutMs ?? 10000;
        this.cacheTtlMs = options.cacheTtlMs ?? 60000;
        this.cacheMaxEntries = options.cacheMaxEntries ?? 1000;

        this.workers = [];
        this.idleWorkers = [];
        this.pendingRequests = [];
        this.activeRequests = new Map();
        this.requestIdSeq = 0;

        // Search LRU cache: key -> { data, expiresAt }
        this.searchCache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.totalQueries = 0;

        // Tag counts cache
        this.tagCountsCache = null;
        this.tagCountsJson = null;

        // Fallback direct connection
        this.directDb = null;
        this.directStatementCache = new Map();

        this.isClosed = false;
    }

    async init() {
        if (!this.enableWorkerPool || this.poolSize <= 1) {
            this.initDirectConnection();
            await this.loadTagCounts();
            return;
        }

        try {
            const workerUrl = new URL('./worker_thread.mjs', import.meta.url);
            const workerPath = fileURLToPath(workerUrl);

            const initPromises = [];
            for (let i = 0; i < this.poolSize; i++) {
                initPromises.push(this.spawnWorker(workerPath, i));
            }

            await Promise.all(initPromises);
            await this.loadTagCounts();
        } catch (err) {
            console.warn('[QueryPool] Worker thread initialization failed, falling back to direct connection:', err.message);
            this.workers.forEach(w => w.terminate());
            this.workers = [];
            this.idleWorkers = [];
            this.initDirectConnection();
            await this.loadTagCounts();
        }
    }

    initDirectConnection() {
        if (!this.directDb) {
            this.directDb = new DatabaseSync(this.databasePath, { readOnly: true });
            this.directDb.exec(`
                PRAGMA mmap_size = ${this.mmapSizeBytes};
                PRAGMA cache_size = ${-Math.abs(this.cacheSizeKb)};
                PRAGMA query_only = ON;
                PRAGMA temp_store = MEMORY;
                PRAGMA busy_timeout = 5000;
            `);
        }
    }

    spawnWorker(workerPath, index) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(workerPath, {
                workerData: {
                    databasePath: this.databasePath,
                    mmapSizeBytes: this.mmapSizeBytes,
                    cacheSizeKb: this.cacheSizeKb
                }
            });

            worker.workerIndex = index;

            const onReady = (msg) => {
                if (msg && msg.type === 'ready') {
                    worker.off('message', onReady);
                    if (msg.success) {
                        this.workers.push(worker);
                        this.idleWorkers.push(worker);
                        this.attachWorkerListeners(worker, workerPath);
                        resolve();
                    } else {
                        reject(new Error(msg.error || 'Worker failed to ready'));
                    }
                }
            };

            worker.on('message', onReady);
            worker.on('error', (err) => {
                worker.off('message', onReady);
                reject(err);
            });
        });
    }

    attachWorkerListeners(worker, workerPath) {
        worker.on('message', (msg) => {
            if (!msg || !msg.id) return;
            const req = this.activeRequests.get(msg.id);
            if (!req) return;

            this.activeRequests.delete(msg.id);
            clearTimeout(req.timer);

            this.idleWorkers.push(worker);
            this.processQueue();

            if (msg.success) {
                req.resolve(msg);
            } else {
                req.reject(new Error(msg.error || 'Query failed in worker thread'));
            }
        });

        worker.on('error', (err) => {
            console.error(`[QueryPool] Worker ${worker.workerIndex} error:`, err);
            this.handleWorkerExit(worker, workerPath);
        });

        worker.on('exit', (code) => {
            if (!this.isClosed) {
                console.warn(`[QueryPool] Worker ${worker.workerIndex} exited with code ${code}. Replacing...`);
                this.handleWorkerExit(worker, workerPath);
            }
        });
    }

    handleWorkerExit(worker, workerPath) {
        // Remove from workers and idle list
        this.workers = this.workers.filter(w => w !== worker);
        this.idleWorkers = this.idleWorkers.filter(w => w !== worker);

        // Fail any active request assigned to this worker
        for (const [id, req] of this.activeRequests.entries()) {
            if (req.worker === worker) {
                this.activeRequests.delete(id);
                clearTimeout(req.timer);
                req.reject(new Error('Worker terminated unexpectedly'));
            }
        }

        // Re-spawn worker if pool is still active
        if (!this.isClosed) {
            this.spawnWorker(workerPath, worker.workerIndex).catch(err => {
                console.error('[QueryPool] Failed to re-spawn worker:', err);
                if (this.workers.length === 0) {
                    console.warn('[QueryPool] All workers died. Activating direct connection fallback.');
                    this.initDirectConnection();
                }
            });
        }
    }

    processQueue() {
        if (this.pendingRequests.length === 0 || this.idleWorkers.length === 0) {
            return;
        }

        const worker = this.idleWorkers.shift();
        const req = this.pendingRequests.shift();

        req.worker = worker;
        this.activeRequests.set(req.id, req);

        worker.postMessage({
            id: req.id,
            type: req.type,
            payload: req.payload
        });
    }

    async executeSearch(payload) {
        this.totalQueries++;

        // Check LRU search cache
        const cacheKey = this.getSearchCacheKey(payload);
        const cached = this.searchCache.get(cacheKey);
        const now = Date.now();
        if (cached && cached.expiresAt > now) {
            this.cacheHits++;
            return { ...cached.data, cached: true };
        }
        this.cacheMisses++;

        let result;
        if (this.workers.length > 0) {
            result = await this.dispatchToWorker('search', payload);
        } else {
            result = this.executeDirectSearch(payload);
        }

        // Store in LRU cache
        if (this.searchCache.size >= this.cacheMaxEntries) {
            const oldestKey = this.searchCache.keys().next().value;
            this.searchCache.delete(oldestKey);
        }
        this.searchCache.set(cacheKey, {
            data: { results: result.results, count: result.count },
            expiresAt: now + this.cacheTtlMs
        });

        return { results: result.results, count: result.count, cached: false };
    }

    getSearchCacheKey(payload) {
        const { includeTags = [], excludeTags = [], limit = 50, offset = 0 } = payload;
        const inc = [...includeTags].sort().join(',');
        const exc = [...excludeTags].sort().join(',');
        return `${inc}|${exc}|${limit}|${offset}`;
    }

    executeDirectSearch(payload) {
        this.initDirectConnection();
        const { includeTags, excludeTags, limit, offset, tagCounts } = payload;
        const search = buildDiscoveryQuery(includeTags, excludeTags, limit, offset, false, tagCounts);
        const searchStmt = this.getDirectPreparedStatement(search.sql);
        const results = searchStmt.all(...search.params);

        const countQuery = buildCountQuery(includeTags, excludeTags, tagCounts);
        const countStmt = this.getDirectPreparedStatement(countQuery.sql);
        const countRow = countStmt.get(...countQuery.params);

        return {
            results,
            count: Number(countRow?.count || 0)
        };
    }

    getDirectPreparedStatement(sql) {
        let stmt = this.directStatementCache.get(sql);
        if (!stmt) {
            if (this.directStatementCache.size >= 250) {
                const first = this.directStatementCache.keys().next().value;
                this.directStatementCache.delete(first);
            }
            stmt = this.directDb.prepare(sql);
            this.directStatementCache.set(sql, stmt);
        }
        return stmt;
    }

    dispatchToWorker(type, payload) {
        return new Promise((resolve, reject) => {
            const id = ++this.requestIdSeq;
            const timer = setTimeout(() => {
                const req = this.activeRequests.get(id);
                if (req) {
                    this.activeRequests.delete(id);
                    // Terminate and replace worker if stuck
                    if (req.worker) {
                        req.worker.terminate();
                    }
                } else {
                    const queueIdx = this.pendingRequests.findIndex(r => r.id === id);
                    if (queueIdx !== -1) {
                        this.pendingRequests.splice(queueIdx, 1);
                    }
                }
                reject(new Error(`Query timed out after ${this.queryTimeoutMs}ms`));
            }, this.queryTimeoutMs);

            const req = { id, type, payload, resolve, reject, timer };

            if (this.idleWorkers.length > 0) {
                const worker = this.idleWorkers.shift();
                req.worker = worker;
                this.activeRequests.set(id, req);
                worker.postMessage({ id, type, payload });
            } else {
                this.pendingRequests.push(req);
            }
        });
    }

    async loadTagCounts() {
        let tagCounts;
        if (this.workers.length > 0) {
            const resp = await this.dispatchToWorker('tag-counts', {});
            tagCounts = resp.tagCounts;
        } else {
            this.initDirectConnection();
            const stmt = this.getDirectPreparedStatement('SELECT name, count FROM Tags WHERE count > 0');
            const rows = stmt.all();
            tagCounts = Object.fromEntries(rows.map(row => [row.name, Number(row.count)]));
        }

        this.tagCountsCache = tagCounts;
        this.tagCountsJson = JSON.stringify({ tagCounts });
        return this.tagCountsCache;
    }

    getTagCountsFast() {
        if (this.tagCountsJson) {
            return this.tagCountsJson;
        }
        return JSON.stringify({ tagCounts: this.tagCountsCache || {} });
    }

    async refreshCache() {
        this.searchCache.clear();
        await this.loadTagCounts();
        return { success: true, tagCount: Object.keys(this.tagCountsCache || {}).length };
    }

    getStats() {
        const total = this.cacheHits + this.cacheMisses;
        const hitRatio = total > 0 ? (this.cacheHits / total) : 0;

        return {
            poolSize: this.workers.length,
            idleWorkers: this.idleWorkers.length,
            activeWorkers: this.activeRequests.size,
            queuedRequests: this.pendingRequests.length,
            totalQueriesExecuted: this.totalQueries,
            searchCache: {
                entries: this.searchCache.size,
                maxEntries: this.cacheMaxEntries,
                hits: this.cacheHits,
                misses: this.cacheMisses,
                hitRatio: Math.round(hitRatio * 1000) / 10 + '%'
            },
            cachedTagsCount: this.tagCountsCache ? Object.keys(this.tagCountsCache).length : 0,
            directConnectionActive: !!this.directDb,
            mmapSizeBytes: this.mmapSizeBytes,
            cacheSizeKb: this.cacheSizeKb
        };
    }

    close() {
        this.isClosed = true;
        for (const worker of this.workers) {
            try {
                worker.terminate();
            } catch {}
        }
        this.workers = [];
        this.idleWorkers = [];

        if (this.directDb) {
            try {
                this.directDb.close();
            } catch {}
            this.directDb = null;
        }
    }
}
