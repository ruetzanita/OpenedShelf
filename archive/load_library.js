/**
 * OpenedShelf Library Loader
 * Fetches exactly 100 books from Open Library across 22 parent genres,
 * auto-assigns thematic tags based on subject metadata,
 * and outputs a seed SQL file.
 */

const fs = require('fs');

// Robust SQL string escaper
function sqlEsc(str) {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '').replace(/[\x00-\x1f]/g, '');
}

// 22 Parent Genres mapped to Open Library subjects
const SUBJECTS = [
    'science_fiction', 'fantasy', 'dystopia', 'horror',
    'thriller', 'mystery', 'true_crime',
    'romance', 'historical_fiction', 'adventure',
    'literary_fiction', 'humor', 'war_fiction',
    'poetry', 'biography', 'history',
    'self_help', 'science', 'business',
    'essays', 'travel', 'cookbooks'
];

// Map Open Library subjects → our approved thematic tags (updated without t_ prefix)
const SUBJECT_TAG_MAP = {
    // Setting
    'war': ['wartime', 'survival_scenario'],
    'military': ['wartime'],
    'wilderness': ['wilderness'],
    'sea stories': ['coastal', 'traveling_journey'],
    'ocean': ['coastal'],
    'urban': ['urban'],
    'rural': ['rural'],
    'prison': ['institutional', 'confined_space'],
    'school': ['institutional', 'education_systems'],
    'domestic fiction': ['domestic', 'family_dynamics'],
    'island': ['isolated'],

    // Time
    'historical fiction': ['historical'],
    'historical': ['historical'],
    'medieval': ['historical', 'pre_industrial'],
    'ancient': ['historical', 'pre_industrial'],
    'victorian': ['historical'],
    'world war': ['wartime', 'historical'],
    'dystopia': ['future', 'resistance_movement'],
    'dystopian fiction': ['future', 'resistance_movement', 'power_imbalance'],
    'futuristic': ['future'],

    // Character & Dynamics
    'romance': ['romance'],
    'love stories': ['romance'],
    'love': ['romance'],
    'family': ['family_dynamics'],
    'families': ['family_dynamics'],
    'brothers and sisters': ['family_dynamics'],
    'mothers and daughters': ['family_dynamics'],
    'fathers and sons': ['family_dynamics'],
    'coming of age': ['coming_of_age'],
    'bildungsroman': ['coming_of_age'],
    'friendship': ['coming_of_age'],
    'revenge': ['revenge_arc'],
    'betrayal': ['betrayal'],

    // Conflict
    'mystery': ['investigative'],
    'detective': ['investigative'],
    'mystery and detective stories': ['investigative'],
    'crime': ['criminal_underworld'],
    'thriller': ['time_limit'],
    'suspense': ['time_limit'],
    'espionage': ['conspiracy', 'political_intrigue'],
    'spy': ['conspiracy', 'hidden_identity'],
    'political fiction': ['political_intrigue'],
    'survival': ['survival_scenario', 'resource_scarcity'],
    'adventure': ['quest_narrative', 'traveling_journey'],
    'quest': ['quest_narrative'],
    'heist': ['heist'],
    'conspiracy': ['conspiracy', 'cover_up'],
    'corruption': ['institutional_corruption', 'corruption_of_power'],
    'true crime': ['true_crime', 'investigative'],
    'resistance': ['resistance_movement'],
    'revolution': ['resistance_movement', 'power_struggle'],

    // Themes
    'horror': ['violent_content'],
    'psychological fiction': ['mental_health'],
    'mental health': ['mental_health'],
    'mental illness': ['mental_health'],
    'depression': ['mental_health'],
    'addiction': ['addiction'],
    'alcoholism': ['addiction'],
    'drug abuse': ['addiction'],
    'grief': ['grief_and_loss'],
    'death': ['grief_and_loss', 'aging_and_mortality'],
    'loss': ['grief_and_loss'],
    'religion': ['faith_and_religion'],
    'faith': ['faith_and_religion'],
    'spirituality': ['faith_and_religion'],
    'race': ['systemic_inequality', 'identity_and_belonging'],
    'racism': ['systemic_inequality', 'justice_and_injustice'],
    'discrimination': ['systemic_inequality'],
    'social justice': ['justice_and_injustice', 'systemic_inequality'],
    'feminism': ['gender_dynamics'],
    'gender': ['gender_dynamics'],
    'women': ['gender_dynamics'],
    'immigration': ['immigration', 'displacement'],
    'immigrants': ['immigration'],
    'refugees': ['displacement', 'immigration'],
    'exile': ['displacement'],
    'identity': ['identity_and_belonging'],
    'cultural identity': ['cultural_identity', 'identity_and_belonging'],
    'indigenous': ['indigenous_perspectives'],
    'native american': ['indigenous_perspectives'],
    'colonialism': ['colonialism_legacy'],
    'slavery': ['colonialism_legacy', 'justice_and_injustice'],
    'environment': ['environmental_crisis', 'nature_vs_civilization'],
    'nature': ['nature_vs_civilization'],
    'ecology': ['environmental_crisis'],
    'climate': ['environmental_crisis'],
    'science': ['scientific_discovery'],
    'technology': ['technology_and_society'],
    'artificial intelligence': ['technology_and_society', 'future'],
    'medicine': ['medical_ethics'],
    'poverty': ['economic_systems', 'class_divide'],
    'class': ['class_divide'],
    'labor': ['labor_and_workers'],
    'politics': ['political_intrigue'],
    'power': ['power_struggle', 'corruption_of_power'],
    'philosophy': ['moral_dilemma'],
    'ethics': ['moral_dilemma', 'moral_ambiguity'],
    'humor': ['humor'],
    'satire': ['humor'],
    'comedy': ['humor'],
    'poetry': ['lyrical_prose', 'collected_works'],
    'short stories': ['collected_works'],
    'essays': ['collected_works'],
    'disability': ['disability_representation'],
    'food': ['food_and_agriculture'],
    'farming': ['food_and_agriculture', 'rural'],
    'music': ['creative_process'],
    'art': ['creative_process'],
    'writing': ['creative_process'],
    'journalism': ['investigative', 'media_and_propaganda'],
    'propaganda': ['media_and_propaganda'],
    'surveillance': ['surveillance_and_privacy'],

    // Structure
    'biography': ['first_person_pov'],
    'autobiography': ['first_person_pov', 'retrospective_narrative'],
    'memoir': ['first_person_pov', 'retrospective_narrative', 'intimate_scope'],
    'epic': ['epic_scope'],
    'saga': ['epic_scope', 'multi_generational'],
    'generational': ['multi_generational'],

    // Sci-Fi & Fantasy specifics that map to thematic
    'science fiction': ['future'],
    'space': ['isolated', 'future'],
    'robots': ['technology_and_society', 'future'],
    'fantasy': ['quest_narrative', 'epic_scope'],
    'magic': ['epic_scope'],
};

