-- OpenedShelf - A brutally efficient edge architecture for readers at the margins.
-- Copyright (C) 2026 Anita Ruetz
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU Affero General Public License as published
-- by the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU Affero General Public License for more details.
--
-- You should have received a copy of the GNU Affero General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

.mode column
.headers on

-- 1. Total Works in the database
SELECT 'Total Works' as Metric, COUNT(*) as Count FROM Works;

-- 2. Total Works with at least one genre tag
SELECT 'Works with ANY Genre Tag' as Metric, COUNT(DISTINCT work_id) as Count FROM Works_Tags WHERE tag_id LIKE 'genre:%';

-- 3. Total Works with a Parent (genre_browse) tag
SELECT 'Works with Parent Tag (genre_browse)' as Metric, COUNT(DISTINCT wt.work_id) as Count 
FROM Works_Tags wt 
JOIN Tags t ON wt.tag_id = t.id 
WHERE t.tier = 'genre_browse';

-- 4. Total Works with a Subgenre (genre_identity) tag
SELECT 'Works with Subgenre Tag (genre_identity)' as Metric, COUNT(DISTINCT wt.work_id) as Count 
FROM Works_Tags wt 
JOIN Tags t ON wt.tag_id = t.id 
WHERE t.tier = 'genre_identity';

-- 5. Average number of genre tags per tagged book
SELECT 'Average Genre Tags per Tagged Book' as Metric, ROUND(CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT work_id), 2) as Count 
FROM Works_Tags 
WHERE tag_id LIKE 'genre:%';

