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

const whereStr = "(title LIKE ? AND author LIKE ?) OR title LIKE ?";
const paramsArr = ["%Dune%", "%Frank Herbert%", "%Gods of Mars%"];

let jsStr = whereStr;
let paramIndex = 0;
jsStr = jsStr.replace(/(\w+)\s+LIKE\s+\?/g, (match, col) => {
    let p = paramsArr[paramIndex++];
    if (typeof p === 'string') {
        p = p.replace(/%/g, '').toLowerCase();
    }
    return `(${col} && ${col}.toLowerCase().includes(${JSON.stringify(p)}))`;
});
jsStr = jsStr.replace(/\bAND\b/g, '&&');
jsStr = jsStr.replace(/\bOR\b/g, '||');

console.log(jsStr);
const fn = new Function('title', 'author', 'short_synopsis', `return ${jsStr};`);
console.log(fn('Dune Messiah', 'Frank Herbert', ''));
