import re

with open('src/templates.js', 'r') as f:
    content = f.read()

# Replace renderHome logic
old_home_start = "export function renderHome(results = [], count = null, q = '', suggestions = [], rabbitHoleData = null) {"
old_home_end = "return renderLayout('Discover Books', content, 'discover');\n}"

# We need to find the entire renderHome function.
match = re.search(r"export function renderHome.*?return renderLayout\('Discover Books', content, 'discover'\);\n\}", content, re.DOTALL)

if match:
    old_func = match.group(0)
    new_func = """export function renderHome(results = [], count = null, q = '', suggestions = [], rabbitHoleData = null, tagCounts = {}) {
    const { includeTags, excludeTags } = parseSearchTokens(q);
    const activeGenres = includeTags.filter(t => t.startsWith('genre:'));

    function rebuildQueryWithout(tag) {
        const newIncludes = includeTags.filter(t => t !== tag);
        const newExcludes = excludeTags.filter(t => t !== tag);
        const parts = [
            ...newIncludes,
            ...newExcludes.map(t => `-${t}`)
        ];
        return parts.join(' ');
    }

    const stackedPillsHtml = `
        ${includeTags.map(tag => `
            <span class="tag-pill">
                ${tag}
                <a href="${buildToggleUrl(q, tag)}">×</a>
            </span>
        `).join('')}
        ${excludeTags.map(tag => `
            <span class="tag-pill" style="border-color: #d32f2f; background-color: #fde8e8;">
                -${tag}
                <a href="${buildToggleUrl(q, tag)}">×</a>
            </span>
        `).join('')}
    `;

    const suggestionsHtml = suggestions.length > 0 ? `
        <div class="suggestions-box">
            <span>Suggested:</span>
            ${suggestions.map(tag => {
        if (includeTags.includes(tag) || excludeTags.includes(tag)) return '';
        const combinedQuery = q ? `${q} ${tag}` : tag;
        return `
                    <a href="/?q=${encodeURIComponent(combinedQuery)}" class="suggested-tag">${tag}</a>
                `;
    }).join('')}
        </div>
    ` : '';

    let mainContent = '';

    if (q) {
        if (results.length > 0) {
            mainContent = `
                <div class="results-header">
                    Showing <span class="counter-animate"><strong>${count}</strong></span> result${count === 1 ? '' : 's'}
                </div>
                <div class="results-list">
                    ${results.map(b => renderBookCard(b, q)).join('')}
                </div>
            `;
        } else {
            mainContent = renderRabbitHole(rabbitHoleData, q);
        }
    } else {
        mainContent = `
            <div style="margin-top: 1rem; margin-bottom: 2rem;">
                <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">OpenedShelf</h1>
                <p style="font-family: var(--font-serif); font-size: 1.1rem; font-style: italic; margin-bottom: 1.5rem;">
                    "Treating low-bandwidth access as a baseline right."
                </p>
                <p style="line-height: 1.6; margin-bottom: 2rem;">
                    Welcome to the open-taxonomy book archive. To search, stack facts (genres, tropes, and thematic tags) rather than natural language. Or use the sidebar to drill down into specific collections.
                </p>
                <div style="background: transparent; border: 1px solid var(--border-color); border-radius: 4px; padding: 1rem;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Sample Stacks:</h3>
                    <ul style="margin: 0.5rem 0 0 1.2rem; padding: 0; line-height: 1.6;">
                        <li><a href="/?q=genre:fantasy+isolated">genre:fantasy isolated</a> (Fantasy in isolated settings)</li>
                        <li><a href="/?q=genre:mystery+genre:locked_room_puzzle">genre:mystery genre:locked_room_puzzle</a> (Classic locked-room mystery)</li>
                        <li><a href="/?q=genre:science_fiction+genre:time_travel+-violent_content">genre:science_fiction genre:time_travel -violent_content</a> (Gentle time travel)</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // --- SIDEBAR GENERATION ---
    const genreSectionsHtml = Object.entries(GENRE_BROWSE_MAP).map(([category, genres]) => {
        return `
            <details class="genre-group" style="margin-bottom: 0.5rem;">
                <summary style="font-weight: bold; font-family: var(--font-serif); font-size: 0.95rem; cursor: pointer; border-bottom: 1px solid var(--border-color); padding-bottom: 0.1rem; outline: none;">
                    ${category}
                </summary>
                <div class="tag-cloud" style="margin-top: 0.4rem;">
                    ${genres.map(genre => {
            const countStr = tagCounts[genre] ? ` <span class="tag-count">(${tagCounts[genre]})</span>` : '';
            return `<a href="${buildToggleUrl(q, genre)}" class="tag-cloud-item">${genre}${countStr}</a>`;
        }).join('')}
                </div>
            </details>
        `;
    }).join('');

    const thematicSectionsHtml = Object.entries(THEMATIC_TAGS).map(([cat, tags]) => {
        return `
            <details class="cat-group" style="margin-bottom: 0.5rem;">
                <summary style="font-family: var(--font-serif); font-weight: bold; font-size: 0.9rem; cursor: pointer; outline: none;">${cat}</summary>
                <div class="tag-cloud" style="margin-top: 0.25rem; padding-left: 0.5rem;">
                    ${tags.map(tag => {
            const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
            return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item">${tag}${countStr}</a>`;
        }).join('')}
                </div>
            </details>
        `;
    }).join('');

    const identitySectionsHtml = Object.entries(GENRE_IDENTITY)
        .filter(([key, data]) => activeGenres.length === 0 || activeGenres.includes(data.parentTag))
        .map(([key, data]) => {
            return `
                <div class="cat-group" style="margin-bottom: 0.75rem;">
                    <div style="font-family: var(--font-serif); font-weight: bold; font-size: 0.9rem; margin-bottom: 0.25rem;">${data.title} Sub-genres</div>
                    <div class="tag-cloud">
                        ${data.tags.map(tag => {
                const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
                return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item">${tag}${countStr}</a>`;
            }).join('')}
                    </div>
                </div>
            `;
        }).join('');

    const tropeSectionsHtml = Object.entries(GENRE_TROPES)
        .filter(([key, data]) => activeGenres.length === 0 || activeGenres.includes(data.parentTag))
        .map(([key, data]) => {
            const parentTitle = GENRE_IDENTITY[key] ? GENRE_IDENTITY[key].title : key;
            return `
                <div class="cat-group" style="margin-bottom: 0.75rem;">
                    <div style="font-family: var(--font-serif); font-weight: bold; font-size: 0.9rem; margin-bottom: 0.25rem;">${parentTitle} Tropes</div>
                    <div class="tag-cloud">
                        ${data.tags.map(tag => {
                const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
                return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item">${tag}${countStr}</a>`;
            }).join('')}
                    </div>
                </div>
            `;
        }).join('');

    const sidebarContent = `
        <div class="genre-header" style="margin-top: 0;">
            <h2 style="font-size: 1.1rem; margin:0;">Standard Genres</h2>
        </div>
        <div style="margin-bottom: 1.5rem;">
            ${genreSectionsHtml}
        </div>

        <div class="genre-header">
            <h2 style="font-size: 1.1rem; margin:0;">Thematic Elements</h2>
        </div>
        <div class="horizontal-headings" style="margin-bottom: 1.5rem;">
            ${thematicSectionsHtml}
        </div>

        ${activeGenres.length > 0 ? `
            <div class="genre-header">
                <h2 style="font-size: 1.1rem; margin:0;">Specific Genre Identity</h2>
            </div>
            <div style="margin-bottom: 1.5rem;">
                ${identitySectionsHtml}
            </div>

            <div class="genre-header">
                <h2 style="font-size: 1.1rem; margin:0;">Specific Genre Tropes</h2>
            </div>
            <div style="margin-bottom: 1.5rem;">
                ${tropeSectionsHtml}
            </div>
        ` : `
            <div style="font-size: 11px; opacity: 0.6; font-style: italic; padding: 1rem; border: 1px dashed var(--border-color); text-align: center;">
                Select a Genre or Thematic tag to view specific identities and tropes.
            </div>
        `}
    `;

    const content = `
        <div class="search-container">
            <form id="search-form" action="/" method="GET">
                <input type="hidden" id="active-query-val" value="${q}">
                <div class="search-box-wrapper">
                    <div class="stacked-tags" id="stacked-tags-container">
                        ${stackedPillsHtml}
                    </div>
                    <input type="text" id="search-input" class="search-input" name="q" placeholder="Type tags here..." value="${q}">
                    <button type="submit" class="search-submit">Discover</button>
                </div>
            </form>
            <noscript>
                <style>
                    .stacked-tags { display: none !important; }
                </style>
            </noscript>
            ${suggestionsHtml}
            <div style="font-size: 11px; opacity: 0.8; margin-top: 0.5rem; text-align: center;">
                💡 <strong>Pro Tip:</strong> The engine is smart. You can just type "fantasy" or "locked room" and we'll automatically map it.
            </div>
        </div>

        <div class="dashboard-layout">
            <div class="dashboard-main">
                ${mainContent}
            </div>
            <div class="dashboard-sidebar">
                ${sidebarContent}
            </div>
        </div>

        ${searchScript}
        ${shelfScript}
    `;

    return renderLayout('Discover Books', content, 'discover');
}"""
    content = content.replace(old_func, new_func)

with open('src/templates.js', 'w') as f:
    f.write(content)
