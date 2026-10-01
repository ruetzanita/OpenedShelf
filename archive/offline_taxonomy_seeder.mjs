import { DatabaseSync } from 'node:sqlite';
import { GENRE_BROWSE_MAP, GENRE_IDENTITY, GENRE_TROPES } from '../src/tags.js';
import { mappings } from '../src/seed_mappings.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudflare D1 local database path (this corresponds to what verify_worker.mjs uses)
const DEFAULT_DB_PATH = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/17c70b0cbaa8bbfcfb92adfb009744335ac779106d070430fa6d10bdc12a3fe0.sqlite');

async function run() {
    console.log("--- Offline Taxonomy Seeder ---");
    const dbPath = process.argv[2] || DEFAULT_DB_PATH;
    
    if (!fs.existsSync(dbPath)) {
        console.error(`Database not found at ${dbPath}`);
        console.error("Please provide the path to your SQLite database as an argument.");
        process.exit(1);
    }
    
    console.log(`Connecting to database at ${dbPath}...`);
    const db = new DatabaseSync(dbPath);
    
    // Build subgenreParentMap to auto-grant parent tags
    const broadGenresSet = new Set();
    for (const tags of Object.values(GENRE_BROWSE_MAP)) {
        for (const t of tags) broadGenresSet.add(t);
    }
    const subgenreParentMap = {}; // tagId -> array of parentTags
    
    const subgenreKeys = Object.keys(GENRE_IDENTITY);
    for (let i = 0; i < subgenreKeys.length; i++) {
        const key = subgenreKeys[i];
        const convention = GENRE_IDENTITY[key];
        for (let j = 0; j < convention.tags.length; j++) {
            const tagId = convention.tags[j];
            if (broadGenresSet.has(tagId)) continue; 
            if (!subgenreParentMap[tagId]) {
                subgenreParentMap[tagId] = [];
            }
            if (!subgenreParentMap[tagId].includes(convention.parentTag)) {
                subgenreParentMap[tagId].push(convention.parentTag);
            }
        }
    }

    // Add tropes to subgenreParentMap too
    const tropeKeys = Object.keys(GENRE_TROPES);
    for (let i = 0; i < tropeKeys.length; i++) {
        const key = tropeKeys[i];
        const data = GENRE_TROPES[key];
        for (let j = 0; j < data.tags.length; j++) {
            const tagId = data.tags[j];
            if (broadGenresSet.has(tagId)) continue; 
            if (!subgenreParentMap[tagId]) {
                subgenreParentMap[tagId] = [];
            }
            if (!subgenreParentMap[tagId].includes(data.parentTag)) {
                subgenreParentMap[tagId].push(data.parentTag);
            }
        }
    }

    console.log("Fetching valid tags from the database...");
    const allTagsRaw = db.prepare("SELECT id, name FROM Tags").all();
    const validTagsSet = new Set(allTagsRaw.map(t => t.id));

    console.log("\n=========================================");
    console.log("PASS 1 & 2: Explicit Mappings (Broad Genres, Identities, Tropes)");
    console.log("=========================================");
    
    let mappingsAdded = 0;
    const insertStmt = db.prepare("INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES (?, ?)");

    for (let i = 0; i < mappings.length; i++) {
        const tagId = mappings[i][0];
        
        if (!validTagsSet.has(tagId)) {
            continue;
        }

        let whereClause = mappings[i][1];
        let params = mappings[i][2];
        const scopedParent = mappings[i][3] || null;

        // Rewrite LIKE clauses to INSTR, preserving AND/OR structure
        whereClause = whereClause.replace(/(\w+)\s+LIKE\s+\?/g, (match, col) => {
            return `INSTR(LOWER(${col}), LOWER(?)) > 0`;
        });

        params = params.map(p => typeof p === 'string' ? p.replace(/%/g, '') : p);

        try {
            const sql = `SELECT id FROM Works WHERE (${whereClause})`;
            const matchingWorks = db.prepare(sql).all(...params);
            
            db.exec('BEGIN TRANSACTION;');
            for (let j = 0; j < matchingWorks.length; j++) {
                const work = matchingWorks[j];
                // Insert primary tag
                const result = insertStmt.run(work.id, tagId);
                if (result.changes > 0) mappingsAdded++;
                
                // Auto-grant parents (scoped to prevent multi-parent cascade)
                if (scopedParent) {
                    // Explicit scope: only grant the specified parent
                    if (validTagsSet.has(scopedParent)) {
                        const pResult = insertStmt.run(work.id, scopedParent);
                        if (pResult.changes > 0) mappingsAdded++;
                    }
                } else {
                    const parentTags = subgenreParentMap[tagId];
                    if (parentTags && parentTags.length === 1 && validTagsSet.has(parentTags[0])) {
                        // Unambiguous: only one parent exists, safe to auto-grant
                        const pResult = insertStmt.run(work.id, parentTags[0]);
                        if (pResult.changes > 0) mappingsAdded++;
                    }
                    // Multi-parent with no scope: skip parent auto-grant to prevent cascade
                }
                
                if ((j + 1) % 5000 === 0) {
                    process.stdout.write(`\r  -> Mapping ${tagId}: processed ${j + 1}/${matchingWorks.length} works... `);
                }
            }
            db.exec('COMMIT;');
            if (matchingWorks.length >= 5000) {
                console.log(); // newline
            }
        } catch (err) {
            console.error(`Crash on mapping: ${tagId}`);
            console.error(`Params: ${JSON.stringify(params)}`);
            throw err;
        }

        // Print mapping progress and trigger cooldowns
        process.stdout.write(`\r[Pass 1&2] Processed mapping ${i + 1}/${mappings.length}... `);
        
        if (i > 0 && i % 20 === 0) {
            process.stdout.write(`\r[Pass 1&2] Processed mapping ${i + 1}/${mappings.length}. [HARDWARE PROTECTION] Cooling down for 7s...   `);
            await new Promise(r => setTimeout(r, 7000));
            console.log();
        }
    }
    
    console.log(`Explicit mappings added: ${mappingsAdded}`);

    console.log("\n=========================================");
    console.log("PASS 3 & 4: Dynamic Fallback Parsing (Thematic & Orphan Catching)");
    console.log("=========================================");
    
    const tagRegexes = allTagsRaw.map(tag => {
        let cleanName = tag.name.replace(/^(genre|trope):/, '').toLowerCase();
        const regexStr = cleanName.split('_').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[ -]');
        return {
            id: tag.id,
            regex: new RegExp(`\\b${regexStr}\\b`, 'i'),
            parentTags: (subgenreParentMap[tag.id] || []).filter(p => validTagsSet.has(p))
        };
    });

    let regexMappingsAdded = 0;
    let offset = 0;
    const CHUNK_SIZE = 100000;

    while (true) {
        console.log(`\nLoading works chunk LIMIT ${CHUNK_SIZE} OFFSET ${offset}...`);
        const chunk = db.prepare(`SELECT id, short_synopsis FROM Works WHERE short_synopsis IS NOT NULL AND short_synopsis != '' LIMIT ${CHUNK_SIZE} OFFSET ${offset}`).all();
        
        if (chunk.length === 0) {
            break;
        }

        db.exec('BEGIN TRANSACTION;');
        for (let i = 0; i < chunk.length; i++) {
            const work = chunk[i];
            for (const tagInfo of tagRegexes) {
                if (tagInfo.regex.test(work.short_synopsis)) {
                    const res = insertStmt.run(work.id, tagInfo.id);
                    if (res.changes > 0) regexMappingsAdded++;
                    
                    for (const parentTag of tagInfo.parentTags) {
                        const pRes = insertStmt.run(work.id, parentTag);
                        if (pRes.changes > 0) regexMappingsAdded++;
                    }
                }
            }

            // Print update intervals and trigger cooldowns for regex pass
            if ((i + 1) % 1000 === 0) {
                process.stdout.write(`\r[Pass 3&4] Regex checked ${offset + i + 1} works... `);
            }
            if ((i + 1) % 25000 === 0) {
                db.exec('COMMIT;');
                process.stdout.write(`\r[Pass 3&4] Regex checked ${offset + i + 1} works. [HARDWARE PROTECTION] Cooling down for 7s...   `);
                await new Promise(r => setTimeout(r, 7000));
                db.exec('BEGIN TRANSACTION;');
            }
        }
        db.exec('COMMIT;');

        offset += CHUNK_SIZE;
        console.log(`\n[HARDWARE PROTECTION] Memory cleanup and 7s cooldown after chunk...`);
        await new Promise(r => setTimeout(r, 7000));
    }
    
    console.log(`Regex fallback mappings added: ${regexMappingsAdded}`);

    console.log("\n=========================================");
    console.log("FINAL CLEANUP: Purging Orphans (0 tags & 0 metadata)");
    console.log("=========================================");
    
    try {
        db.exec('BEGIN TRANSACTION;');
        const deleteRes = db.prepare(`
            DELETE FROM Works 
            WHERE id NOT IN (
                SELECT work_id 
                FROM Works_Tags 
                WHERE tag_id NOT LIKE 'lang_%'
            ) 
            AND (author = 'Unknown' OR author IS NULL) 
            AND isbn IS NULL
        `).run();
        db.exec('COMMIT;');
        console.log(`SUCCESS: Dropped ${deleteRes.changes} completely orphaned works.`);
    } catch (err) {
        console.error("Failed to delete orphans:", err);
    }

    console.log("\n--- Taxonomy Seeding Complete! ---");
    console.log(`Total new mappings inserted: ${mappingsAdded + regexMappingsAdded}`);
}

run().catch(console.error);
