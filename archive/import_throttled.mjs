import fs from 'fs';
import readline from 'readline';
import { spawn } from 'child_process';

const sqlFile = process.argv[2];
const dbFile = process.argv[3];

if (!sqlFile || !dbFile) {
    console.log("Usage: node import_throttled.mjs <sqlFile> <dbFile>");
    process.exit(1);
}

console.log(`Starting throttled import from ${sqlFile} to ${dbFile}...`);

// Spawn the sqlite3 process
const sqlite3 = spawn('sqlite3', [dbFile], { stdio: ['pipe', 'inherit', 'inherit'] });
sqlite3.stdin.setMaxListeners(50);

const rl = readline.createInterface({
    input: fs.createReadStream(sqlFile),
    crlfDelay: Infinity
});

let lines = 0;
let drainListenerAttached = false;

rl.on('line', (line) => {
    lines++;
    
    if (lines <= 51000000) return; // Fast forward past already imported lines

    // Inject intermediate commits every 100,000 lines to prevent massive WAL files
    if (lines % 100000 === 0) {
        sqlite3.stdin.write('COMMIT;\nBEGIN TRANSACTION;\n');
    }
    
    // Write the line to sqlite3
    const canContinue = sqlite3.stdin.write(line + '\n');
    
    // Throttle CPU/IO: pause every 500,000 lines for 7 seconds
    if (lines % 500000 === 0) {
        rl.pause();
        process.stdout.write(`\rProcessed ${lines} lines. [HARDWARE PROTECTION] Checkpointing and cooling down for 7s...   `);
        
        setTimeout(() => {
            if (!sqlite3.stdin.writableNeedDrain) {
                rl.resume();
            } else if (!drainListenerAttached) {
                drainListenerAttached = true;
                sqlite3.stdin.once('drain', () => {
                    drainListenerAttached = false;
                    rl.resume();
                });
            }
        }, 7000);
        return;
    }

    // Handle normal backpressure
    if (!canContinue) {
        rl.pause();
        if (!drainListenerAttached) {
            drainListenerAttached = true;
            sqlite3.stdin.once('drain', () => {
                drainListenerAttached = false;
                rl.resume();
            });
        }
    }
});

rl.on('close', () => {
    console.log('\nFinished sending SQL to database. Waiting for SQLite to flush to disk...');
    sqlite3.stdin.end();
});

sqlite3.on('close', (code) => {
    console.log(`\nImport process exited with code ${code}`);
});
