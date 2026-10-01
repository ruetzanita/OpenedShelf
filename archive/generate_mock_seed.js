const fs = require('fs');

const PARENT_GENRES = {
    'science_fiction': ['space_opera', 'cyberpunk', 'time_travel', 'steampunk', 'post_apocalyptic'],
    'fantasy': ['high_fantasy', 'urban_fantasy', 'grimdark', 'portal_fantasy', 'sword_and_sorcery'],
    'dystopian': ['totalitarian', 'post_apocalyptic', 'cyberpunk', 'genetic_engineering'],
    'horror': ['gothic_horror', 'cosmic_horror', 'body_horror', 'survival_horror', 'slasher'],
    'thriller': ['psychological_thriller', 'technothriller', 'espionage', 'suspense'],
    'mystery': ['cozy_mystery', 'hardboiled_noir', 'police_procedural', 'detective', 'locked_room'],
    'true_crime': ['serial_killer', 'heist', 'forensics', 'cold_case'],
    'romance': ['regency', 'enemies_to_lovers', 'slow_burn', 'dark_romance', 'western_romance'],
    'historical_fiction': ['world_war_ii', 'medieval', 'victorian', 'ancient_rome'],
    'adventure': ['quest_narrative', 'treasure_hunt', 'survival_scenario', 'traveling_journey'],
    'literary_fiction': ['family_saga', 'coming_of_age', 'magical_realism', 'social_commentary'],
    'humor': ['satire', 'romantic_comedy', 'parody', 'dark_comedy'],
    'war_fiction': ['trench_warfare', 'naval_battle', 'resistance_movement', 'home_front'],
    'poetry': ['lyrical_prose', 'collected_works', 'epic_poetry', 'spoken_word'],
    'biography': ['first_person_pov', 'historical_figure', 'political_leader', 'artist_life'],
    'memoir': ['first_person_pov', 'intimate_scope', 'retrospective_narrative', 'grief_and_loss'],
    'history': ['ancient_history', 'military_history', 'social_history', 'cultural_history'],
    'self_help': ['personal_finance', 'mental_health', 'productivity', 'spirituality'],
    'science': ['astrophysics', 'biology', 'quantum_mechanics', 'evolution'],
    'technology': ['artificial_intelligence', 'computer_science', 'robotics', 'internet_history'],
    'business': ['entrepreneurship', 'management', 'economics', 'marketing'],
    'finance': ['investing', 'personal_finance', 'corporate_finance', 'cryptocurrency'],
    'essays': ['cultural_critique', 'personal_essays', 'literary_criticism', 'political_essays'],
    'travel': ['travelogue', 'guidebook', 'exploration', 'cultural_exchange'],
    'cookbooks': ['baking', 'vegan', 'regional_cuisine', 'quick_meals']
};

const THEMATIC_TAGS = [
    'isolated', 'confined_space', 'urban', 'rural', 'wilderness', 'wartime',
    'historical', 'contemporary', 'future', 'dual_timeline', 'epic_scope',
    'first_person_pov', 'unreliable_narrator', 'coming_of_age', 'anti_hero',
    'survival_scenario', 'heist', 'conspiracy', 'revenge_arc', 'grief_and_loss',
    'immigration', 'mental_health', 'violent_content', 'humor'
];

const AUDIENCE_TAGS = ['young_adult', 'new_adult', 'middle_grade', 'childrens', 'adult'];

function sqlEsc(str) {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '').replace(/[\x00-\x1f]/g, '');
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

let sql = '-- OpenedShelf Bulk Seed: Mock Data\n';
sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
sql += 'PRAGMA foreign_keys = OFF;\n\n';
sql += '-- Works\n';

let workId = 1;
for (const [genre, subgenres] of Object.entries(PARENT_GENRES)) {
    for (let i = 1; i <= 100; i++) {
        const id = `mock_${genre}_${i}`;
        const title = sqlEsc(`The ${genre.replace('_', ' ')} Book ${i}`);
        const author = sqlEsc(`Author ${i}`);
        
        // Build synopsis keywords
        const keywords = [];
        keywords.push(genre.replace(/_/g, ' ')); // The parent genre as natural language
        keywords.push(...getRandomElements(subgenres, getRandomInt(2) + 1).map(sg => sg.replace(/_/g, ' '))); // Sub-genres
        keywords.push(...getRandomElements(THEMATIC_TAGS, getRandomInt(3) + 2).map(t => t.replace(/_/g, ' '))); // Thematic tags
        if (Math.random() > 0.5) {
            keywords.push(AUDIENCE_TAGS[getRandomInt(AUDIENCE_TAGS.length)].replace(/_/g, ' ')); // Audience tags
        }
        
        const synopsis = sqlEsc(keywords.join(', '));
        
        sql += `INSERT OR IGNORE INTO Works (id, title, author, isbn, short_synopsis) VALUES ('${id}', '${title}', '${author}', NULL, '${synopsis}');\n`;
        workId++;
    }
}

sql += '\nPRAGMA foreign_keys = ON;\n';

fs.writeFileSync('bulk_seed.sql', sql);
console.log(`Generated ${workId - 1} mock books across ${Object.keys(PARENT_GENRES).length} genres.`);
console.log('Run: npx wrangler d1 execute openedshelf_local --local --file=bulk_seed.sql');
