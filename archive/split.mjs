import fs from 'fs';
import { THEMATIC_TAGS, GENRE_TAGS, SUBGENRE_CONVENTIONS } from './src/tags.js';

// Write tags_thematic.js
const thematicContent = `/**
 * OpenedShelf Tier 1: Thematic Tags
 */
export const THEMATIC_TAGS = ${JSON.stringify(THEMATIC_TAGS, null, 4)};

export function getAllThematicTags() {
    return Object.values(THEMATIC_TAGS).flat();
}
`;
fs.writeFileSync('src/tags_thematic.js', thematicContent);

// We need to split SUBGENRE_CONVENTIONS into Identity and Trope
const GENRE_SUBGENRES = {};
const GENRE_TROPES = {};

// Heuristic for tropes
const tropeKeywords = [
    'lore', 'school', 'politics', 'tale', 'nonsense', 'object', 'puppet', 'quest', 'retelling',
    'to_lovers', 'dating', 'burn', 'chance', 'sunshine', 'triangle', 'forbidden', 'courtship',
    'lies', 'divide', 'room', 'whodunit', 'sleuth', 'detective', 'reasoning', 'murder', 'hunt',
    'contact', 'loop', 'invasion', 'dreams', 'automation', 'possession', 'location', 'attack',
    'killer', 'trap', 'demonology', 'clock', 'agent', 'mole', 'cover', 'vigilante', 'chase',
    'court', 'narrative', 'repression', 'slave', 'homefront', 'siege', 'swashbuckler', 'amateur',
    'gossip', 'society', 'corruption', 'heist', 'conspiracy', 'trial', 'kidnapping', 'robbery',
    'mutiny', 'treasure', 'shipwreck', 'survival', 'gold_rush', 'race', 'scouting', 'doppelganger'
];

for (const [key, data] of Object.entries(SUBGENRE_CONVENTIONS)) {
    GENRE_SUBGENRES[key] = {
        title: data.title,
        parentTag: data.parentTag,
        tags: []
    };
    GENRE_TROPES[key] = {
        parentTag: data.parentTag,
        tags: []
    };

    for (const tag of data.tags) {
        const pureName = tag.replace('genre:', '');
        let isTrope = false;
        
        // Manual overrides from redesign document
        if (['grimdark', 'cozy_mystery', 'post_apocalyptic'].includes(pureName)) {
            isTrope = false;
        } else if (['cozy', 'litrpg'].includes(pureName)) {
            isTrope = true;
        } else {
            for (const kw of tropeKeywords) {
                if (pureName.includes(kw)) {
                    isTrope = true;
                    break;
                }
            }
        }

        if (isTrope) {
            GENRE_TROPES[key].tags.push('trope:' + pureName);
        } else {
            GENRE_SUBGENRES[key].tags.push(tag);
        }
    }
}

// Write tags_genre_identity.js
const identityContent = `/**
 * OpenedShelf Tier 2: Genre Identity Tags
 */
export const GENRE_BROWSE_MAP = ${JSON.stringify(GENRE_TAGS, null, 4)};

export const GENRE_SUBGENRES = ${JSON.stringify(GENRE_SUBGENRES, null, 4)};

export function getAllGenreIdentityTags() {
    const fromBrowse = Object.values(GENRE_BROWSE_MAP).flat();
    const fromSubgenres = Object.values(GENRE_SUBGENRES).flatMap(g => g.tags);
    return [...new Set([...fromBrowse, ...fromSubgenres])];
}
`;
fs.writeFileSync('src/tags_genre_identity.js', identityContent);

// Write tags_genre_tropes.js
const tropesContent = `/**
 * OpenedShelf Tier 3: Genre Tropes
 */
export const GENRE_TROPES = ${JSON.stringify(GENRE_TROPES, null, 4)};

export function getAllGenreTropes() {
    return Object.values(GENRE_TROPES).flatMap(g => g.tags);
}

export function getTropeParent(tropeTag) {
    for (const [, data] of Object.entries(GENRE_TROPES)) {
        if (data.tags.includes(tropeTag)) return data.parentTag;
    }
    return null;
}
`;
fs.writeFileSync('src/tags_genre_tropes.js', tropesContent);

console.log("Splitting complete!");
