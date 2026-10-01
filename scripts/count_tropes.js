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
import { GENRE_TROPES } from './build/v2/src/tags_genre_tropes.js';

let tropeTags = new Set();
for (const [key, data] of Object.entries(GENRE_TROPES)) {
    for (const tag of data.tags) tropeTags.add(tag);
}

let tropeMappings = 0;
for (const m of mappings) {
    if (tropeTags.has(m[0])) tropeMappings++;
}
console.log("Total mappings:", mappings.length);
console.log("Trope mappings:", tropeMappings);
