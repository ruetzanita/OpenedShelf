import json
import re

with open('src/templates.js', 'r') as f:
    content = f.read()

# 1. Add THEME_TROPE_MAP import
if "import { THEME_TROPE_MAP }" not in content:
    content = content.replace("import { GENRE_TROPES } from './tags_genre_tropes.js';", 
                              "import { GENRE_TROPES } from './tags_genre_tropes.js';\nimport { THEME_TROPE_MAP } from './theme_trope_map.js';")

# 2. Update buildToggleUrl to auto-select mapped genres
old_toggle = """export function buildToggleUrl(currentQuery, tag) {
    if (!currentQuery) return '/?q=' + encodeURIComponent(tag);
    const { includeTags, excludeTags } = parseSearchTokens(currentQuery);
    let newParts = [];
    let removed = false;

    for (const t of includeTags) {
        if (t === tag) { removed = true; } else { newParts.push(t); }
    }
    for (const t of excludeTags) {
        if (t === tag) { removed = true; } else { newParts.push('-' + t); }
    }

    if (!removed) { newParts.push(tag); }

    const newQuery = newParts.join(' ');
    if (!newQuery) return '/';
    return '/?q=' + encodeURIComponent(newQuery);
}"""

new_toggle = """export function buildToggleUrl(currentQuery, tag) {
    let toAdd = [tag];
    // If it's a thematic tag being added, auto-select its mapped parent genres
    if (THEME_TROPE_MAP) {
        const mappedGenres = [...new Set(THEME_TROPE_MAP.filter(m => m.theme === tag).map(m => m.genre))];
        if (mappedGenres.length > 0) {
            toAdd = [tag, ...mappedGenres];
        }
    }

    if (!currentQuery) {
        return '/?q=' + encodeURIComponent(toAdd.join(' '));
    }
    
    const { includeTags, excludeTags } = parseSearchTokens(currentQuery);
    let newParts = [];
    let removed = false;

    for (const t of includeTags) {
        if (t === tag) { removed = true; } else { newParts.push(t); }
    }
    for (const t of excludeTags) {
        if (t === tag) { removed = true; } else { newParts.push('-' + t); }
    }

    if (!removed) { 
        // Add the tag and its mapped genres (if they aren't already in the query)
        toAdd.forEach(addTag => {
            if (!newParts.includes(addTag) && !newParts.includes('-' + addTag)) {
                newParts.push(addTag);
            }
        });
    }

    const newQuery = newParts.join(' ');
    if (!newQuery) return '/';
    return '/?q=' + encodeURIComponent(newQuery);
}"""
content = content.replace(old_toggle, new_toggle)

# 3. Add CSS for the dashboard grid
css_add = """
/* Dashboard Layout */
.dashboard-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-top: 1rem;
}
@media (max-width: 800px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }
}
.dashboard-main {
    min-width: 0;
}
.dashboard-sidebar {
    border-left: 1px dashed var(--border-color);
    padding-left: 1.5rem;
}
.horizontal-headings {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
"""
if ".dashboard-layout" not in content:
    content = content.replace("/* Search Bar & Tag Stacking */", css_add + "\n/* Search Bar & Tag Stacking */")

with open('src/templates.js', 'w') as f:
    f.write(content)
