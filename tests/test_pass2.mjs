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
import { IDENTITY_KEYWORDS } from './build/v2/src/tags_identity_keywords.js';
import { GENRE_IDENTITY } from './build/v2/src/tags.js';

const db = new DatabaseSync('build/v2/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/17c70b0cbaa8bbfcfb92adfb009744335ac779106d070430fa6d10bdc12a3fe0.sqlite');

const tagRegexes = Object.keys(IDENTITY_KEYWORDS).map(cleanName => {
    let regexPatterns = IDENTITY_KEYWORDS[cleanName].map(kw => {
        let escaped = kw.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\$&');
        return escaped.replace(/\\-| /g, '[ -]');
    });
    const combinedRegexStr = regexPatterns.join('|');
    return {
        id: `genre:${cleanName}`,
        regex: new RegExp(`\\b(?:${combinedRegexStr})\\b`, 'i')
    };
});

let matches = 0;
const rows = db.prepare('SELECT ol_subjects, ol_genres FROM Works WHERE ol_subjects IS NOT NULL OR ol_genres IS NOT NULL LIMIT 100000').all();
for (const row of rows) {
    const categoricalText = [row.ol_subjects, row.ol_genres].filter(Boolean).join(', ');
    if (categoricalText.length > 0) {
        let hit = false;
        for (const rule of tagRegexes) {
            if (rule.regex.test(categoricalText)) {
                hit = true;
            }
        }
        if (hit) matches++;
    }
}
console.log('Pass 2 Matches:', matches);
