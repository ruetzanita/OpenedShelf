const { spawn } = require('child_process');
const tar = require('tar-stream');
const { XMLParser } = require('fast-xml-parser');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'secondary_seed.db');
const db = new Database(dbPath);

// PRAGMA and Schema
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS Descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    isbn TEXT, 
    title TEXT, 
    author TEXT, 
    synopsis TEXT
);
CREATE INDEX IF NOT EXISTS idx_isbn ON Descriptions(isbn);
CREATE INDEX IF NOT EXISTS idx_title_author ON Descriptions(title, author);
`);

const insertStmt = db.prepare('INSERT INTO Descriptions (isbn, title, author, synopsis) VALUES (?, ?, ?, ?)');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

let buffer = [];
let processedCount = 0;

const zipPath = path.join(__dirname, '..', 'Raw_Data', 'rdf-files.tar.zip');
const unzip = spawn('unzip', ['-p', zipPath]);
const extract = tar.extract();

unzip.stdout.pipe(extract);

function flushBuffer() {
    if (buffer.length === 0) return;
    const insertMany = db.transaction((records) => {
        for (const rec of records) {
            insertStmt.run(rec.isbn, rec.title, rec.author, rec.synopsis);
        }
    });
    insertMany(buffer);
    buffer = [];
}

async function handleCooldown() {
    if (processedCount > 0 && processedCount % 500000 === 0) {
        console.log(`[Cooldown] Reached ${processedCount} records. Yielding event loop for 5000ms...`);
        extract.pause();
        await new Promise(r => setTimeout(r, 5000));
        extract.resume();
    }
}

extract.on('entry', async function(header, stream, next) {
    // Only process .rdf files
    if (!header.name.endsWith('.rdf')) {
        stream.on('end', function() {
            next();
        });
        stream.resume();
        return;
    }

    let data = '';
    stream.on('data', function(chunk) {
        data += chunk;
    });

    stream.on('end', async function() {
        try {
            const result = parser.parse(data);
            const ebook = result['rdf:RDF']?.['pgterms:ebook'];
            if (ebook) {
                const titleObj = ebook['dcterms:title'];
                let title = null;
                if (titleObj) {
                    title = typeof titleObj === 'string' ? titleObj : titleObj['#text'] || titleObj['@_rdf:resource'];
                }

                const creatorObj = ebook['dcterms:creator']?.['pgterms:agent'];
                let author = null;
                if (creatorObj) {
                    const nameObj = creatorObj['pgterms:name'];
                    if (nameObj) {
                        author = typeof nameObj === 'string' ? nameObj : nameObj['#text'];
                    }
                }

                let synopsis = null;
                let descNode = ebook['dcterms:description'];
                if (descNode) {
                    if (Array.isArray(descNode)) {
                        const textNodes = descNode.map(d => typeof d === 'string' ? d : d['#text']).filter(Boolean);
                        synopsis = textNodes.join('\n');
                    } else {
                        synopsis = typeof descNode === 'string' ? descNode : descNode['#text'];
                    }
                }

                if (synopsis && synopsis.trim() !== '') {
                    buffer.push({
                        isbn: null,
                        title: title || null,
                        author: author || null,
                        synopsis: synopsis
                    });
                    processedCount++;

                    if (buffer.length >= 10000) {
                        flushBuffer();
                        console.log(`Flushed 10000 records. Total processed: ${processedCount}`);
                    }

                    await handleCooldown();
                }
            }
        } catch (e) {
            console.error(`Error parsing ${header.name}:`, e.message);
        }
        
        next();
    });
});

extract.on('finish', function() {
    flushBuffer();
    console.log(`Finished processing. Total records: ${processedCount}`);
    db.close();
});

unzip.stderr.on('data', (data) => {
    // unzip -p sometimes complains about extra bytes, ignore non-fatal warnings
    if (!data.toString().includes('warning')) {
        console.error(`unzip stderr: ${data}`);
    }
});

unzip.on('close', (code) => {
    if (code !== 0 && code !== 1) { // 1 is warning
        console.log(`unzip process exited with code ${code}`);
    }
});
