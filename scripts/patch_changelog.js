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

const fs = require('fs');
let content = fs.readFileSync('OpenedShelf_changelog.md', 'utf8');

const newEntry = `
* **Taxonomy Pipeline Streaming Architecture**:
  * *Change*: Refactored \`build/v2/scripts/tag_dump_identity.js\` to use an in-memory Single-Pass JS Streaming Architecture instead of the previous N-Query SQL scanning engine. The script now reads the 40-million row database exactly once in chunks, compiles the mapping rules into V8 RegExp closure functions, evaluates them instantly in memory, and performs batched bulk \`INSERT\` operations.
  * *Change*: Strictly enforced the hardware cooling logic. The script now explicitly yields the Node.js event loop every 100,000 rows to prevent the CPU from pegging at 100%, and performs a full 5-second deep rest every 500,000 rows.
  * *Rationale*: The previous architecture executed 737 full-table unindexed \`INSTR\` scans across 40 million rows, causing the script to stall for over 1.5+ hours. By pushing the string evaluation to V8 memory, it processes 300,000+ rows in seconds, completely resolving the pipeline stall while maintaining identical tagging logic and robust thermal safety limits.
`;

content = content.replace('### May 30, 2026\n', '### May 30, 2026\n' + newEntry);
fs.writeFileSync('OpenedShelf_changelog.md', content);
