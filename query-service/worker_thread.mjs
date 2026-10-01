import { parentPort, workerData } from 'node:worker_threads';
import { DatabaseSync } from 'node:sqlite';
import { buildDiscoveryQuery, buildCountQuery } from '../src/engine.js';

const {
    databasePath,
    mmapSizeBytes = 2147483648,
    cacheSizeKb = 65536
} = workerData || {};

let database;
try {
    database = new DatabaseSync(databasePath, { readOnly: true });
    database.exec(`
        PRAGMA mmap_size = ${mmapSizeBytes};
        PRAGMA cache_size = ${-Math.abs(cacheSizeKb)};
        PRAGMA query_only = ON;
        PRAGMA temp_store = MEMORY;
        PRAGMA busy_timeout = 5000;
    `);
} catch (err) {
    if (parentPort) {
        parentPort.postMessage({ type: 'ready', error: err.message });
    }
    throw err;
}

// Prepared statement cache
const statementCache = new Map();
const MAX_STATEMENT_CACHE = 250;

function getPreparedStatement(sql) {
    let stmt = statementCache.get(sql);
    if (!stmt) {
        if (statementCache.size >= MAX_STATEMENT_CACHE) {
            const firstKey = statementCache.keys().next().value;
            statementCache.delete(firstKey);
        }
        stmt = database.prepare(sql);
        statementCache.set(sql, stmt);
    }
    return stmt;
}

if (parentPort) {
    parentPort.on('message', (message) => {
        const { id, type, payload } = message;

        if (type === 'ping') {
            parentPort.postMessage({ id, type: 'pong' });
            return;
        }

        if (type === 'search') {
            try {
                const { includeTags, excludeTags, limit, offset, tagCounts } = payload;
                const search = buildDiscoveryQuery(includeTags, excludeTags, limit, offset, false, tagCounts);
                const searchStmt = getPreparedStatement(search.sql);
                const results = searchStmt.all(...search.params);

                const countQuery = buildCountQuery(includeTags, excludeTags, tagCounts);
                const countStmt = getPreparedStatement(countQuery.sql);
                const countRow = countStmt.get(...countQuery.params);

                parentPort.postMessage({
                    id,
                    success: true,
                    results,
                    count: Number(countRow?.count || 0)
                });
            } catch (error) {
                parentPort.postMessage({
                    id,
                    success: false,
                    error: error.message
                });
            }
            return;
        }

        if (type === 'tag-counts') {
            try {
                const stmt = getPreparedStatement('SELECT name, count FROM Tags WHERE count > 0');
                const rows = stmt.all();
                const tagCounts = Object.fromEntries(rows.map(row => [row.name, Number(row.count)]));
                parentPort.postMessage({ id, success: true, tagCounts });
            } catch (error) {
                parentPort.postMessage({ id, success: false, error: error.message });
            }
            return;
        }
    });

    parentPort.postMessage({ type: 'ready', success: true });
}
