import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const directory = mkdtempSync(path.join(tmpdir(), 'openedshelf-resilience-'));
const databasePath = path.join(directory, 'fixture.sqlite');
const database = new DatabaseSync(databasePath);
database.exec(`
    CREATE TABLE Works (id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, isbn TEXT, short_synopsis TEXT);
    CREATE TABLE Tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, count INTEGER DEFAULT 0);
    CREATE TABLE Works_Tags (work_id TEXT, tag_id TEXT, PRIMARY KEY (work_id, tag_id));
    INSERT INTO Works VALUES ('work-1', 'A Mystery', 'A. Author', 'isbn-1', 'A clue.');
    INSERT INTO Works VALUES ('work-2', 'A Romance', 'B. Author', 'isbn-2', 'A kiss.');
    INSERT INTO Tags VALUES ('genre:mystery', 'genre:mystery', 1);
    INSERT INTO Tags VALUES ('genre:romance', 'genre:romance', 1);
    INSERT INTO Works_Tags VALUES ('work-1', 'genre:mystery');
    INSERT INTO Works_Tags VALUES ('work-2', 'genre:romance');
`);
database.close();

console.log('Testing Query Service Resilience and Pool Concurrency...');

const port = '8910';
const server = spawn(process.execPath, ['query-service/server.mjs'], {
    cwd: path.resolve('.'),
    env: {
        ...process.env,
        R2_DATABASE_PATH: databasePath,
        PORT: port,
        SQLITE_MMAP_SIZE_MB: '512',
        SQLITE_CACHE_SIZE_KB: '16384',
        QUERY_POOL_SIZE: '2',
        SEARCH_CACHE_TTL_MS: '5000'
    },
    stdio: 'pipe'
});

server.stderr.on('data', d => console.error('[Server Error]', d.toString()));

try {
    await waitForServer(port);

    // 1. Health check
    console.log('1. Verifying /health endpoint...');
    const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
    assert.ok(health.pool.poolSize >= 1, 'Pool should have at least 1 worker');
    assert.equal(health.pool.cachedTagsCount, 2, 'Should have cached 2 tags');
    console.log('✓ /health OK. Pool size:', health.pool.poolSize, 'Cached tags:', health.pool.cachedTagsCount);

    // 2. In-memory tag counts
    console.log('2. Verifying fast /tag-counts...');
    const t0 = performance.now();
    const tagCountsRes = await fetch(`http://127.0.0.1:${port}/tag-counts`);
    const tagCountsDuration = performance.now() - t0;
    assert.equal(tagCountsRes.status, 200);
    const tagCounts = await tagCountsRes.json();
    assert.equal(tagCounts.tagCounts['genre:mystery'], 1);
    assert.equal(tagCounts.tagCounts['genre:romance'], 1);
    console.log(`✓ Fast /tag-counts returned in ${tagCountsDuration.toFixed(2)}ms`);

    // 3. Search query and cache MISS -> HIT verification
    console.log('3. Verifying search and LRU cache...');
    const searchBody = JSON.stringify({
        includeTags: ['genre:mystery'],
        excludeTags: [],
        limit: 50,
        offset: 0
    });

    const search1 = await fetch(`http://127.0.0.1:${port}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: searchBody
    });
    assert.equal(search1.status, 200);
    assert.equal(search1.headers.get('X-Cache'), 'MISS');
    const data1 = await search1.json();
    assert.equal(data1.results.length, 1);
    assert.equal(data1.count, 1);

    const search2 = await fetch(`http://127.0.0.1:${port}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: searchBody
    });
    assert.equal(search2.status, 200);
    assert.equal(search2.headers.get('X-Cache'), 'HIT');
    const data2 = await search2.json();
    assert.deepEqual(data1.results, data2.results);
    console.log('✓ Search query cache MISS -> HIT verified.');

    // 4. Concurrent parallel search requests
    console.log('4. Verifying concurrent parallel search requests across pool...');
    const concurrentRequests = Array.from({ length: 6 }, (_, i) =>
        fetch(`http://127.0.0.1:${port}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                includeTags: i % 2 === 0 ? ['genre:mystery'] : ['genre:romance'],
                excludeTags: [],
                limit: 10,
                offset: 0
            })
        }).then(r => r.json())
    );
    const results = await Promise.all(concurrentRequests);
    assert.equal(results.length, 6);
    console.log('✓ 6 concurrent requests handled successfully.');

    // 5. Cache refresh endpoint
    console.log('5. Verifying /admin/refresh-cache...');
    const refreshRes = await fetch(`http://127.0.0.1:${port}/admin/refresh-cache`, { method: 'POST' });
    assert.equal(refreshRes.status, 200);
    const refreshData = await refreshRes.json();
    assert.ok(refreshData.success);
    console.log('✓ Cache refresh verified.');

    console.log('\nAll query service resilience and pool tests PASSED!');
} finally {
    server.kill();
    rmSync(directory, { recursive: true, force: true });
}

async function waitForServer(port) {
    for (let attempt = 0; attempt < 40; attempt++) {
        try {
            const response = await fetch(`http://127.0.0.1:${port}/health`);
            if (response.ok) return;
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Search service did not start in time');
}
