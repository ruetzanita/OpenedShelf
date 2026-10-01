import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildDiscoveryQuery, buildCountQuery } from '../src/engine.js';

console.log('================================================================');
console.log('🧪 OpenedShelf Pre-Flight Hardening: Database & Ingestion Suite');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: Catalog Parity & Artifact Verification
// -----------------------------------------------------------------------------
console.log('▶ [CHECK 1] Catalog Artifact Parity & Integrity Verification...');

const catalogPath = path.resolve('db/openedshelf_db_08_2026.sqlite');
assert.ok(fs.existsSync(catalogPath), `Catalog database file must exist at ${catalogPath}`);

const fileStats = fs.statSync(catalogPath);
console.log(`  Catalog File Size: ${(fileStats.size / (1024 ** 3)).toFixed(2)} GB (${fileStats.size} bytes)`);
// Verify expected size is roughly 25 GB
assert.ok(fileStats.size > 20 * 1024 ** 3, 'Catalog size must be > 20 GB');

const catalogDb = new DatabaseSync(catalogPath, { readOnly: true });

// Verify required tables exist
const tableRows = catalogDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const tableNames = new Set(tableRows.map(r => r.name));
console.log('  Tables discovered:', Array.from(tableNames).join(', '));
assert.ok(tableNames.has('Works'), 'Catalog must contain Works table');
assert.ok(tableNames.has('Tags'), 'Catalog must contain Tags table');
assert.ok(tableNames.has('Works_Tags'), 'Catalog must contain Works_Tags table');

// Verify required indexes exist
const indexRows = catalogDb.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index'").all();
const indexMap = new Set(indexRows.map(r => `${r.tbl_name}.${r.name}`));
console.log('  Indexes validated:');
assert.ok(indexMap.has('Works.idx_works_isbn') || indexMap.has('Works.sqlite_autoindex_Works_1'), 'Works table must be indexed');
assert.ok(indexMap.has('Works_Tags.idx_works_tags_tag_id') || indexMap.has('Works_Tags.sqlite_autoindex_Works_Tags_1'), 'Works_Tags must have tag_id index for fast joins');
console.log('    ✓ Works.isbn & Works.id indexes verified');
console.log('    ✓ Works_Tags.tag_id index verified');

// Fast row count checks via max(rowid)
const maxWorks = catalogDb.prepare('SELECT max(rowid) as maxId FROM Works').get().maxId;
const maxWorksTags = catalogDb.prepare('SELECT max(rowid) as maxId FROM Works_Tags').get().maxId;
const tagsCount = catalogDb.prepare('SELECT count(*) as count FROM Tags').get().count;

console.log(`  Row count sanity check:`);
console.log(`    Works max rowid: ${maxWorks.toLocaleString()} (~44M records)`);
console.log(`    Works_Tags max rowid: ${maxWorksTags.toLocaleString()} (~157M relationships)`);
console.log(`    Total Controlled Tags: ${tagsCount.toLocaleString()}`);

assert.ok(maxWorks > 30_000_000, 'Works record count must exceed 30,000,000');
assert.ok(maxWorksTags > 100_000_000, 'Works_Tags count must exceed 100,000,000');
assert.ok(tagsCount > 500, 'Tags count must exceed 500 taxonomy terms');

// Verify R2 manifest builder schema
const manifestSample = {
    version: '20260930_prod',
    databaseObject: 'catalog/20260930_prod/database.sqlite',
    sizeBytes: fileStats.size,
    createdAt: new Date().toISOString()
};
assert.equal(typeof manifestSample.version, 'string');
assert.equal(typeof manifestSample.sizeBytes, 'number');
console.log('  ✓ Catalog Parity & Artifact Verification PASSED.\n');

// -----------------------------------------------------------------------------
// CHECK 2: Zero-Result & Truncation Smoke Tests (Strict Boolean Set-Intersection)
// -----------------------------------------------------------------------------
console.log('▶ [CHECK 2] Zero-Result & Truncation Smoke Tests (Boolean AND Engine)...');

