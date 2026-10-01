const zlib = require('zlib');
const fs = require('fs');
const readline = require('readline');
const fileStream = fs.createReadStream('Raw_Data/hubs.bibframe.jsonld.gz');
const gunzip = zlib.createGunzip();
const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

let foundWithIsbn = 0;
let foundWithTitle = 0;
let totalProcessed = 0;

rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        const data = JSON.parse(line);
        totalProcessed++;
        const graph = data["@graph"];
        if (!graph) return;
        const nodes = {};
        for (const node of graph) { nodes[node["@id"]] = node; }
        
        const workNode = graph.find(n => n["@id"] && n["@id"].startsWith("http://id.loc.gov/resources/hubs/"));
        if (!workNode) return;
        
        let hasSummary = false;
        if (workNode["bf:summary"] && workNode["bf:summary"]["@id"]) {
            const summaryNode = nodes[workNode["bf:summary"]["@id"]];
            if (summaryNode && summaryNode["rdfs:label"]) hasSummary = true;
        }
        
        if (hasSummary) {
            let hasIsbn = false;
            if (workNode["bf:identifiedBy"]) {
                const identifiers = Array.isArray(workNode["bf:identifiedBy"]) ? workNode["bf:identifiedBy"] : [workNode["bf:identifiedBy"]];
                for (const idRef of identifiers) {
                    const idNode = nodes[idRef["@id"]];
                    if (idNode && (idNode["@type"] === "bf:Isbn" || (Array.isArray(idNode["@type"]) && idNode["@type"].includes("bf:Isbn")))) {
                        hasIsbn = true;
                    }
                }
            }
            if (hasIsbn) foundWithIsbn++;
            else foundWithTitle++;
            
            if (foundWithTitle > 100 || foundWithIsbn > 0) {
                console.log(`Processed: ${totalProcessed}, Found with ISBN: ${foundWithIsbn}, Found with Title only: ${foundWithTitle}`);
                process.exit(0);
            }
        }
    } catch (e) {}
});
