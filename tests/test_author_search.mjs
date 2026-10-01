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

import { parseSearchTokens } from '../src/search_utils.js';
import { buildDiscoveryQuery } from '../src/engine.js';

console.log("TEST 1: Regular plus Author");
const tokens1 = parseSearchTokens('genre:mystery author:agatha_christie');
console.log("Tokens 1:", tokens1);
console.log("Query 1:", buildDiscoveryQuery(tokens1.includeTags, tokens1.excludeTags));

console.log("\nTEST 2: Only Author");
const tokens2 = parseSearchTokens('author:jane_austen');
console.log("Tokens 2:", tokens2);
console.log("Query 2:", buildDiscoveryQuery(tokens2.includeTags, tokens2.excludeTags));

console.log("\nTEST 3: Exclude Author");
const tokens3 = parseSearchTokens('genre:fantasy -author:tolkien');
console.log("Tokens 3:", tokens3);
console.log("Query 3:", buildDiscoveryQuery(tokens3.includeTags, tokens3.excludeTags));

console.log("\nTEST 4: Multiple Authors");
const tokens4 = parseSearchTokens('author:smith author:jones');
console.log("Tokens 4:", tokens4);
console.log("Query 4:", buildDiscoveryQuery(tokens4.includeTags, tokens4.excludeTags));
