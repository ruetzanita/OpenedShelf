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

import { DatabaseSync } from 'node:sqlite';
import { mappings } from './build/v2/src/seed_mappings.js';
import { GENRE_IDENTITY } from './build/v2/src/tags.js';

const db = new DatabaseSync('build/v2/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/17c70b0cbaa8bbfcfb92adfb009744335ac779106d070430fa6d10bdc12a3fe0.sqlite');

const compiledRules = [];
for (let i = 0; i < 50; i++) {
    const tagId = mappings[i][0];
    let whereClause = mappings[i][1];
    let params = mappings[i][2];

    let jsStr = whereClause;
    let paramIndex = 0;
    jsStr = jsStr.replace(/(\w+)\s*LIKE\s*\?/gi, (match, col) => {
        let p = params[paramIndex++];
        if (typeof p === 'string') p = p.replace(/%/g, '').toLowerCase();
        const safePattern = p.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\$&');
        return `((typeof ${col} === 'string') && new RegExp('\\\\b' + ${JSON.stringify(safePattern)} + '\\\\b', 'i').test(${col}))`;
    });
    jsStr = jsStr.replace(/\bAND\b/gi, '&&');
    jsStr = jsStr.replace(/\bOR\b/gi, '||');

    const evaluateFn = new Function('title', 'author', 'short_synopsis', 'ol_subjects', 'ol_genres', `return ${jsStr};`);
    compiledRules.push({ tagId, jsStr, evaluateFn });
}

let matches = 0;
const rows = db.prepare('SELECT title, author, short_synopsis, ol_subjects, ol_genres FROM Works LIMIT 100000').all();
for (const row of rows) {
    for (const rule of compiledRules) {
        if (rule.evaluateFn(row.title, row.author, row.short_synopsis, row.ol_subjects, row.ol_genres)) {
            matches++;
        }
    }
}
console.log('Matches with word boundaries:', matches);

// Now with includes
const compiledRulesIncludes = [];
for (let i = 0; i < 50; i++) {
    const tagId = mappings[i][0];
    let whereClause = mappings[i][1];
    let params = mappings[i][2];

    let jsStr = whereClause;
    let paramIndex = 0;
    jsStr = jsStr.replace(/(\w+)\s*LIKE\s*\?/gi, (match, col) => {
        let p = params[paramIndex++];
        if (typeof p === 'string') p = p.replace(/%/g, '').toLowerCase();
        return `((typeof ${col} === 'string') && ${col}.toLowerCase().includes(${JSON.stringify(p)}))`;
    });
    jsStr = jsStr.replace(/\bAND\b/gi, '&&');
    jsStr = jsStr.replace(/\bOR\b/gi, '||');

    const evaluateFn = new Function('title', 'author', 'short_synopsis', 'ol_subjects', 'ol_genres', `return ${jsStr};`);
    compiledRulesIncludes.push({ tagId, jsStr, evaluateFn });
}

let matchesIncludes = 0;
for (const row of rows) {
    for (const rule of compiledRulesIncludes) {
        if (rule.evaluateFn(row.title, row.author, row.short_synopsis, row.ol_subjects, row.ol_genres)) {
            matchesIncludes++;
        }
    }
}
console.log('Matches with includes:', matchesIncludes);
