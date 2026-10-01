const fs = require('fs');
const readline = require('readline');
const path = require('path');
const zlib = require('zlib');
const Database = require('better-sqlite3');

// Robust SQL string escaper
function sqlEsc(str) {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '').replace(/[\x00-\x1f]/g, '');
}

// Map Open Library subjects to tags is now handled by offline_taxonomy_seeder.mjs
function makeId(key) {
    return key.replace('/works/', '').toLowerCase();
}

class WorkIdSet {
    constructor(maxSize = 200000000) {
        this.maxSize = maxSize;
        this.bitMap = new Uint8Array(Math.ceil(maxSize / 8));
        this.fallbackSet = new Set();
    }
    add(id) {
        if (id.startsWith('ol') && id.endsWith('w')) {
            const numStr = id.slice(2, -1);
            let isNum = true;
            for (let i = 0; i < numStr.length; i++) {
                if (numStr.charCodeAt(i) < 48 || numStr.charCodeAt(i) > 57) {
                    isNum = false; break;
                }
            }
            if (isNum) {
                const num = parseInt(numStr, 10);
                if (num < this.maxSize) {
                    this.bitMap[Math.floor(num / 8)] |= (1 << (num % 8));
                    return;
                }
            }
        }
        this.fallbackSet.add(id);
    }
    has(id) {
        if (id.startsWith('ol') && id.endsWith('w')) {
            const numStr = id.slice(2, -1);
            let isNum = true;
            for (let i = 0; i < numStr.length; i++) {
                if (numStr.charCodeAt(i) < 48 || numStr.charCodeAt(i) > 57) {
                    isNum = false; break;
                }
            }
            if (isNum) {
                const num = parseInt(numStr, 10);
                if (num < this.maxSize) {
                    return (this.bitMap[Math.floor(num / 8)] & (1 << (num % 8))) !== 0;
                }
            }
        }
        return this.fallbackSet.has(id);
    }
}

