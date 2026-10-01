const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, '../Raw_Data');
const MAX_RECORDS_TO_INSPECT = 3; // Stop after finding this many valid hub records

async function inspectRecords() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.jsonld.gz') || f.endsWith('.jsondl.gz')).sort();
    
    if (files.length === 0) {
        console.error(`No .jsonld.gz files found in ${DATA_DIR}`);
        return;
    }

    const file = files[0];
    const filePath = path.join(DATA_DIR, file);
    console.log(`Inspecting file: ${filePath}\n`);

    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();

    const rl = readline.createInterface({
        input: fileStream.pipe(gunzip),
        crlfDelay: Infinity
    });

    let inspectedCount = 0;
    let lineCount = 0;

    for await (const line of rl) {
        lineCount++;
        if (!line.trim()) continue;

        try {
            const data = JSON.parse(line);
            if (!data || !data["@graph"]) continue;

            const graph = data["@graph"];
            const workNode = graph.find(n => n["@id"] && n["@id"].startsWith("http://id.loc.gov/resources/hubs/"));
            
            if (workNode) {
                console.log(`\n======================================================`);
                console.log(`Record #${inspectedCount + 1} (Line ${lineCount})`);
                console.log(`Main Hub Node ID: ${workNode["@id"]}`);
                console.log(`======================================================`);
                
                // Print out the exact structure of the fields the ingest script is looking for
                console.log("--- TITLE (bf:title) ---");
                console.log(JSON.stringify(workNode["bf:title"] || null, null, 2));

                console.log("\n--- SUMMARY (bf:summary) ---");
                console.log(JSON.stringify(workNode["bf:summary"] || null, null, 2));

                console.log("\n--- IDENTIFIER (bf:identifiedBy) ---");
                console.log(JSON.stringify(workNode["bf:identifiedBy"] || null, null, 2));

                console.log("\n--- ORIGIN DATE (bf:originDate) ---");
                console.log(JSON.stringify(workNode["bf:originDate"] || null, null, 2));
                
                console.log("\n--- FULL NODE KEYS ---");
                console.log(Object.keys(workNode).join(", "));

                inspectedCount++;
                
                if (inspectedCount >= MAX_RECORDS_TO_INSPECT) {
                    console.log(`\nReached inspection limit of ${MAX_RECORDS_TO_INSPECT} records. Stopping...`);
                    break;
                }
            }
        } catch (e) {
            console.error(`Failed to parse line ${lineCount}: ${e.message}`);
        }
    }
    
    rl.close();
    fileStream.destroy();
}

inspectRecords().catch(console.error);
