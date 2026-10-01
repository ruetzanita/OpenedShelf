const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');

const TEST_DIR = path.join(__dirname, 'temp_marc_ingest_test');
const DATA_DIR = path.join(TEST_DIR, 'Raw_Data');
const DB_DIR = path.join(TEST_DIR, 'db');
const DB_PATH = path.join(DB_DIR, 'secondary_seed.db');
const ORIGINAL_SCRIPT_PATH = path.join(__dirname, '../build/v2/scripts/loc_marc_ingest.js');
const TEST_SCRIPT_PATH = path.join(TEST_DIR, 'loc_marc_ingest_temp.js');
const MOCK_FILE = path.join(DATA_DIR, 'mock_test_data.jsonld.gz');

test('loc_marc_ingest.js correctly processes JSON-LD and seeds the database', (t) => {
    // 1. Setup temp directories
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(DB_DIR, { recursive: true });

    // 2. Create mock JSON-LD data
    const mockRecord = {
        "@graph": [
            {
                "@id": "http://id.loc.gov/resources/hubs/12345",
                "bf:title": { "@id": "titleNode" },
                "bf:summary": { "@id": "summaryNode" },
                "bflc:marcKey": "1001 $aDoe, John",
                "bf:identifiedBy": { "@id": "isbnNode" },
                "bf:originDate": "2024"
            },
            {
                "@id": "titleNode",
                "bf:mainTitle": "Test Title"
            },
            {
                "@id": "summaryNode",
                "rdfs:label": "This is a test synopsis."
            },
            {
                "@id": "isbnNode",
                "@type": "bf:Isbn",
                "rdf:value": "9781234567897"
            }
        ]
    };

    const mockDataStr = JSON.stringify(mockRecord) + '\n';
    const compressed = zlib.gzipSync(mockDataStr);
    fs.writeFileSync(MOCK_FILE, compressed);

    // 3. Create a temporary modified version of the script
    // Since the original script has hardcoded paths, we will read it,
    // replace the paths to point to our test directories, and run the modified copy.
    let scriptContent = fs.readFileSync(ORIGINAL_SCRIPT_PATH, 'utf-8');
    scriptContent = scriptContent.replace(
        /const DB_PATH = .*;/, 
        `const DB_PATH = ${JSON.stringify(DB_PATH)};`
    );
    scriptContent = scriptContent.replace(
        /const DATA_DIR = .*;/, 
        `const DATA_DIR = ${JSON.stringify(DATA_DIR)};`
    );
    fs.writeFileSync(TEST_SCRIPT_PATH, scriptContent);

    // 4. Run the temporary ingest script
    try {
        execSync(`node ${TEST_SCRIPT_PATH}`, { stdio: 'pipe' });
    } catch (e) {
        assert.fail('Script execution failed: ' + e.message);
    }

    // 5. Verify DB
    const db = new Database(DB_PATH);
    const row = db.prepare('SELECT * FROM Descriptions WHERE isbn = ?').get('9781234567897');

    assert.ok(row, 'Row should exist in the database');
    assert.strictEqual(row.title, 'Test Title');
    assert.strictEqual(row.author, 'Doe John'); // Note the comma removed by ingest script regex
    assert.strictEqual(row.synopsis, 'This is a test synopsis.');
    assert.strictEqual(row.publish_year, 2024);

    // 6. Cleanup
    db.close();
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});
