import fs from 'fs';
import { GENRE_BROWSE_MAP, GENRE_IDENTITY, THEMATIC_TAGS, LANGUAGE_TAGS } from '../src/tags.js';
import { GENRE_TROPES } from '../src/tags_genre_tropes.js';

let sql = '-- OpenedShelf Bulk Seed: Force Tag Coverage\n';
sql += 'PRAGMA foreign_keys = OFF;\n\n';

let workId = 10000;

function sqlEsc(str) {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '').replace(/[\x00-\x1f]/g, '');
}

function cleanTag(tagId) {
    return tagId.replace(/^(genre|trope|tag):/, '').replace(/_/g, ' ').toLowerCase();
}

function insertWork(tagId, parentTagIds) {
    const title = sqlEsc(`Stress Test Book for ${tagId}`);
    const author = 'Stress Tester';
    const keywords = [cleanTag(tagId)];
    parentTagIds.forEach(p => keywords.push(cleanTag(p)));
    const synopsis = sqlEsc(keywords.join(', '));
    const id = `force_${workId++}`;
    sql += `INSERT OR IGNORE INTO Works (id, title, author, isbn, short_synopsis) VALUES ('${id}', '${title}', '${author}', NULL, '${synopsis}');\n`;
}

// 1. Broad Genres
for (const tags of Object.values(GENRE_BROWSE_MAP)) {
    tags.forEach(tagId => insertWork(tagId, []));
}

// 2. Genre Identity
for (const [key, data] of Object.entries(GENRE_IDENTITY)) {
    data.tags.forEach(tagId => insertWork(tagId, [data.parentTag]));
}

// 3. Genre Tropes
for (const [key, data] of Object.entries(GENRE_TROPES)) {
    data.tags.forEach(tagId => insertWork(tagId, [data.parentTag]));
}

// 4. Thematic
for (const tags of Object.values(THEMATIC_TAGS)) {
    tags.forEach(tagId => insertWork(tagId, []));
}

// 5. Languages
Object.keys(LANGUAGE_TAGS).forEach(lang => {
    insertWork(`lang_${lang}`, []);
});

sql += '\nPRAGMA foreign_keys = ON;\n';
fs.writeFileSync('force_seed.sql', sql);
console.log(`Generated ${workId - 10000} forced mock books for 100% tag coverage.`);
