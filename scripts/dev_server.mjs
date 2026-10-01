/**
 * OpenedShelf Local Development Server
 * Runs src/worker.js locally on port 8787 with native Web APIs and connects to query-service.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.js';

const PORT = Number(process.env.PORT || 8787);
const SEARCH_PORT = Number(process.env.SEARCH_PORT || 8788);
const SEARCH_API_URL = process.env.SEARCH_API_URL || `http://127.0.0.1:${SEARCH_PORT}`;
const AUTO_START_QUERY = process.env.AUTO_START_QUERY !== 'false';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

// 1. Static Assets binding
const publicDir = path.resolve('public');
const assetsBinding = {
    async fetch(req) {
        const url = new URL(req.url);
        let pathname = decodeURIComponent(url.pathname);
        if (pathname === '/') pathname = '/index.html';
        const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(publicDir, safePath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const data = fs.readFileSync(filePath);
            return new Response(data, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': String(data.byteLength),
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }
        return new Response('File Not Found', { status: 404 });
    }
};

// 2. D1 Moderation Database binding
const d1Path = path.resolve('db/openedshelf_moderation.db');
let d1Db = null;
try {
    d1Db = new DatabaseSync(d1Path);
    const schemaPath = path.resolve('db/d1_moderation_schema.sql');
    if (fs.existsSync(schemaPath)) {
        d1Db.exec(fs.readFileSync(schemaPath, 'utf8'));
    }
} catch (err) {
    console.warn('[dev_server] Warning: Could not initialize local moderation DB:', err.message);
}

function createD1Statement(sql, params = []) {
    return {
        bind(...newParams) {
            return createD1Statement(sql, newParams);
        },
        async run() {
            const stmt = d1Db.prepare(sql);
            const info = stmt.run(...params);
            return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
        },
        async all() {
            const stmt = d1Db.prepare(sql);
            const results = stmt.all(...params);
            return { results };
        },
        async first() {
            const stmt = d1Db.prepare(sql);
            const row = stmt.get(...params);
            return row || null;
        }
    };
}

const mockD1 = d1Db ? {
    prepare(sql) {
        return createD1Statement(sql, []);
    }
} : null;

// Mock KV store for Anonymous Cloud Shelf Sync
const shelfKvStore = new Map();
const mockKV = {
    async get(key, type = 'text') {
        const val = shelfKvStore.get(key);
        if (!val) return null;
        if (type === 'json') {
            try { return JSON.parse(val); } catch { return null; }
        }
        return val;
    },
    async put(key, value) {
        shelfKvStore.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    async delete(key) {
        shelfKvStore.delete(key);
    }
};

// Worker environment
const env = {
    SEARCH_API_URL,
    SEARCH_API_TOKEN: process.env.SEARCH_API_TOKEN || '',
    openedshelf_master: mockD1,
    DB: mockD1,
    ASSETS: assetsBinding,
    SHELVES: mockKV
};

// 3. Child process manager for query service
let queryServiceProcess = null;

async function ensureQueryService() {
    if (!AUTO_START_QUERY) return;

    try {
        const res = await fetch(`${SEARCH_API_URL}/health`);
        if (res.ok) {
            console.log(`✓ Existing search query service active at ${SEARCH_API_URL}`);
            return;
        }
    } catch {}

    const catalogPath = path.resolve('db/openedshelf_db_08_2026.sqlite');
    if (!fs.existsSync(catalogPath)) {
        console.warn(`[dev_server] Catalog database not found at ${catalogPath}. Search queries will return 503.`);
        return;
    }

    console.log(`[dev_server] Starting OpenedShelf query service on port ${SEARCH_PORT}...`);
    queryServiceProcess = spawn(process.execPath, ['query-service/server.mjs'], {
        cwd: path.resolve('.'),
        env: {
            ...process.env,
            R2_DATABASE_PATH: catalogPath,
            PORT: String(SEARCH_PORT),
            ENABLE_WORKER_POOL: 'false'
        },
        stdio: ['ignore', 'inherit', 'inherit']
    });

    queryServiceProcess.on('error', (err) => {
        console.error('[dev_server] Query service process error:', err);
    });

    for (let attempt = 0; attempt < 40; attempt++) {
        await new Promise(r => setTimeout(r, 150));
        try {
            const res = await fetch(`${SEARCH_API_URL}/health`);
            if (res.ok) {
                console.log(`✓ OpenedShelf query service connected at ${SEARCH_API_URL}`);
                return;
            }
        } catch {}
    }
    console.warn(`[dev_server] Query service health check timed out at ${SEARCH_API_URL}`);
}

function cleanup() {
    if (queryServiceProcess && !queryServiceProcess.killed) {
        console.log('\n[dev_server] Shutting down background query service...');
        queryServiceProcess.kill('SIGTERM');
        queryServiceProcess = null;
    }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', () => cleanup());

// 4. Create HTTP server for worker
const server = http.createServer(async (req, res) => {
    try {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && bodyBuffer.length > 0;

        const host = req.headers.host || `localhost:${PORT}`;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const url = new URL(req.url, `${protocol}://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    for (const v of value) headers.append(key, v);
                } else {
                    headers.set(key, value);
                }
            }
        }

        if (!headers.has('CF-Connecting-IP')) {
            headers.set('CF-Connecting-IP', req.socket.remoteAddress || '127.0.0.1');
        }

        const standardRequest = new Request(url.toString(), {
            method: req.method,
            headers,
            body: hasBody ? bodyBuffer : undefined,
            // @ts-ignore
            duplex: hasBody ? 'half' : undefined
        });

        const ctx = {
            waitUntil(promise) {
                Promise.resolve(promise).catch(console.error);
            }
        };

        const response = await worker.fetch(standardRequest, env, ctx);

        res.statusCode = response.status;
        for (const [key, value] of response.headers.entries()) {
            res.setHeader(key, value);
        }

        if (response.body) {
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        res.end();
    } catch (err) {
        console.error('[dev_server] Error handling request:', err);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(`Internal Server Error: ${err.message}`);
        } else {
            res.end();
        }
    }
});

await ensureQueryService();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n============================================================`);
    console.log(`🚀 OpenedShelf local deployment running at:`);
    console.log(`   ➜ Local:   http://localhost:${PORT}`);
    console.log(`   ➜ Network: http://127.0.0.1:${PORT}`);
    console.log(`   ➜ Search:  ${SEARCH_API_URL}`);
    console.log(`============================================================\n`);
});
