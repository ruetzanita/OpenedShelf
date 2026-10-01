const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../db/secondary_seed.db');
const DUMP_PATH = path.join(__dirname, '../../../Raw_Data/latest-all.json.gz');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run("PRAGMA journal_mode = WAL;");
    db.run(`
        CREATE TABLE IF NOT EXISTS Descriptions (
            isbn TEXT PRIMARY KEY,
            title TEXT,
            author TEXT,
            synopsis TEXT
        )
    `);
});

const fileStream = fs.createReadStream(DUMP_PATH);
const gunzip = zlib.createGunzip();
const rl = readline.createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity
});

let processedCount = 0;
let booksFound = 0;
let batch = [];
const BATCH_SIZE = 10000;
const COOLDOWN_INTERVAL = 50000;
let startTime = Date.now();

const STATE_FILE = path.join(__dirname, '../../../db/.wikidata_resume_state');
let skipCount = 0;
if (fs.existsSync(STATE_FILE)) {
    skipCount = parseInt(fs.readFileSync(STATE_FILE, 'utf8'), 10) || 0;
    console.log(`[RESUME] Found state file. Fast-forwarding and skipping first ${skipCount.toLocaleString()} lines...`);
}

const VALID_BOOK_TYPES = ['Q571', 'Q7725634', 'Q47461344'];

function getFirstValue(entity, propertyId) {
    if (entity.claims && entity.claims[propertyId]) {
        const claim = entity.claims[propertyId][0];
        if (claim && claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.value) {
            if (claim.mainsnak.datavalue.type === 'string') {
                return claim.mainsnak.datavalue.value;
            } else if (claim.mainsnak.datavalue.type === 'wikibase-entityid') {
                return claim.mainsnak.datavalue.value.id;
            }
        }
    }
    return null;
}

function hasAnyType(entity, propertyId, validTypes) {
    if (entity.claims && entity.claims[propertyId]) {
        for (const claim of entity.claims[propertyId]) {
             if (claim && claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.type === 'wikibase-entityid') {
                 if (validTypes.includes(claim.mainsnak.datavalue.value.id)) {
                     return true;
                 }
             }
        }
    }
    return false;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function processLine(line) {
    if (processedCount < skipCount) {
        processedCount++;
        if (processedCount % 1000000 === 0) {
            process.stdout.write(`\r[RESUME] Skipped ${processedCount.toLocaleString()} lines...   `);
        }
        if (processedCount === skipCount) {
            console.log('\n[RESUME] Reached resume point. Resuming full parsing...');
            startTime = Date.now(); // Reset speed timer
        }
        return;
    }

    line = line.trim().replace(/,$/, '');
    if (!line || line === '[' || line === ']') return;

    try {
        const entity = JSON.parse(line);
        processedCount++;

        const isBook = hasAnyType(entity, 'P31', VALID_BOOK_TYPES);
        if (isBook) {
            booksFound++;
            const isbn13 = getFirstValue(entity, 'P212');
            const isbn10 = getFirstValue(entity, 'P957');
            const isbn = isbn13 || isbn10;
            
            if (isbn) {
                const title = entity.labels && entity.labels.en ? entity.labels.en.value : null;
                const synopsis = entity.descriptions && entity.descriptions.en ? entity.descriptions.en.value : null;
                const authorId = getFirstValue(entity, 'P50');
                
                if (title || synopsis) {
                    batch.push({ isbn, title, author: authorId, synopsis });
                }
            }
        }

        if (batch.length >= BATCH_SIZE) {
            rl.pause();
            await writeBatch(batch);
            batch = [];
            rl.resume();
        }

        if (processedCount % 5000 === 0) {
            const elapsedSec = (Date.now() - startTime) / 1000 || 1;
            const sessionProcessed = processedCount - skipCount;
            const rate = Math.round(sessionProcessed / elapsedSec);
            process.stdout.write(`\r[PROGRESS] Lines read: ${processedCount.toLocaleString()} | Books found: ${booksFound.toLocaleString()} | Speed: ${rate.toLocaleString()} lines/sec   `);
        }

        if (processedCount % COOLDOWN_INTERVAL === 0) {
            rl.pause();
            process.stdout.write(`\n[COOLDOWN] Processed ${processedCount.toLocaleString()} records. Yielding 5s for hardware cooldown...\n`);
            await sleep(5000);
            rl.resume();
        }

    } catch (e) {
        // Ignore parse errors
    }
}

async function writeBatch(records) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            const stmt = db.prepare("INSERT OR REPLACE INTO Descriptions (isbn, title, author, synopsis) VALUES (?, ?, ?, ?)");
            for (const record of records) {
                stmt.run(record.isbn, record.title, record.author, record.synopsis);
            }
            stmt.finalize();
            db.run("COMMIT;", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Ensure processLine is handled as async so await works correctly within rl context
// though rl.on('line') is synchronous in event dispatching, pausing prevents buffer overflow
rl.on('line', (line) => {
    // Process line and catch any unhandled promise rejections
    processLine(line).catch(err => {
        console.error("Error processing line", err);
        rl.resume(); // Ensure resume on error
    });
});

rl.on('close', async () => {
    if (batch.length > 0) {
        await writeBatch(batch);
    }
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n[DONE] Finished processing in ${totalTime}s.`);
    console.log(`Total records read: ${processedCount.toLocaleString()}`);
    console.log(`Total books inserted: ${booksFound.toLocaleString()}`);
    
    if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
    }
    db.close();
});

function saveState() {
    fs.writeFileSync(STATE_FILE, processedCount.toString(), 'utf8');
    console.log(`\n[STATE SAVED] Progress saved at ${processedCount.toLocaleString()} lines.`);
}

process.on('SIGINT', async () => {
    rl.pause();
    console.log('\n[INTERRUPT] Caught interrupt signal, saving state...');
    if (batch.length > 0) {
        await writeBatch(batch);
    }
    saveState();
    process.exit();
});
