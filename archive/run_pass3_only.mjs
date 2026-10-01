import { DatabaseSync } from 'node:sqlite';
import { GENRE_BROWSE_MAP, GENRE_IDENTITY, GENRE_TROPES } from '../src/tags.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_PATH = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/17c70b0cbaa8bbfcfb92adfb009744335ac779106d070430fa6d10bdc12a3fe0.sqlite');

async function run() {
    console.log("--- Offline Taxonomy Seeder (PASS 3 & 4 ONLY) ---");
    const dbPath = process.argv[2] || DEFAULT_DB_PATH;
    
    if (!fs.existsSync(dbPath)) {
        console.error(`Database not found at ${dbPath}`);
        process.exit(1);
    }
    
    const db = new DatabaseSync(dbPath);
    
    const broadGenresSet = new Set();
    for (const tags of Object.values(GENRE_BROWSE_MAP)) {
        for (const t of tags) broadGenresSet.add(t);
    }
    const subgenreParentMap = {}; 
    
    const subgenreKeys = Object.keys(GENRE_IDENTITY);
    for (let i = 0; i < subgenreKeys.length; i++) {
        const convention = GENRE_IDENTITY[subgenreKeys[i]];
        for (let j = 0; j < convention.tags.length; j++) {
            const tagId = convention.tags[j];
            if (broadGenresSet.has(tagId)) continue; 
            if (!subgenreParentMap[tagId]) subgenreParentMap[tagId] = [];
            if (!subgenreParentMap[tagId].includes(convention.parentTag)) subgenreParentMap[tagId].push(convention.parentTag);
        }
    }

    const tropeKeys = Object.keys(GENRE_TROPES);
    for (let i = 0; i < tropeKeys.length; i++) {
        const data = GENRE_TROPES[tropeKeys[i]];
        for (let j = 0; j < data.tags.length; j++) {
            const tagId = data.tags[j];
            if (broadGenresSet.has(tagId)) continue; 
            if (!subgenreParentMap[tagId]) subgenreParentMap[tagId] = [];
            if (!subgenreParentMap[tagId].includes(data.parentTag)) subgenreParentMap[tagId].push(data.parentTag);
        }
    }

    const allTagsRaw = db.prepare("SELECT id, name FROM Tags").all();
    const validTagsSet = new Set(allTagsRaw.map(t => t.id));

    const insertStmt = db.prepare("INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES (?, ?)");

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

    console.log("Starting Pass 3 & 4...");

    while (true) {
        console.log(`\nLoading works chunk LIMIT ${CHUNK_SIZE} OFFSET ${offset}...`);
        const chunk = db.prepare(`SELECT id, short_synopsis FROM Works WHERE short_synopsis IS NOT NULL AND short_synopsis != '' LIMIT ${CHUNK_SIZE} OFFSET ${offset}`).all();
        
        if (chunk.length === 0) break;

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
}

run().catch(console.error);
