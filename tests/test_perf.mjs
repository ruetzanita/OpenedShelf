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
const db = new DatabaseSync('build/v2/openedshelf_monthly.sqlite');

console.time('Full DB Scan in JS');
const stmt = db.prepare('SELECT id, LOWER(title) as title, LOWER(author) as author, LOWER(short_synopsis) as synopsis FROM Works LIMIT 100000');
const rows = stmt.all();
console.timeEnd('Full DB Scan in JS');

const rules = [];
for(let i=0; i<700; i++) {
    rules.push((t, a, s) => s && s.includes('ancient' + i));
}

console.time('Eval 700 rules on 100k rows');
let matches = 0;
for(let i=0; i<rows.length; i++) {
    const t = rows[i].title;
    const a = rows[i].author;
    const s = rows[i].synopsis;
    for(let j=0; j<rules.length; j++) {
        if(rules[j](t, a, s)) matches++;
    }
}
console.timeEnd('Eval 700 rules on 100k rows');
