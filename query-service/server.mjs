import http from 'node:http';
import os from 'node:os';
import { QueryPool } from './pool.mjs';

const databasePath = process.env.R2_DATABASE_PATH;
const port = Number(process.env.PORT || 8788);
const searchToken = process.env.SEARCH_API_TOKEN;

if (!databasePath) {
    throw new Error('R2_DATABASE_PATH must point to a local SQLite copy of the R2 database object');
}

const mmapSizeBytes = Number(process.env.SQLITE_MMAP_SIZE_MB || 2048) * 1024 * 1024;
const cacheSizeKb = Number(process.env.SQLITE_CACHE_SIZE_KB || 65536);
const poolSize = process.env.QUERY_POOL_SIZE ? Number(process.env.QUERY_POOL_SIZE) : Math.min(4, Math.max(1, os.availableParallelism?.() || 2));
const enableWorkerPool = process.env.ENABLE_WORKER_POOL !== 'false';
const queryTimeoutMs = Number(process.env.QUERY_TIMEOUT_MS || 10000);
const cacheTtlMs = Number(process.env.SEARCH_CACHE_TTL_MS || 60000);
const cacheMaxEntries = Number(process.env.SEARCH_CACHE_MAX || 1000);

const CREDITS_METADATA = {
    credits: {
        engine_license: "AGPL-3.0-or-later",
        engine_url: "https://www.gnu.org/licenses/agpl-3.0.html",
        taxonomy_license: "CC0-1.0",
        taxonomy_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        sources: [
            {
                name: "Open Library",
                organization: "Internet Archive",
                url: "https://openlibrary.org",
                license: "CC0-1.0",
                description: "Catalog records, editions, and author mappings"
            },
            {
                name: "Library of Congress",
                organization: "United States Library of Congress",
                url: "https://data.labs.loc.gov",
                license: "Public Domain (17 U.S.C. § 105)",
                description: "Bibliographic metadata, summaries (MARC 520), and BIBFRAME Hubs data"
            },
            {
                name: "Wikidata",
                organization: "Wikimedia Foundation",
                url: "https://www.wikidata.org",
                license: "CC0-1.0",
                description: "Structured conceptual entities and cross-language descriptions"
            },
            {
                name: "Project Gutenberg",
                organization: "Project Gutenberg Literary Archive Foundation",
                url: "https://www.gutenberg.org",
                license: "Public Domain Metadata",
                notice: "Project Gutenberg is a registered trademark of the Project Gutenberg Literary Archive Foundation and does not endorse or promote OpenedShelf."
            }
        ]
    }
};

const pool = new QueryPool({
    databasePath,
    mmapSizeBytes,
    cacheSizeKb,
    poolSize,
    enableWorkerPool,
    queryTimeoutMs,
    cacheTtlMs,
    cacheMaxEntries
});

await pool.init();

const server = http.createServer(async (request, response) => {
    // Health check endpoints for orchestrators / systemd / load balancers
    if (request.method === 'GET' && (request.url === '/health' || request.url === '/healthz')) {
        const stats = pool.getStats();
        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
        });
        response.end(JSON.stringify({
            status: 'ok',
            service: 'openedshelf-query-service',
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            pool: stats
        }, null, 2));
        return;
    }

    // Credits attribution endpoint
    if (request.method === 'GET' && (request.url === '/credits' || request.url === '/api/credits')) {
        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
        });
        response.end(JSON.stringify(CREDITS_METADATA, null, 2));
        return;
    }

    // Bearer token check for protected endpoints
    if (searchToken && request.headers.authorization !== `Bearer ${searchToken}`) {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    // Fast in-memory Tag Counts
    if (request.method === 'GET' && (request.url === '/tag-counts' || request.url === '/api/tag-counts')) {
        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300'
        });
        response.end(pool.getTagCountsFast());
        return;
    }

    // Cache refresh admin endpoint
    if (request.method === 'POST' && (request.url === '/admin/refresh-cache' || request.url === '/refresh-cache')) {
        try {
            const result = await pool.refreshCache();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: 'Cache refreshed successfully', ...result }));
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // Search query endpoint
    if (request.method !== 'POST' || (request.url !== '/search' && request.url !== '/api/search')) {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    try {
        const body = await readJson(request);
        const includeTags = Array.isArray(body.includeTags) ? body.includeTags : [];
        const excludeTags = Array.isArray(body.excludeTags) ? body.excludeTags : [];
        const tagCounts = body.tagCounts && typeof body.tagCounts === 'object' ? body.tagCounts : (pool.tagCountsCache || {});
        const limit = clampInteger(body.limit, 50, 1, 50);
        const offset = clampInteger(body.offset, 0, 0, Number.MAX_SAFE_INTEGER);

        const searchResult = await pool.executeSearch({
            includeTags,
            excludeTags,
            limit,
            offset,
            tagCounts
        });

        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=30',
            'X-Cache': searchResult.cached ? 'HIT' : 'MISS'
        });
        response.end(JSON.stringify({
            results: searchResult.results,
            count: searchResult.count
        }));
    } catch (error) {
        console.error('Search service error:', error);
        const isTimeout = error.message.includes('timed out');
        const status = isTimeout ? 504 : 400;
        response.writeHead(status, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: isTimeout ? 'Search query timed out' : 'Invalid search request' }));
    }
});

server.listen(port, () => {
    console.log(`OpenedShelf search service listening on port ${port} (poolSize: ${pool.workers.length || 1}, mmap: ${mmapSizeBytes / (1024 * 1024)}MB)`);
});

// Graceful shutdown handling
let isShuttingDown = false;
async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\nReceived ${signal}. Shutting down OpenedShelf query service gracefully...`);

    server.close(() => {
        console.log('HTTP server closed. Terminating database connections and worker pool...');
        pool.close();
        console.log('OpenedShelf query service exited cleanly.');
        process.exit(0);
    });

    // Force exit if drain takes too long
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        pool.close();
        process.exit(1);
    }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', async () => {
    console.log('Received SIGHUP. Reloading tag counts and clearing search cache...');
    try {
        await pool.refreshCache();
        console.log('Cache reloaded successfully via SIGHUP.');
    } catch (err) {
        console.error('Failed to reload cache on SIGHUP:', err);
    }
});

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 1024 * 1024) reject(new Error('Request body too large'));
        });
        request.on('end', () => resolve(JSON.parse(body || '{}')));
        request.on('error', reject);
    });
}

function clampInteger(value, fallback, minimum, maximum) {
    if (!Number.isSafeInteger(value)) return fallback;
    return Math.min(Math.max(value, minimum), maximum);
}