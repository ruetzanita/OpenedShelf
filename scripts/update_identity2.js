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

let content = fs.readFileSync('build/v2/scripts/tag_dump_identity.js', 'utf8');

// Replace offset logic with keyset pagination (rowid)
content = content.replace(
    'let offset = 0;\n    const limit = 100000;\n    const getWorks = db.prepare(`SELECT id, title, author, short_synopsis FROM Works LIMIT ? OFFSET ?`);',
    'let lastRowId = 0;\n    const limit = 100000;\n    let worksProcessed = 0;\n    const getWorks = db.prepare(`SELECT rowid, id, title, author, short_synopsis FROM Works WHERE rowid > ? ORDER BY rowid ASC LIMIT ?`);'
);

content = content.replace(
    'const rows = getWorks.all(limit, offset);',
    'const rows = getWorks.all(lastRowId, limit);'
);

content = content.replace(
    /offset \+= limit;/g,
    'lastRowId = rows[rows.length - 1].rowid;\n        worksProcessed += rows.length;'
);

content = content.replace(
    /offset/g,
    'worksProcessed'
);

fs.writeFileSync('build/v2/scripts/tag_dump_identity.js', content);
console.log('Successfully updated to use keyset pagination');
