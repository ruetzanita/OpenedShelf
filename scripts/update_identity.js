/*
 * OpenedShelf - A brutally efficient edge architecture for readers at the margins.
 * Copyright (C) 2026 Anita Ruetz
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require('fs');

const content = fs.readFileSync('build/v2/scripts/tag_dump_identity.js', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('let mappingsAdded = 0;'));
const endIndex = lines.findIndex(l => l.includes('console.log(`\\nExplicit Identity mappings added: ${mappingsAdded}`);'));

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find boundaries');
    process.exit(1);
}

const replacement = `    let mappingsAdded = 0;
    
    // 1. Rule Pre-Compilation
    console.log("Compiling rules into JS memory...");
    const compiledRules = [];
    for (let i = 0; i < mappings.length; i++) {
        const tagId = mappings[i][0];
        if (!validTagsMap.has(tagId)) continue;
        const tier = validTagsMap.get(tagId);
        if (tier === 'genre_trope') continue; // Skip tropes for this pass

        let whereClause = mappings[i][1];
        let params = mappings[i][2];
        let scopedParent = mappings[i][3] || null;

        // Compile whereClause into a JS expression
        let jsStr = whereClause;
        let paramIndex = 0;
        jsStr = jsStr.replace(/(\\w+)\\s+LIKE\\s+\\?/g, (match, col) => {
            let p = params[paramIndex++];
            if (typeof p === 'string') p = p.replace(/%/g, '').toLowerCase();
            return \`(\${col} && \${col}.toLowerCase().includes(\${JSON.stringify(p)}))\`;
        });
        jsStr = jsStr.replace(/\\bAND\\b/g, '&&');
        jsStr = jsStr.replace(/\\bOR\\b/g, '||');

        let parentTagsToGrant = [];
        if (scopedParent) {
            if (validTagsMap.has(scopedParent)) parentTagsToGrant.push(scopedParent);
        } else {
            const parentTags = subgenreParentMap[tagId];
            if (parentTags && parentTags.length === 1 && validTagsMap.has(parentTags[0])) {
                parentTagsToGrant.push(parentTags[0]);
            }
        }

        const evaluateFn = new Function('title', 'author', 'short_synopsis', \`return \${jsStr};\`);
        compiledRules.push({
            tagId,
            evaluateFn,
            parentTagsToGrant
        });
    }
    console.log(\`Compiled \${compiledRules.length} rules.\`);

    // 2. Single-Pass Database Stream
    console.log("Streaming Works from database...");
    
    // We will chunk the reading to save memory, fetching 100k rows at a time
    let offset = 0;
    const limit = 100000;
    const getWorks = db.prepare(\`SELECT id, title, author, short_synopsis FROM Works LIMIT ? OFFSET ?\`);
    const insertStmt = db.prepare("INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES (?, ?)");

    while (true) {
        const rows = getWorks.all(limit, offset);
        if (rows.length === 0) break;

        let insertBuffer = [];
        
        // 3. In-Memory Row Evaluation
        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            for (let i = 0; i < compiledRules.length; i++) {
                const rule = compiledRules[i];
                if (rule.evaluateFn(row.title, row.author, row.short_synopsis)) {
                    insertBuffer.push({ work_id: row.id, tag_id: rule.tagId });
                    for(let p = 0; p < rule.parentTagsToGrant.length; p++) {
                        insertBuffer.push({ work_id: row.id, tag_id: rule.parentTagsToGrant[p] });
                    }
                }
            }
        }

        // 4. Massive Batch Inserts
        if (insertBuffer.length > 0) {
            db.exec('BEGIN TRANSACTION;');
            for (let k = 0; k < insertBuffer.length; k++) {
                const result = insertStmt.run(insertBuffer[k].work_id, insertBuffer[k].tag_id);
                if (result.changes > 0) mappingsAdded++;
            }
            db.exec('COMMIT;');
        }

        offset += limit;
        process.stdout.write(\`\\r[Identity] Processed \${offset} works... \`);
        
        if (offset % 500000 === 0) {
            process.stdout.write(\`\\r[Identity] Processed \${offset} works. [HARDWARE PROTECTION] Cooling down for 5s...   \`);
            await new Promise(r => setTimeout(r, 5000));
            console.log();
        }
    }
`;

const newLines = [
    ...lines.slice(0, startIndex),
    replacement,
    ...lines.slice(endIndex)
];

fs.writeFileSync('build/v2/scripts/tag_dump_identity.js', newLines.join('\n'));
console.log('Successfully updated tag_dump_identity.js');
