const zlib = require('zlib');
const fs = require('fs');
const readline = require('readline');
const fileStream = fs.createReadStream('Raw_Data/hubs.bibframe.jsonld.gz');
const gunzip = zlib.createGunzip();
const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

let count = 0;
let output = [];
rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        const data = JSON.parse(line);
        output.push(data);
        count++;
        if (count >= 5) {
            fs.writeFileSync('sample_hubs.json', JSON.stringify(output, null, 2));
            process.exit(0);
        }
    } catch (e) {}
});
