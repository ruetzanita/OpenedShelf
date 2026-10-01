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

const sqlWorks = db.prepare(`SELECT id, title, author, short_synopsis FROM Works WHERE INSTR(LOWER(title), 'dune') > 0 AND INSTR(LOWER(author), 'frank herbert') > 0 LIMIT 100`).all();
console.log("SQL returned:", sqlWorks.length);

const jsStr = "((title && title.toLowerCase().includes(\"dune\")) && (author && author.toLowerCase().includes(\"frank herbert\")))";
const evaluateFn = new Function('title', 'author', 'short_synopsis', `return ${jsStr};`);

let matches = 0;
const allWorks = db.prepare(`SELECT id, title, author, short_synopsis FROM Works LIMIT 100000`).all();
for(let w of allWorks) {
  if (evaluateFn(w.title, w.author, w.short_synopsis)) matches++;
}
console.log("JS returned:", matches);
