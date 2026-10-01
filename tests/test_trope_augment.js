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

import { TROPE_KEYWORDS } from './build/v2/src/tags_trope_keywords.js';

let tagId = 'genre:enemies_to_lovers';
let whereClause = "title LIKE ? OR short_synopsis LIKE ?";
let params = ["%Pride and Prejudice%","%enemies-to-lovers%"];

const cleanName = tagId.replace(/^(genre|trope):/, '').toLowerCase();
if (TROPE_KEYWORDS[cleanName]) {
    for (const kw of TROPE_KEYWORDS[cleanName]) {
        if (!params.includes(`%${kw}%`)) {
            whereClause += " OR short_synopsis LIKE ?";
            params.push(`%${kw}%`);
        }
    }
}

whereClause = whereClause.replace(/(\w+)\s+LIKE\s+\?/g, (match, col) => {
    return `INSTR(LOWER(${col}), LOWER(?)) > 0`;
});
params = params.map(p => typeof p === 'string' ? p.replace(/%/g, '') : p);

console.log("WHERE:", whereClause);
console.log("PARAMS:", params);
