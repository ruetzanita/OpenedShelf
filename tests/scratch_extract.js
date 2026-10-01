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

import { mappings } from '../build/v2/src/seed_mappings.js';
import { GENRE_IDENTITY, GENRE_BROWSE_MAP } from '../build/v2/src/tags.js';
import fs from 'node:fs';

const broadGenresSet = new Set();
for (const tags of Object.values(GENRE_BROWSE_MAP)) {
    for (const t of tags) broadGenresSet.add(t);
}
const validIdentityTags = new Set(broadGenresSet);
for (const sub of Object.values(GENRE_IDENTITY)) {
    for (const t of sub.tags) validIdentityTags.add(t);
}

const keywordsDict = {};
const newMappings = [];

for (const m of mappings) {
    const tag = m[0];
    const condition = m[1];
    const params = m[2];
    const parent = m[3];

    if (!validIdentityTags.has(tag)) {
        newMappings.push(m);
        continue;
    }

    const cleanTag = tag.replace(/^(genre|trope):/, '');

    // Split conditions
    const conds = condition.split(' OR ');
    const newConds = [];
    const newParams = [];
    let pIdx = 0;

    for (const c of conds) {
        // Count how many '?' in this condition
        const qCount = (c.match(/\?/g) || []).length;
        const cParams = params.slice(pIdx, pIdx + qCount);
        pIdx += qCount;

        if (c.includes("short_synopsis LIKE ?") || c.includes("short_synopsis LIKE  ?")) {
            if (!keywordsDict[cleanTag]) keywordsDict[cleanTag] = [];
            for (const p of cParams) {
                const cleanP = p.replace(/%/g, '');
                if (!keywordsDict[cleanTag].includes(cleanP)) {
                    keywordsDict[cleanTag].push(cleanP);
                }
            }
        } else {
            // It's a title/author rule! Keep it.
            newConds.push(c);
            newParams.push(...cParams);
        }
    }

    if (newConds.length > 0) {
        const out = [tag, newConds.join(' OR '), newParams];
        if (parent) out.push(parent);
        newMappings.push(out);
    }
}

const outKeywords = `export const IDENTITY_KEYWORDS = ${JSON.stringify(keywordsDict, null, 4)};\n`;
fs.writeFileSync('./build/v2/src/tags_identity_keywords.js', outKeywords);

const outMappings = `// Auto-generated curated SQL seed mappings
export const mappings = ${JSON.stringify(newMappings, null, 4)};\n`;
fs.writeFileSync('./build/v2/src/seed_mappings.js', outMappings);
console.log("Extraction complete.");
