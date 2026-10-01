import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const directory = mkdtempSync(path.join(tmpdir(), 'openedshelf-search-'));
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

const server = spawn(process.execPath, ['query-service/server.mjs'], {
    cwd: path.resolve('.'),
    env: { ...process.env, R2_DATABASE_PATH: databasePath, PORT: '8899' },
    stdio: 'ignore'
});

try {
    await waitForServer();
    const response = await fetch('http://127.0.0.1:8899/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeTags: ['genre:mystery'], excludeTags: [], tagCounts: { 'genre:mystery': 1 }, limit: 50, offset: 0 })
    });
    assert.equal(response.status, 200);
    const creditsResponse = await fetch('http://127.0.0.1:8899/credits');
    assert.equal(creditsResponse.status, 200);
    const creditsPayload = await creditsResponse.json();
    assert.equal(creditsPayload.credits.engine_license, 'AGPL-3.0-or-later');
    assert.equal(creditsPayload.credits.taxonomy_license, 'CC0-1.0');
    assert.equal(creditsPayload.credits.sources.length, 4);

    console.log('Search service fixture test passed.');
} finally {
    server.kill();
    rmSync(directory, { recursive: true, force: true });
}

async function waitForServer() {
    for (let attempt = 0; attempt < 40; attempt++) {
        try {
            const response = await fetch('http://127.0.0.1:8899/tag-counts');
            if (response.ok) return;
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Search service did not start');
}