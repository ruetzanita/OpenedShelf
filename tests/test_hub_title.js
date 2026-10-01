const zlib = require('zlib');
const fs = require('fs');
const readline = require('readline');
const fileStream = fs.createReadStream('Raw_Data/hubs.bibframe.jsonld.gz');
const gunzip = zlib.createGunzip();
const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

let totalProcessed = 0;
let hasTitleCount = 0;

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
        
        let title = null;
        if (workNode["bf:title"]) {
            const titleRefs = Array.isArray(workNode["bf:title"]) ? workNode["bf:title"] : [workNode["bf:title"]];
            for (const ref of titleRefs) {
                if (ref["@id"]) {
                    const titleNode = nodes[ref["@id"]];
                    if (titleNode && titleNode["@type"] === "bf:Title" && titleNode["bf:mainTitle"]) {
                        title = titleNode["bf:mainTitle"];
                        if (typeof title === 'object' && title["@value"]) {
                            title = title["@value"];
                        }
                        break;
                    }
                }
            }
        }
        
        if (title) hasTitleCount++;
        
        if (totalProcessed >= 5000) {
            console.log(`Processed: ${totalProcessed}, Found Title: ${hasTitleCount}`);
            process.exit(0);
        }
    } catch (e) {}
});