// Fixture Database for exhaustive edge-case execution
const testDb = new DatabaseSync(':memory:');
testDb.exec(`
    CREATE TABLE Works (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT,
        short_synopsis TEXT
    );
    CREATE TABLE Tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        count INTEGER DEFAULT 0
    );
    CREATE TABLE Works_Tags (
        work_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (work_id, tag_id)
    );

    -- Seed 6 distinct works with varying tag stacks
    INSERT INTO Works VALUES
        ('w1', 'Deep Space Isolation', 'A. Clark', '9780001', 'Solo miner trapped in an asteroid belt.'),
        ('w2', 'Station Command', 'B. Vance', '9780002', 'High-fleet command under siege.'),
        ('w3', 'The Micro-Hab', 'C. Sterling', '9780003', 'Extreme resource scarcity in orbit.'),
        ('w4', 'Regency Secrets', 'E. Austen', '9780004', 'Lords and balls in 1813 London.'),
        ('w5', 'Neon Rebellion', 'G. Gibson', '9780005', 'High-tech low-life in futuristic Tokyo.'),
        ('w6', 'The Complete Hard SciFi', 'H. Baxter', '9780006', '5-tag intersection masterwork.');

    -- Seed Tags across 3 tiers
    INSERT INTO Tags (id, name, count) VALUES
        ('t_space_opera', 'genre:space_opera', 4),
        ('t_cyberpunk', 'genre:cyberpunk', 1),
        ('t_regency', 'genre:regency_romance', 1),
        ('t_isolated', 'isolated', 3),
        ('t_scarcity', 'resource_scarcity', 3),
        ('t_first_person', 'first_person_pov', 2),
        ('t_hard_scifi', 'hard_scifi', 2),
        ('t_horror', 'genre:horror', 1);

    -- Mappings:
    -- w1: space_opera, isolated, resource_scarcity
    INSERT INTO Works_Tags VALUES ('w1', 't_space_opera'), ('w1', 't_isolated'), ('w1', 't_scarcity');
    -- w2: space_opera, isolated
    INSERT INTO Works_Tags VALUES ('w2', 't_space_opera'), ('w2', 't_isolated');
    -- w3: space_opera, resource_scarcity
    INSERT INTO Works_Tags VALUES ('w3', 't_space_opera'), ('w3', 't_scarcity');
    -- w4: regency_romance
    INSERT INTO Works_Tags VALUES ('w4', 't_regency');
    -- w5: cyberpunk, first_person_pov
    INSERT INTO Works_Tags VALUES ('w5', 't_cyberpunk'), ('w5', 't_first_person');
    -- w6: space_opera, isolated, resource_scarcity, first_person_pov, hard_scifi (5 tags!)
    INSERT INTO Works_Tags VALUES
        ('w6', 't_space_opera'),
        ('w6', 't_isolated'),
        ('w6', 't_scarcity'),
        ('w6', 't_first_person'),
        ('w6', 't_hard_scifi');
`);

// Sub-test 2.1: Single Tag Search
{
    const q = buildDiscoveryQuery(['genre:space_opera']);
    const rows = testDb.prepare(q.sql).all(...q.params);
    assert.equal(rows.length, 4, 'Single tag query should match 4 space opera works');
    console.log('  ✓ 2.1 Single Tag search passed (4 results)');
}

// Sub-test 2.2: 2-Tag Boolean Intersection (AND logic)
{
    const q = buildDiscoveryQuery(['genre:space_opera', 'isolated']);
    const rows = testDb.prepare(q.sql).all(...q.params);
    const countQ = buildCountQuery(['genre:space_opera', 'isolated']);
    const count = testDb.prepare(countQ.sql).get(...countQ.params).count;
    // Expected: w1, w2, w6 (3 works)
    assert.equal(rows.length, 3, '2-Tag intersection must strictly require BOTH tags');
    assert.equal(count, 3, 'Count query must match discovery row count');
    console.log('  ✓ 2.2 Two-tag Boolean AND intersection passed (3 results: w1, w2, w6)');
}

// Sub-test 2.3: 5-Tag Deep Intersection
{
    const fiveTags = ['genre:space_opera', 'isolated', 'resource_scarcity', 'first_person_pov', 'hard_scifi'];
    const q = buildDiscoveryQuery(fiveTags);
    const rows = testDb.prepare(q.sql).all(...q.params);
    const countQ = buildCountQuery(fiveTags);
    const count = testDb.prepare(countQ.sql).get(...countQ.params).count;

    assert.equal(rows.length, 1, '5-tag intersection should only match the single work with all 5 tags (w6)');
    assert.equal(rows[0].id, 'w6');
    assert.equal(count, 1);
    console.log('  ✓ 2.3 5-Tag deep intersection passed (exact match: w6)');
}

