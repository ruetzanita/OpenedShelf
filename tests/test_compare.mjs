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
import { mappings } from '../build/v2/src/seed_mappings.js';
const db = new DatabaseSync('build/v2/openedshelf_monthly.sqlite');

const limit = 100000;
const works = db.prepare(`SELECT rowid, id, title, author, short_synopsis FROM Works LIMIT ?`).all(limit);

let jsMatches = 0;
let sqlMatches = 0;

// Pick a random rule
const rule = mappings[50]; // Example rule
console.log("Rule:", rule[0], rule[1], rule[2]);

// 1. JS compilation
let jsStr = rule[1];
let paramIndex = 0;
jsStr = jsStr.replace(/(\w+)\s+LIKE\s+\?/g, (match, col) => {
    let p = rule[2][paramIndex++];
    if (typeof p === 'string') p = p.replace(/%/g, '').toLowerCase();
    return `(${col} && ${col}.toLowerCase().includes(${JSON.stringify(p)}))`;
});
jsStr = jsStr.replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||');
const evalFn = new Function('title', 'author', 'short_synopsis', `return ${jsStr};`);

// 2. SQL compilation
let sqlStr = rule[1];
paramIndex = 0;
sqlStr = sqlStr.replace(/(\w+)\s+LIKE\s+\?/g, (match, col) => {
    return `INSTR(LOWER(${col}), LOWER(?)) > 0`;
});
const sqlParams = rule[2].map(p => typeof p === 'string' ? p.replace(/%/g, '') : p);
const sqlStmt = db.prepare(`SELECT COUNT(*) as c FROM Works WHERE rowid <= ? AND (${sqlStr})`);

// Run JS
for (const w of works) {
    if (evalFn(w.title, w.author, w.short_synopsis)) jsMatches++;
}

// Run SQL
const sqlResult = sqlStmt.get(works[works.length - 1].rowid, ...sqlParams).c;

console.log("JS Matches:", jsMatches);
console.log("SQL Matches:", sqlResult);
