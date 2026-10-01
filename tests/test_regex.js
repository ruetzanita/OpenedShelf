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

let cleanName = "enemies_to_lovers";
let regexPatterns = [];

if (TROPE_KEYWORDS[cleanName]) {
    regexPatterns = TROPE_KEYWORDS[cleanName].map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
} else {
    const regexStr = cleanName.split('_').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[ -]');
    regexPatterns = [regexStr];
}

const combinedRegexStr = regexPatterns.join('|');
const regex = new RegExp(`\\b(?:${combinedRegexStr})\\b`, 'i');

console.log(regex);
console.log("Matches rivals to lovers:", regex.test("rivals to lovers"));
console.log("Matches hate to love:", regex.test("hate to love"));
console.log("Matches something else:", regex.test("something else"));