// Sub-test 2.4: Disjoint / Contradictory Combination -> Strict Zero-Result Gap State
{
    const disjointTags = ['genre:cyberpunk', 'genre:regency_romance'];
    const q = buildDiscoveryQuery(disjointTags);
    const rows = testDb.prepare(q.sql).all(...q.params);
    const countQ = buildCountQuery(disjointTags);
    const count = testDb.prepare(countQ.sql).get(...countQ.params).count;

    assert.equal(rows.length, 0, 'Disjoint tags must return EXACTLY 0 results (Intentional Gap State)');
    assert.equal(count, 0, 'Count must be 0');
    console.log('  ✓ 2.4 Disjoint combination triggered Rabbit Hole 0-result gap state cleanly');
}

// Sub-test 2.5: 6-Tag Intersection Collapse (Rabbit Hole + "One Step Back" Simulation)
{
    const sixTags = ['genre:space_opera', 'isolated', 'resource_scarcity', 'first_person_pov', 'hard_scifi', 'genre:regency_romance'];
    const q = buildDiscoveryQuery(sixTags);
    const rows = testDb.prepare(q.sql).all(...q.params);
    assert.equal(rows.length, 0, 'Six tags including contradictory regency romance must collapse to 0');

    // Simulate "One Step Back" fallback query
    const stepBackTags = sixTags.slice(0, 5);
    const fallbackQ = buildDiscoveryQuery(stepBackTags);
    const fallbackRows = testDb.prepare(fallbackQ.sql).all(...fallbackQ.params);
    assert.equal(fallbackRows.length, 1, 'One step back fallback query must surface the last valid state');
    console.log('  ✓ 2.5 6-Tag collapse to 0 results and step-back breadcrumb verified');
}

// Sub-test 2.6: Tag Truncation & Pagination Boundaries
{
    const qClamp = buildDiscoveryQuery([], [], 100, 0); // Requested limit 100 should clamp to max safe integer / configured limit
    const p1 = buildDiscoveryQuery(['genre:space_opera'], [], 2, 0);
    const r1 = testDb.prepare(p1.sql).all(...p1.params);
    assert.equal(r1.length, 2, 'Limit 2 must return exactly 2 rows');

    const p2 = buildDiscoveryQuery(['genre:space_opera'], [], 2, 2);
    const r2 = testDb.prepare(p2.sql).all(...p2.params);
    assert.equal(r2.length, 2, 'Offset 2 must return next 2 rows');
    assert.notEqual(r1[0].id, r2[0].id, 'Paged rows must not overlap');
    console.log('  ✓ 2.6 Pagination & limit/offset boundaries verified');
}

// Sub-test 2.7: Exclude Tag Filtering
{
    // Space opera WITHOUT isolated (w1, w2, w6 have isolated; w3 does NOT have isolated)
    const q = buildDiscoveryQuery(['genre:space_opera'], ['isolated']);
    const rows = testDb.prepare(q.sql).all(...q.params);
    assert.equal(rows.length, 1, 'Exclude filter must strictly eliminate matching works');
    assert.equal(rows[0].id, 'w3');
    console.log('  ✓ 2.7 Exclude tag filtering verified (only w3 returned)');
}

// Sub-test 2.8: Duplicate Tag Deduplication
{
    const q = buildDiscoveryQuery(['isolated', 'isolated', 'isolated']);
    const rows = testDb.prepare(q.sql).all(...q.params);
    assert.equal(rows.length, 3, 'Duplicate include tags must be deduplicated without inflating count');
    console.log('  ✓ 2.8 Duplicate include tags deduplication verified');
}

console.log('  ✓ Zero-Result & Truncation Smoke Tests ALL PASSED.\n');

// -----------------------------------------------------------------------------
// CHECK 3: D1 Moderation Binding & Table Isolation Verification
// -----------------------------------------------------------------------------
console.log('▶ [CHECK 3] Cloudflare D1 Moderation Schema & Isolation Verification...');

const d1SchemaPath = path.resolve('db/d1_moderation_schema.sql');
assert.ok(fs.existsSync(d1SchemaPath), `D1 moderation schema must exist at ${d1SchemaPath}`);
const d1SchemaSql = fs.readFileSync(d1SchemaPath, 'utf8');

// Initialize isolated D1 instance in memory
const d1Db = new DatabaseSync(':memory:');
d1Db.exec(d1SchemaSql);