async function processDump(inputFile, outputFile, maxWorks = Infinity, logUnmapped = false) {
    const unmappedSample = new Set();
    const validWorksSet = new WorkIdSet();
    const updatedWorksSet = new WorkIdSet();
    
    console.log(`Starting to process Open Library dump: ${inputFile}`);
    console.log(`Outputting SQL to: ${outputFile}`);
    if (maxWorks !== Infinity) console.log(`LIMIT: Stopping after ${maxWorks} tagged works`);

    // Initialize Author Map DB
    const dbPath = path.join(__dirname, 'authors_map.db');
    const authorDb = new Database(dbPath);
    authorDb.pragma('journal_mode = WAL');
    authorDb.pragma('synchronous = OFF');
    
    authorDb.exec(`
        CREATE TABLE IF NOT EXISTS authors (
            id TEXT PRIMARY KEY,
            name TEXT
        );
    `);
    
    // Check if we need to run Pass 1
    const { count: authorCount } = authorDb.prepare('SELECT count(*) as count FROM authors').get();
    
    let buffer = '';
    const BUFFER_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB buffer before writing to disk

    function getStream() {
        let stream = fs.createReadStream(inputFile);
        if (inputFile.endsWith('.gz')) {
            stream = stream.pipe(zlib.createGunzip());
        }
        return readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });
    }

    // ==========================================
    // PASS 1: Extract Authors (if needed)
    // ==========================================
    if (authorCount === 0) {
        console.log(`\n--- PASS 1: Building Reusable Author Map ---`);
        const rlAuthor = getStream();
        let linesAuthor = 0;
        let authorsAdded = 0;
        
        const insertAuthor = authorDb.prepare('INSERT OR IGNORE INTO authors (id, name) VALUES (?, ?)');
        const insertManyAuthors = authorDb.transaction((authors) => {
            for (const author of authors) insertAuthor.run(author.id, author.name);
        });
        
        let batch = [];
        
        for await (const line of rlAuthor) {
            linesAuthor++;
            if (linesAuthor % 100000 === 0) {
                process.stdout.write(`\rPass 1: Processed ${linesAuthor} lines. Authors kept: ${authorsAdded}      `);
            }

            const parts = line.split('\t');
            if (parts.length < 5) continue;
            if (parts[0] !== '/type/author') continue;

            let authorData;
            try { authorData = JSON.parse(parts[4]); } catch (e) { continue; }

            if (authorData.name && authorData.key) {
                const authorId = authorData.key.replace('/authors/', '').toLowerCase();
                batch.push({ id: authorId, name: sqlEsc(authorData.name) });
                authorsAdded++;
                
                if (batch.length >= 10000) {
                    insertManyAuthors(batch);
                    batch = [];
                }
            }
        }
        if (batch.length > 0) {
            insertManyAuthors(batch);
        }
        console.log(`\nPass 1 complete. Saved ${authorsAdded} authors to map.`);
    } else {
        console.log(`\n--- PASS 1 SKIPPED: Found ${authorCount} authors in existing map ---`);
    }

    let sql = '-- OpenedShelf Bulk Seed: Extracted from Open Library Data Dump\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    sql += 'PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n';
    fs.writeFileSync(outputFile, sql);

    let worksTagged = 0;
    let totalTags = 0;
    
    // Prepare author lookup statement
    const getAuthor = authorDb.prepare('SELECT name FROM authors WHERE id = ?');

    // ==========================================
    // PASS 2: Extract Works and Base Data
    // ==========================================
    console.log(`\n--- PASS 2: Extracting Works and Language Metadata ---`);
    const rl1 = getStream();
    let lines1 = 0;

    for await (const line of rl1) {
        lines1++;
        if (lines1 % 100000 === 0) {
            process.stdout.write(`\rPass 2: Processed ${lines1} lines. Works kept: ${worksTagged}      `);
        }
        if (lines1 % 500000 === 0) {
            console.log(`\n[HARDWARE PROTECTION] Cooling down for 5 seconds...`);
            await new Promise(r => setTimeout(r, 5000));
        }

        const parts = line.split('\t');
        if (parts.length < 5) continue;
        if (parts[0] !== '/type/work') continue;

        let workData;
        try { workData = JSON.parse(parts[4]); } catch (e) { continue; }

        const subjects = workData.subjects || [];
        const tags = []; 

        if (workData.languages && Array.isArray(workData.languages)) {
            workData.languages.forEach(l => {
                if (l.key && l.key.startsWith('/languages/')) {
                    tags.push('lang_' + l.key.replace('/languages/', '').toLowerCase());
                }
            });
        }

        if (tags.length === 0 && subjects.length === 0) {
            if (logUnmapped && unmappedSample.size < 100) {
                subjects.forEach(s => unmappedSample.add(s));
            }
        }

        worksTagged++;
        totalTags += tags.length;

        const id = makeId(parts[1]);
        validWorksSet.add(id); 

        const title = sqlEsc(workData.title || 'Untitled');
        const synopsis = sqlEsc(subjects.slice(0, 8).join(', '));
        
        let authorName = 'Unknown';
        if (workData.authors && Array.isArray(workData.authors) && workData.authors.length > 0) {
            const firstAuthorRef = workData.authors[0];
            if (firstAuthorRef.author && firstAuthorRef.author.key) {
                const authorId = firstAuthorRef.author.key.replace('/authors/', '').toLowerCase();
                const row = getAuthor.get(authorId);
                if (row && row.name) {
                    authorName = row.name;
                }
            }
        }

        let insertSql = `INSERT OR IGNORE INTO Works (id, title, author, short_synopsis) VALUES ('${id}', '${title}', '${authorName}', '${synopsis}');\n`;
        for (const tagId of tags) {
            insertSql += `INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES ('${id}', '${tagId}');\n`;
        }

        buffer += insertSql;
        if (buffer.length > BUFFER_SIZE_LIMIT) {
            fs.appendFileSync(outputFile, buffer);
            buffer = '';
        }

        if (worksTagged >= maxWorks) {
            console.log(`\nReached limit of ${maxWorks} works. Stopping Pass 2 early.`);
            rl1.close();
            break;
        }
    }

    // ==========================================
    // PASS 3: Extract Edition Languages
    // ==========================================
    console.log(`\n\n--- PASS 3: Extracting Edition Languages & Fallback Authors ---`);
    const rl2 = getStream();
    let lines2 = 0;

    for await (const line of rl2) {
        lines2++;
        if (lines2 % 100000 === 0) {
            process.stdout.write(`\rPass 3: Processed ${lines2} lines. Total tags: ${totalTags}      `);
        }
        if (lines2 % 500000 === 0) {
            console.log(`\n[HARDWARE PROTECTION] Cooling down for 7 seconds...`);
            await new Promise(r => setTimeout(r, 7000));
        }

        const parts = line.split('\t');
        if (parts.length < 5) continue;
        if (parts[0] !== '/type/edition') continue;

        let workData;
        try { workData = JSON.parse(parts[4]); } catch (e) { continue; }

        if (workData.works && Array.isArray(workData.works)) {
            let authorStr = null;
            if (workData.by_statement) {
                authorStr = sqlEsc(workData.by_statement);
            }
            let isbnStr = null;
            if (workData.isbn_13 && Array.isArray(workData.isbn_13) && workData.isbn_13.length > 0) {
                isbnStr = sqlEsc(workData.isbn_13[0]);
            } else if (workData.isbn_10 && Array.isArray(workData.isbn_10) && workData.isbn_10.length > 0) {
                isbnStr = sqlEsc(workData.isbn_10[0]);
            }

            const editionTags = [];
            if (workData.languages && Array.isArray(workData.languages)) {
                workData.languages.forEach(l => {
                    if (l.key && l.key.startsWith('/languages/')) {
                        editionTags.push('lang_' + l.key.replace('/languages/', '').toLowerCase());
                    }
                });
            }

            if (editionTags.length > 0 || authorStr || isbnStr) {
                workData.works.forEach(w => {
                    if (w.key && w.key.startsWith('/works/')) {
                        const wId = makeId(w.key);
                        if (validWorksSet.has(wId)) {
                            for (const t of editionTags) {
                                buffer += `INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES ('${wId}', '${t}');\n`;
                                totalTags++;
                            }

                            if ((authorStr || isbnStr) && !updatedWorksSet.has(wId)) {
                                const updates = [];
                                // Only update author if we couldn't resolve it in Pass 2
                                if (authorStr) updates.push(`author = '${authorStr}'`);
                                if (isbnStr) updates.push(`isbn = '${isbnStr}'`);
                                // The fallback only updates rows where author is STILL 'Unknown'
                                buffer += `UPDATE Works SET ${updates.join(', ')} WHERE id = '${wId}' AND author = 'Unknown';\n`;
                                updatedWorksSet.add(wId);
                            }
                        }
                    }
                });

                if (buffer.length > BUFFER_SIZE_LIMIT) {
                    fs.appendFileSync(outputFile, buffer);
                    buffer = '';
                }
            }
        }
    }

    if (buffer.length > 0) {
        fs.appendFileSync(outputFile, buffer);
    }

    fs.appendFileSync(outputFile, '\nCOMMIT;\nPRAGMA foreign_keys = ON;\n');

    console.log(`\n\nFinished processing!`);
    console.log(`Total lines read: Pass2=${lines1}, Pass3=${lines2}`);
    console.log(`Works with mapped tags: ${worksTagged}`);
    console.log(`Total tags assigned: ${totalTags}`);
    console.log(`Average tags per mapped work: ${(worksTagged > 0 ? totalTags / worksTagged : 0).toFixed(2)}`);

    if (logUnmapped && unmappedSample.size > 0) {
        console.log(`\nSample of Unmapped Subjects (to help expand SUBJECT_TAG_MAP):`);
        console.log([...unmappedSample].slice(0, 30).join(', '));
    }
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node tag_dump.js <input.txt> [output.sql] [--limit N] [--log-unmapped]');
    process.exit(1);
}

const inputFile = args[0];
let outputFile = 'dump_seed.sql';
let limit = Infinity;
let logUnmapped = false;

for (let i = 1; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
        limit = parseInt(args[i + 1], 10);
        i++;
    } else if (args[i] === '--log-unmapped') {
        logUnmapped = true;
    } else if (!args[i].startsWith('--')) {
        outputFile = args[i];
    }
}

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found at ${inputFile}`);
    process.exit(1);
}

processDump(inputFile, outputFile, limit, logUnmapped).catch(console.error);