async function fetchSubject(subject, limit = 100) {
    const url = `https://openlibrary.org/subjects/${subject}.json?limit=${limit}`;
    console.log(`  Fetching: ${subject}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (data.works || []).map(w => ({
            key: w.key,
            title: w.title || 'Untitled',
            author: w.authors?.[0]?.name || 'Unknown',
            subjects: (w.subject || []).map(s => s.toLowerCase()),
            cover_id: w.cover_id
        }));
    } catch (err) {
        console.error(`  Error fetching ${subject}: ${err.message}`);
        return [];
    }
}

function assignTags(subjects) {
    const tags = new Set();
    for (const subj of subjects) {
        const lower = subj.toLowerCase();
        for (const [keyword, tagIds] of Object.entries(SUBJECT_TAG_MAP)) {
            if (lower.includes(keyword)) {
                tagIds.forEach(t => tags.add(t));
            }
        }
    }
    return [...tags];
}

function makeId(key) {
    // /works/OL123W → ol123w
    return key.replace('/works/', '').toLowerCase();
}

async function main() {
    console.log('OpenedShelf Library Loader');
    console.log('=======================\n');

    const allBooks = new Map();

    for (const subject of SUBJECTS) {
        const books = await fetchSubject(subject, 100);
        for (const book of books) {
            if (!allBooks.has(book.key)) {
                allBooks.set(book.key, book);
            } else {
                // Merge subjects for deduplication
                const existing = allBooks.get(book.key);
                book.subjects.forEach(s => {
                    if (!existing.subjects.includes(s)) existing.subjects.push(s);
                });
            }
        }
        // Rate limit: 1000ms between requests to respect Open Library API rules (1 pull/sec)
        await new Promise(r => setTimeout(r, 1100));
    }

    console.log(`\nTotal unique books: ${allBooks.size}`);

    // Generate SQL
    let sql = '-- OpenedShelf Bulk Seed: Auto-generated from Open Library\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    sql += 'PRAGMA foreign_keys = OFF;\n\n';

    // Insert works
    sql += '-- Works\n';
    let workCount = 0;
    let taggedCount = 0;
    const tagAssignments = [];

    for (const [key, book] of allBooks) {
        const id = makeId(key);
        const tags = assignTags(book.subjects);

        // Remove the arbitrary cap and arbitrary minimum 3 tags since we want ~2200 books
        const synopsis = sqlEsc(book.subjects.slice(0, 8).join(', '));
        const title = sqlEsc(book.title);
        const author = sqlEsc(book.author);
        sql += `INSERT OR IGNORE INTO Works (id, title, author, isbn, short_synopsis) VALUES ('${id}', '${title}', '${author}', NULL, '${synopsis}');\n`;

        for (const tagId of tags) {
            tagAssignments.push(`INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES ('${id}', '${tagId}');`);
        }

        workCount++;
        taggedCount += tags.length;
    }

    sql += '\n-- Tag Assignments\n';
    sql += tagAssignments.join('\n');
    sql += '\n\nPRAGMA foreign_keys = ON;\n';

    const outPath = './bulk_seed.sql';
    fs.writeFileSync(outPath, sql);

    console.log(`\nBooks written: ${workCount}`);
    console.log(`Tag assignments: ${taggedCount}`);
    console.log(`Average tags/book: ${(taggedCount / workCount).toFixed(1)}`);
    console.log(`Output: ${outPath}`);
    console.log('\nRun: npx wrangler d1 execute openedshelf_local --local --file=bulk_seed.sql');
}

main().catch(console.error);
