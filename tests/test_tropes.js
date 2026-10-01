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
const db = new DatabaseSync('./build/v2/openedshelf_monthly.sqlite');
const allTagsRaw = db.prepare("SELECT id, name, tier FROM Tags").all();
const validTagsMap = new Map();
for(const t of allTagsRaw) validTagsMap.set(t.id, t.tier);

let tropesProcessed = 0;
for (let i = 0; i < mappings.length; i++) {
    const tagId = mappings[i][0];
    if (!validTagsMap.has(tagId)) continue;
    const tier = validTagsMap.get(tagId);
    if (tier !== 'genre_trope') continue;
    tropesProcessed++;
}
console.log("Tropes actually processed:", tropesProcessed);
