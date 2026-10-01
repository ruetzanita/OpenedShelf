/**
 * OpenedShelf Database Seeder
 * Ensures that the local/remote database has all broad genre tags registered
 * and dynamically populated based on book subjects.
 * Idempotent, safe, and handles orphaned tags automatically.
 */

import { THEMATIC_TAGS, GENRE_BROWSE_MAP, GENRE_IDENTITY, GENRE_TROPES, LANGUAGE_TAGS } from './tags.js';
import { mappings } from './seed_mappings.js';

export async function ensureDbSeeded(db, force = false) {
    if (!db) return;

    try {
        if (!force) {
            const rowGenre = await db.prepare("SELECT COUNT(id) as c FROM Tags WHERE id LIKE 'genre:%'").first();
            if (rowGenre && rowGenre.c >= 10) {
                return;
            }
        }

        // ALWAYS ensure Language tags exist in the Tags table so they can be queried,
        // even if the rest of the database is already seeded.
        const langStatements = [];
        const languageCodes = Object.keys(LANGUAGE_TAGS);
        for (let i = 0; i < languageCodes.length; i++) {
            const tag = `lang_${languageCodes[i]}`;
            langStatements.push(db.prepare("INSERT OR IGNORE INTO Tags (id, name, tier, scope) VALUES (?, ?, 'thematic', 'all')").bind(tag, tag));
        }
        if (langStatements.length > 0) {
            await db.batch(langStatements);
        }

        console.log("Database not seeded with actual genres. Seeding now...");

        // 1. Delete all old genre convention tags from Tags (cascades and purges old mappings in Works_Tags)
        // Also delete stale thematic tags where id starts with 'tag_thematic_' or id does not match name.
        await db.prepare("DELETE FROM Tags WHERE id LIKE 'genre:%' OR id LIKE 'g_%' OR tier IN ('genre_convention', 'genre_identity', 'genre_trope') OR (tier = 'thematic' AND (id != name OR id LIKE 'tag_thematic_%'))").run();

        // 2. Clean up orphaned tags in Works_Tags (important to prevent constraint failure)
        await db.prepare("DELETE FROM Works_Tags WHERE tag_id NOT IN (SELECT id FROM Tags) OR work_id NOT IN (SELECT id FROM Works)").run();

        // 3. Insert broad genre identity tags, sub-genres, and genre tropes
        const genreTags = [];
        // Add broad genres
        for (const [category, tags] of Object.entries(GENRE_BROWSE_MAP)) {
            tags.forEach(tagId => {
                genreTags.push([tagId, tagId, 'genre_identity', 'all']);
            });
        }
        // Add genre identity tags
        for (const [key, convention] of Object.entries(GENRE_IDENTITY)) {
            convention.tags.forEach(tagId => {
                genreTags.push([tagId, tagId, 'genre_identity', key]);
            });
        }
        // Add genre tropes
        for (const [key, data] of Object.entries(GENRE_TROPES)) {
            data.tags.forEach(tagId => {
                genreTags.push([tagId, tagId, 'genre_trope', key]);
            });
        }

        // Batch insert for genre tags
        let batchStatements = [];
        for (let i = 0; i < genreTags.length; i++) {
            const id = genreTags[i][0];
            const name = genreTags[i][1];
            const tier = genreTags[i][2];
            const scope = genreTags[i][3];
            batchStatements.push(db.prepare("INSERT OR IGNORE INTO Tags (id, name, tier, scope) VALUES (?, ?, ?, ?)").bind(id, name, tier, scope));
        }

        // Add all thematic tags to Tags table
        const thematicCategories = Object.keys(THEMATIC_TAGS);
        for (let i = 0; i < thematicCategories.length; i++) {
            const categoryTags = THEMATIC_TAGS[thematicCategories[i]];
            for (let j = 0; j < categoryTags.length; j++) {
                const tag = categoryTags[j];
                batchStatements.push(db.prepare("INSERT OR IGNORE INTO Tags (id, name, tier, scope) VALUES (?, ?, 'thematic', 'all')").bind(tag, tag));
            }
        }


        // Execute batch for Tags
        if (batchStatements.length > 0) {
            await db.batch(batchStatements);
        }

        // 4. Purge old genre mappings to prevent duplicate or stale entries
        await db.prepare("DELETE FROM Works_Tags WHERE tag_id LIKE 'g_%'").run();

        // Build subgenreParentMap to auto-grant parent tags
        const broadGenresSet = new Set();
        for (const tags of Object.values(GENRE_BROWSE_MAP)) {
            for (const t of tags) broadGenresSet.add(t);
        }
        const subgenreParentMap = {}; // tagId -> array of parentTags
        const subgenreKeys = Object.keys(GENRE_IDENTITY);
        for (let i = 0; i < subgenreKeys.length; i++) {
            const key = subgenreKeys[i];
            const convention = GENRE_IDENTITY[key];
            for (let j = 0; j < convention.tags.length; j++) {
                const tagId = convention.tags[j];
                if (broadGenresSet.has(tagId)) continue; 
                if (!subgenreParentMap[tagId]) {
                    subgenreParentMap[tagId] = [];
                }
                subgenreParentMap[tagId].push(convention.parentTag);
            }
        }

        // Add tropes to subgenreParentMap too
        const tropeKeys = Object.keys(GENRE_TROPES);
        for (let i = 0; i < tropeKeys.length; i++) {
            const key = tropeKeys[i];
            const data = GENRE_TROPES[key];
            for (let j = 0; j < data.tags.length; j++) {
                const tagId = data.tags[j];
                if (broadGenresSet.has(tagId)) continue; 
                if (!subgenreParentMap[tagId]) {
                    subgenreParentMap[tagId] = [];
                }
                if (!subgenreParentMap[tagId].includes(data.parentTag)) {
                    subgenreParentMap[tagId].push(data.parentTag);
                }
            }
        }

        // Pre-fetch all valid tags to avoid FOREIGN KEY constraint failures
        const allTagsRaw = await db.prepare("SELECT id, name FROM Tags").all();
        const validTagsSet = new Set(allTagsRaw.results.map(t => t.id));

        console.log("Base tags verified. Detailed mapping is now handled offline.");

        const totalWorks = await db.prepare("SELECT COUNT(*) as c FROM Works").first();
        const totalMappings = await db.prepare("SELECT COUNT(*) as c FROM Works_Tags").first();
        const scifiMappings = await db.prepare("SELECT COUNT(*) as c FROM Works_Tags WHERE tag_id = 'genre:hard_scifi'").first();
        const sampleSynopses = await db.prepare("SELECT short_synopsis FROM Works LIMIT 5").all();
        console.log(`DIAGNOSTICS: Works=${totalWorks?.c}, Mappings=${totalMappings?.c}, Hard Sci-Fi Mappings=${scifiMappings?.c}`);
        console.log("DIAGNOSTICS SAMPLE SYNOPSES:", JSON.stringify(sampleSynopses.results));
    } catch (err) {
        console.error("Failed to seed database with actual genres:", err);
    }
}
