import fs from 'fs';
import { mappings } from './src/seed_mappings.js';
import { GENRE_IDENTITY, GENRE_BROWSE_MAP } from './src/tags_genre_identity.js';
import { GENRE_TROPES } from './src/tags_genre_tropes.js';

const validTags = new Set();
for (const tags of Object.values(GENRE_BROWSE_MAP)) {
    tags.forEach(t => validTags.add(t));
}
for (const conv of Object.values(GENRE_IDENTITY)) {
    conv.tags.forEach(t => validTags.add(t));
}
for (const data of Object.values(GENRE_TROPES)) {
    data.tags.forEach(t => validTags.add(t));
}

// Keep only valid mappings or those that aren't 'genre:'
const newMappings = mappings.filter(mapping => {
    const tagId = mapping[0];
    if (tagId.startsWith('genre:')) {
        return validTags.has(tagId);
    }
    return true; // Keep thematic/audience
});

console.log("Filtered down to", newMappings.length, "valid mappings from", mappings.length);

// Generate missing mappings
const existingTags = new Set(newMappings.map(m => m[0]));
let addedCount = 0;
for (const tag of validTags) {
    if (!existingTags.has(tag)) {
        // Create a generic mapping
        const name = tag.replace('genre:', '').replace(/_/g, ' ');
        newMappings.push([tag, "short_synopsis LIKE ?", [`%${name}%`]]);
        addedCount++;
    }
}

console.log("Added", addedCount, "missing generic mappings.");

// Format the new file
let fileContent = `// Auto-generated curated SQL seed mappings
export const mappings = [
`;
for (const m of newMappings) {
    fileContent += `    ['${m[0]}', "${m[1]}", ${JSON.stringify(m[2])}],\n`;
}
fileContent += `];\n`;

fs.writeFileSync('src/seed_mappings.js', fileContent);
console.log("Written to src/seed_mappings.js");
