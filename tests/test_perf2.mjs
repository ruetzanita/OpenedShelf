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

const strings = [];
for(let i=0; i<100000; i++) {
    strings.push("This is a random short synopsis that has a few words but probably not the keywords we are looking for like space exploration or something.");
}
const kws = [];
for(let i=0; i<3700; i++) kws.push('keyword' + i);
const regex = new RegExp('(' + kws.join('|') + ')', 'i');

console.time('RegExp 3700 keywords on 100k strings');
let matches = 0;
for(let i=0; i<strings.length; i++) {
    if(regex.test(strings[i])) matches++;
}
console.timeEnd('RegExp 3700 keywords on 100k strings');
