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
const db = new DatabaseSync('./build/v2/openedshelf_monthly.sqlite');
const count = db.prepare("SELECT count(*) as cnt FROM Works").get().cnt;
const withSynopsis = db.prepare("SELECT count(*) as cnt FROM Works WHERE short_synopsis IS NOT NULL AND short_synopsis != ''").get().cnt;
console.log("Total works:", count);
console.log("Works with short_synopsis:", withSynopsis);
const sample = db.prepare("SELECT short_synopsis FROM Works WHERE short_synopsis IS NOT NULL LIMIT 5").all();
console.log("Sample synopsis:", sample);
