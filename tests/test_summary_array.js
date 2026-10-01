const zlib = require('zlib');
const fs = require('fs');
const readline = require('readline');
const fileStream = fs.createReadStream('Raw_Data/hubs.bibframe.jsonld.gz');
const gunzip = zlib.createGunzip();
const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

let totalProcessed = 0;
let arraySummaryCount = 0;
let objectSummaryCount = 0;

rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        const data = JSON.parse(line);
        totalProcessed++;
        const graph = data["@graph"];
        if (!graph) return;
        
        const workNode = graph.find(n => n["@id"] && n["@id"].startsWith("http://id.loc.gov/resources/hubs/"));
        if (!workNode) return;
        
        if (workNode["bf:summary"]) {
            if (Array.isArray(workNode["bf:summary"])) {
                arraySummaryCount++;
            } else {
                objectSummaryCount++;
            }
        }
        
        if (totalProcessed >= 10000) {
            console.log(`Processed: ${totalProcessed}`);
            console.log(`Array Summaries: ${arraySummaryCount}`);
            console.log(`Object Summaries: ${objectSummaryCount}`);
            process.exit(0);
        }
    } catch (e) {}
});