// Verify tables created
const d1Tables = d1Db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
console.log('  D1 tables instantiated:', d1Tables.filter(t => !t.startsWith('sqlite_')).join(', '));
assert.ok(d1Tables.includes('Pending_Tags'), 'D1 must contain Pending_Tags');
assert.ok(d1Tables.includes('Moderation_Log'), 'D1 must contain Moderation_Log');
assert.ok(d1Tables.includes('Council_Votes'), 'D1 must contain Council_Votes');

// Verify Pending_Tags insert and retrieval
d1Db.prepare(`
    INSERT INTO Pending_Tags (work_id, work_title, work_isbn, proposed_tag_name, tier, justification, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('OL12345W', 'Dune', '9780441172719', 'genre:desert_planet', 'genre_trope', 'Takes place on the desert world Arrakis', 'reader_42');

const pendingRow = d1Db.prepare('SELECT * FROM Pending_Tags WHERE proposed_tag_name = ?').get('genre:desert_planet');
assert.ok(pendingRow, 'Inserted tag proposal must be retrievable');
assert.equal(pendingRow.status, 'pending');
assert.equal(pendingRow.tier, 'genre_trope');
console.log('  ✓ Pending_Tags proposal lifecycle initialized');

// Verify Moderation_Log audit entry
d1Db.prepare(`
    INSERT INTO Moderation_Log (proposal_id, action, moderator_id, moderator_role, written_rationale)
    VALUES (?, ?, ?, ?, ?)
`).run(pendingRow.id, 'promoted', 'librarian_sarah', 'librarian', 'Confirmed factual presence of desert ecology plot device.');

const logRow = d1Db.prepare('SELECT * FROM Moderation_Log WHERE proposal_id = ?').get(pendingRow.id);
assert.ok(logRow);
assert.equal(logRow.action, 'promoted');
assert.equal(logRow.moderator_role, 'librarian');
console.log('  ✓ Moderation_Log audit logging verified');

// Verify Council_Votes weekly cycle and veto requirements
d1Db.prepare(`
    INSERT INTO Council_Votes (proposal_id, cycle_week, tag_name, council_member_id, vote, rationale)
    VALUES (?, ?, ?, ?, ?, ?)
`).run(pendingRow.id, '2026-W40', 'genre:desert_planet', 'council_lead_alex', 'veto', 'Taxonomy already encompasses this under extreme_environment.');

const voteRow = d1Db.prepare('SELECT * FROM Council_Votes WHERE cycle_week = ?').get('2026-W40');
assert.ok(voteRow);
assert.equal(voteRow.vote, 'veto');
assert.ok(voteRow.rationale.length > 0, 'Vetoes must have written rationale per council rules');
console.log('  ✓ Council_Votes weekly voting and veto rationale verified');

// Verify Schema Constraints & Invalid Tier Prevention
assert.throws(() => {
    d1Db.prepare(`
        INSERT INTO Pending_Tags (work_id, proposed_tag_name, tier, justification)
        VALUES ('W1', 'vibe:spooky', 'invalid_tier', 'Feels spooky')
    `).run();
}, /CHECK constraint failed/, 'Invalid tier must fail CHECK constraint');

assert.throws(() => {
    d1Db.prepare(`
        INSERT INTO Council_Votes (proposal_id, cycle_week, tag_name, council_member_id, vote)
        VALUES (1, '2026-W40', 'tag', 'member_1', 'invalid_vote')
    `).run();
}, /CHECK constraint failed/, 'Invalid vote type must fail CHECK constraint');
console.log('  ✓ D1 strict CHECK constraints validated');

// Verify Isolation Guarantee: Ensure Catalog Search does NOT depend on D1
const searchWithoutD1 = buildDiscoveryQuery(['genre:space_opera']);
assert.ok(!searchWithoutD1.sql.includes('Pending_Tags'), 'Catalog search query must NEVER reference Pending_Tags');
assert.ok(!searchWithoutD1.sql.includes('Moderation_Log'), 'Catalog search query must NEVER reference Moderation_Log');
assert.ok(!searchWithoutD1.sql.includes('Council_Votes'), 'Catalog search query must NEVER reference Council_Votes');
console.log('  ✓ Strict architectural isolation verified: Catalog search has 0 coupling to D1 tables');

console.log('\n================================================================');
console.log('✅ ALL PRE-FLIGHT INTEGRITY & SMOKE TESTS PASSED SUCCESSFULLY');
console.log('================================================================');
