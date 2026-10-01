import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_PATH = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/17c70b0cbaa8bbfcfb92adfb009744335ac779106d070430fa6d10bdc12a3fe0.sqlite');

async function run() {
    console.log("--- Data Cleanup ---");
    const dbPath = process.argv[2] || DEFAULT_DB_PATH;
    
    if (!fs.existsSync(dbPath)) {
        console.error(`Database not found at ${dbPath}`);
        console.error("Please provide the path to your SQLite database as an argument.");
        process.exit(1);
    }
    
    console.log(`Connecting to database at ${dbPath}...`);
    const db = new DatabaseSync(dbPath);

    console.log("1. Trimming whitespace and normalizing dashes in ISBNs (Chunked)...");
    
    // Chunking the massive UPDATE query to prevent CPU overheating
    let lastRowid = 0;
    let totalUpdated = 0;
    while (true) {
        // Fetch the max rowid for this chunk
        const chunkIds = db.prepare(`SELECT rowid FROM Works WHERE rowid > ? ORDER BY rowid ASC LIMIT 500000`).all(lastRowid);
        if (chunkIds.length === 0) break;
        
        const maxRowid = chunkIds[chunkIds.length - 1].rowid;
        
        db.exec('BEGIN TRANSACTION;');
        db.prepare(`
            UPDATE Works SET 
                title = TRIM(title),
                author = TRIM(author),
                isbn = TRIM(REPLACE(isbn, '-', '')),
                short_synopsis = TRIM(short_synopsis)
            WHERE rowid > ? AND rowid <= ?
        `).run(lastRowid, maxRowid);
        db.exec('COMMIT;');
        
        totalUpdated += chunkIds.length;
        lastRowid = maxRowid;
        
        process.stdout.write(`\r[HARDWARE PROTECTION] Updated ${totalUpdated} works. Cooling down for 5s...   `);
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log();
    
    console.log("2. Normalizing empty fields (Chunked)...");
    lastRowid = 0;
    totalUpdated = 0;
    while (true) {
        const chunkIds = db.prepare(`SELECT rowid FROM Works WHERE rowid > ? ORDER BY rowid ASC LIMIT 1000000`).all(lastRowid);
        if (chunkIds.length === 0) break;
        
        const maxRowid = chunkIds[chunkIds.length - 1].rowid;
        
        db.exec('BEGIN TRANSACTION;');
        db.prepare(`UPDATE Works SET author = 'Unknown' WHERE (author IS NULL OR author = '') AND rowid > ? AND rowid <= ?`).run(lastRowid, maxRowid);
        db.prepare(`UPDATE Works SET short_synopsis = NULL WHERE short_synopsis = '' AND rowid > ? AND rowid <= ?`).run(lastRowid, maxRowid);
        db.prepare(`UPDATE Works SET isbn = NULL WHERE isbn = '' AND rowid > ? AND rowid <= ?`).run(lastRowid, maxRowid);
        db.exec('COMMIT;');
        
        totalUpdated += chunkIds.length;
        lastRowid = maxRowid;
        
        process.stdout.write(`\r[HARDWARE PROTECTION] Normalized ${totalUpdated} works. Cooling down for 5s...   `);
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log();

    console.log("3. Deduplicating ISBNs (Merging tags)...");
    const dupIsbns = db.prepare(`
        SELECT isbn, COUNT(*) as cnt 
        FROM Works 
        WHERE isbn IS NOT NULL 
        GROUP BY isbn 
        HAVING cnt > 1
    `).all();

    let mergedCount = 0;
    let deletedCount = 0;

    for (let i = 0; i < dupIsbns.length; i++) {
        const isbn = dupIsbns[i].isbn;
        const works = db.prepare(`SELECT id FROM Works WHERE isbn = ? ORDER BY id ASC`).all(isbn);
        
        if (works.length > 0) {
            const keepId = works[0].id;
            const removeIds = works.slice(1).map(w => w.id);

            db.exec('BEGIN TRANSACTION;');
            try {
                for (const remId of removeIds) {
                    const tagsToMove = db.prepare(`SELECT tag_id FROM Works_Tags WHERE work_id = ?`).all(remId);
                    for (const t of tagsToMove) {
                        try {
                            db.prepare(`INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES (?, ?)`).run(keepId, t.tag_id);
                        } catch (err) {
                            // Ignore FK constraint failures from orphaned tags that don't exist in the Tags table
                        }
                    }
                    db.prepare(`DELETE FROM Works WHERE id = ?`).run(remId);
                    deletedCount++;
                }
                db.exec('COMMIT;');
                mergedCount++;
            } catch (e) {
                db.exec('ROLLBACK;');
                console.error(`Failed to merge ISBN ${isbn}:`, e);
            }
        }
        
        if ((i + 1) % 5000 === 0) {
            process.stdout.write(`\r[HARDWARE PROTECTION] Processed ${i + 1}/${dupIsbns.length} duplicate ISBNs. Cooling down for 5s...   `);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    console.log();

    console.log(`Merged tags for ${mergedCount} duplicate ISBNs.`);
    console.log(`Deleted ${deletedCount} redundant works.`);

    console.log("--- Cleanup Complete ---");
}

run().catch(console.error);
