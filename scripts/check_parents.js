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

import { GENRE_TROPES } from './build/v2/src/tags_genre_tropes.js';

let parentMap = {};
for (const [key, data] of Object.entries(GENRE_TROPES)) {
    for (const tag of data.tags) {
        if (!parentMap[tag]) parentMap[tag] = [];
        if (!parentMap[tag].includes(data.parentTag)) parentMap[tag].push(data.parentTag);
    }
}

let multi = 0;
for (const [tag, parents] of Object.entries(parentMap)) {
    if (parents.length > 1) {
        console.log(tag, "has multiple parents:", parents);
        multi++;
    }
}
console.log("Total multi-parent tropes:", multi);
