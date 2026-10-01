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

import { parseSearchTokens } from '../../search_utils.js';
import { THEMATIC_TAGS } from '../../tags_thematic.js';
import { GENRE_IDENTITY, GENRE_BROWSE_MAP } from '../../tags_genre_identity.js';
import { GENRE_TROPES } from '../../tags_genre_tropes.js';
import { THEME_TROPE_MAP } from '../../theme_trope_map.js';
import { LANGUAGE_TAGS } from '../../tags_language.js';
import { buildToggleUrl } from '../../utils/url.js';
import { renderLayout, renderBookCard, renderRabbitHole } from '../layout.js';

// Pre-build child-to-parent genre mapping to automatically expand sidebars.
const childToParentGenre = {};
for (const [key, data] of Object.entries(GENRE_IDENTITY)) {
    if (data.parentTag && data.tags) {
        for (const tag of data.tags) {
            if (!childToParentGenre[tag]) {
                childToParentGenre[tag] = [];
            }
            if (!childToParentGenre[tag].includes(data.parentTag)) {
                childToParentGenre[tag].push(data.parentTag);
            }
        }
    }
}
for (const [key, data] of Object.entries(GENRE_TROPES)) {
    if (data.parentTag && data.tags) {
        for (const tag of data.tags) {
            if (!childToParentGenre[tag]) {
                childToParentGenre[tag] = [];
            }
            if (!childToParentGenre[tag].includes(data.parentTag)) {
                childToParentGenre[tag].push(data.parentTag);
            }
        }
    }
}

const searchScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    // If JS is active, we clear the active tags from the input value on start
    // because they are already rendered as visual pills.
    // The input will only contain "unparsed" text.
    searchInput.value = '';
    searchInput.placeholder = 'Add tags (e.g. trope:locked_room)...';

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeQuery = document.getElementById('active-query-val').value;
        const newTerms = searchInput.value.trim();
        if (!newTerms) {
            window.location.href = '/?q=' + encodeURIComponent(activeQuery);
            return;
        }
        
        const combined = activeQuery ? (activeQuery + ' ' + newTerms) : newTerms;
        window.location.href = '/?q=' + encodeURIComponent(combined);
    });
});
</script>
`;

const shelfScript = `
<script>
function addToShelf(id, bookDataStr) {
    let shelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
    const book = JSON.parse(decodeURIComponent(bookDataStr));
    
    const index = shelf.findIndex(b => b.id === id);
    if (index === -1) {
        shelf.push(book);
        localStorage.setItem('openedshelf_shelf', JSON.stringify(shelf));
        const btn = document.getElementById('add-btn-' + id);
        if (btn) {
            btn.innerText = 'Saved!';
            btn.style.borderColor = '#2e7d32';
            btn.style.color = '#2e7d32';
        }
    } else {
        const btn = document.getElementById('add-btn-' + id);
        if (btn) {
            btn.innerText = 'Saved!';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let shelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
    shelf.forEach(book => {
        const btn = document.getElementById('add-btn-' + book.id);
        if (btn) {
            btn.innerText = 'Saved!';
            btn.style.borderColor = '#2e7d32';
            btn.style.color = '#2e7d32';
        }
    });
});
</script>
`;

export function renderHome(results = [], count = null, q = '', suggestions = [], rabbitHoleData = null, tagCounts = {}, fuzzyResults = []) {
    const { includeTags, excludeTags } = parseSearchTokens(q);

    // Resolve parent standard genres for all active child tags and thematic tags
    const activeGenres = [];
    for (const tag of includeTags) {
        if (tag.startsWith('genre:')) {
            if (!activeGenres.includes(tag)) {
                activeGenres.push(tag);
            }
            const parents = childToParentGenre[tag];
            if (parents) {
                for (const parent of parents) {
                    if (!activeGenres.includes(parent)) {
                        activeGenres.push(parent);
                    }
                }
            }
        } else {
            // Resolve parent genres of active thematic tags to expand sidebars
            if (THEME_TROPE_MAP) {
                const mappedGenres = THEME_TROPE_MAP
                    .filter(m => m.theme === tag)
                    .map(m => m.genre);
                for (const genre of mappedGenres) {
                    if (!activeGenres.includes(genre)) {
                        activeGenres.push(genre);
                    }
                    const parents = childToParentGenre[genre];
                    if (parents) {
                        for (const parent of parents) {
                            if (!activeGenres.includes(parent)) {
                                activeGenres.push(parent);
                            }
                        }
                    }
                }
            }
        }
    }

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
            const displayCount = count >= 1000 ? '1,000+' : count;
            mainContent = `
                <div class="results-header">
                    Showing <span class="counter-animate"><strong>${displayCount}</strong></span> result${count === 1 ? '' : 's'}
                </div>
                <div class="results-list">
                    ${results.map(b => renderBookCard(b, q)).join('')}
                </div>
            `;
        } else {
            mainContent = renderRabbitHole(rabbitHoleData, q, fuzzyResults);
        }
    } else {
        mainContent = `
            <div style="margin: 1rem auto 3rem auto; text-align: center; max-width: 800px;">
                <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">OpenedShelf</h1>
                <p style="font-family: var(--font-serif); font-size: 1.1rem; font-style: italic; margin-bottom: 1.5rem;">
                    "Unlocking the joy of discovery for every reader, on every device."
                </p>
                <div style="margin: 2rem 0;">
                    <img src="/rabbit_reading.png" alt="A rabbit sitting and reading a book" width="1024" height="1024" style="width: 150px; height: auto; opacity: 0.8;" loading="lazy" />
                </div>
                <p style="line-height: 1.6; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Welcome to the open-taxonomy book archive. To search, stack facts (genres, tropes, and thematic tags) rather than natural language. Or use the sidebar to drill down into specific collections.
                </p>
                <div style="background: transparent; border: 1px solid var(--border-color); border-radius: 4px; padding: 1rem; text-align: left; max-width: 600px; margin: 0 auto;">
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
        const isOpen = genres.some(genre => includeTags.includes(genre) || activeGenres.includes(genre)) ? 'open' : '';
        return `
            <details class="genre-group" style="margin-bottom: 0.5rem;" ${isOpen}>
                <summary style="font-weight: bold; font-family: var(--font-serif); font-size: 0.95rem; cursor: pointer; border-bottom: 1px solid var(--border-color); padding-bottom: 0.1rem; outline: none;">
                    ${category}
                </summary>
                <div class="tag-cloud" style="margin-top: 0.4rem;">
                    ${genres.map(genre => {
            const countStr = tagCounts[genre] ? ` <span class="tag-count">(${tagCounts[genre]})</span>` : '';
            const activeClass = includeTags.includes(genre) ? ' active' : '';
            return `<a href="${buildToggleUrl(q, genre)}" class="tag-cloud-item${activeClass}">${genre}${countStr}</a>`;
        }).join('')}
                </div>
            </details>
        `;
    }).join('');

    const thematicSectionsHtml = Object.entries(THEMATIC_TAGS).map(([cat, tags]) => {
        const isOpen = tags.some(tag => includeTags.includes(tag)) ? 'open' : '';
        return `
            <details class="cat-group" style="margin-bottom: 0.5rem;" ${isOpen}>
                <summary style="font-family: var(--font-serif); font-weight: bold; font-size: 0.9rem; cursor: pointer; outline: none;">${cat}</summary>
                <div class="tag-cloud" style="margin-top: 0.25rem; padding-left: 0.5rem;">
                    ${tags.map(tag => {
            const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
            const activeClass = includeTags.includes(tag) ? ' active' : '';
            return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item${activeClass}">${tag}${countStr}</a>`;
        }).join('')}
                </div>
            </details>
        `;
    }).join('');

    const activeSubgenresDropdownsHtml = Object.entries(GENRE_IDENTITY)
        .filter(([key, data]) => activeGenres.includes(data.parentTag))
        .map(([key, data]) => {
            const parentTitle = data.title;
            const identityTags = data.tags || [];
            const tropeData = GENRE_TROPES[key];
            const tropeTags = tropeData ? tropeData.tags : [];

            let subgenreHtml = '';

            if (identityTags.length > 0) {
                const isOpen = identityTags.some(tag => includeTags.includes(tag)) ? 'open' : '';
                subgenreHtml += `
                    <details class="genre-group" style="margin-bottom: 0.5rem;" ${isOpen}>
                        <summary style="font-weight: bold; font-family: var(--font-serif); font-size: 0.95rem; cursor: pointer; border-bottom: 1px solid var(--border-color); padding-bottom: 0.1rem; outline: none;">
                            ${parentTitle} Interest
                        </summary>
                        <div class="tag-cloud" style="margin-top: 0.4rem;">
                            ${identityTags.map(tag => {
                                const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
                                const activeClass = includeTags.includes(tag) ? ' active' : '';
                                return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item${activeClass}">${tag}${countStr}</a>`;
                            }).join('')}
                        </div>
                    </details>
                `;
            }

            if (tropeTags.length > 0) {
                const isOpen = tropeTags.some(tag => includeTags.includes(tag)) ? 'open' : '';
                subgenreHtml += `
                    <details class="cat-group" style="margin-bottom: 0.5rem;" ${isOpen}>
                        <summary style="font-family: var(--font-serif); font-weight: bold; font-size: 0.9rem; cursor: pointer; outline: none;">
                            ${parentTitle} Trope
                        </summary>
                        <div class="tag-cloud" style="margin-top: 0.25rem; padding-left: 0.5rem;">
                            ${tropeTags.map(tag => {
                                const countStr = tagCounts[tag] ? ` <span class="tag-count">(${tagCounts[tag]})</span>` : '';
                                const activeClass = includeTags.includes(tag) ? ' active' : '';
                                return `<a href="${buildToggleUrl(q, tag)}" class="tag-cloud-item${activeClass}">${tag}${countStr}</a>`;
                            }).join('')}
                        </div>
                    </details>
                `;
            }

            return subgenreHtml;
        }).join('');

    const activeLanguages = Object.entries(LANGUAGE_TAGS)
        .map(([code, name]) => {
            const tag = `lang:${code}`;
            return { tag, name, count: tagCounts[tag] || 0 };
        })
        .sort((a, b) => b.count - a.count);

    let languageSectionHtml = '';
    if (activeLanguages.length > 0) {
        languageSectionHtml = `
            <div class="genre-header">
                <h2 style="font-size: 1.1rem; margin:0;">Language</h2>
            </div>
            <div class="cat-group" style="margin-bottom: 1.5rem;">
                <select id="language-select" class="sidebar-select" style="margin-bottom: 0;" onchange="
                    const newLangTag = this.value;
                    let query = document.getElementById('active-query-val').value;
                    
                    const tokens = query.split(/\\s+/);
                    const filteredTokens = tokens.filter(t => !t.startsWith('lang:') && !t.startsWith('-lang:') && t.trim() !== '');
                    
                    if (newLangTag) {
                        filteredTokens.push(newLangTag);
                    }
                    
                    const newQuery = filteredTokens.join(' ').trim();
                    window.location.href = '/?q=' + encodeURIComponent(newQuery);
                ">
                    <option value="">Any Language</option>
                    ${activeLanguages.map(lang => {
            const isSelected = includeTags.includes(lang.tag) ? 'selected' : '';
            const countDisplay = lang.count > 0 ? ` (${lang.count})` : '';
            return `<option value="${lang.tag}" ${isSelected}>${lang.name}${countDisplay}</option>`;
        }).join('')}
                </select>
            </div>
        `;
    }

    const sidebarContent = `
        <div class="genre-header" style="margin-top: 0;">
            <h2 style="font-size: 1.1rem; margin:0;">Start Broad: Genres</h2>
        </div>
        <div style="margin-bottom: 1.5rem;">
            ${genreSectionsHtml}
        </div>

        <div class="genre-header">
            <h2 style="font-size: 1.1rem; margin:0;">Stack the Facts: Thematic Elements</h2>
        </div>
        <div class="horizontal-headings" style="margin-bottom: 1.5rem;">
            ${thematicSectionsHtml}
        </div>

        ${languageSectionHtml}

        ${activeGenres.length > 0 ? `
            <div class="genre-header">
                <h2 style="font-size: 1.1rem; margin:0;">Refine by Subgenre</h2>
            </div>
            <div style="margin-bottom: 1.5rem;">
                ${activeSubgenresDropdownsHtml}
            </div>
        ` : `
            <div style="font-size: 11px; opacity: 0.6; font-style: italic; padding: 1rem; border: 1px dashed var(--border-color); text-align: center;">
                Select a Genre or Thematic tag to view specific categories and tropes/devices.
            </div>
        `}
    `;

    const welcomeHtml = !q ? mainContent : '';
    const resultsHtml = q ? mainContent : '';

    // TODO: TEMPORARY BANNER — remove after October 3, 2026
    const outageNotice = `
        <div id="outage-banner" style="
            background: #fef3cd;
            border: 1px solid #d4a843;
            border-radius: 4px;
            padding: 0.6rem 1rem;
            margin: 0.75rem auto;
            max-width: 800px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #664d03;
        ">
            <span>⚠️ We're currently experiencing some issues. We expect everything to be back to normal by <strong>October 3</strong>. Thanks for your patience!</span>
            <button onclick="document.getElementById('outage-banner').style.display='none'" style="
                background: none;
                border: none;
                font-size: 1.1rem;
                cursor: pointer;
                color: #664d03;
                padding: 0 0.25rem;
                line-height: 1;
            " aria-label="Dismiss notice">×</button>
        </div>
    `;

    const content = `
        ${outageNotice}
        ${welcomeHtml}
        <div class="search-container">
            <form id="search-form" action="/" method="GET">
                <input type="hidden" id="active-query-val" value="${q}">
                <div class="search-box-wrapper">
                    <div class="stacked-tags" id="stacked-tags-container">
                        ${stackedPillsHtml}
                    </div>
                    <input type="text" id="search-input" class="search-input" name="q" placeholder="Type tags here..." value="${q}">
                    <button type="submit" class="search-submit">Discover</button>
                    ${q ? `<a href="/" class="clear-search-btn">Clear</a>` : ''}
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
                ${resultsHtml}
            </div>
            <div class="dashboard-sidebar">
                ${sidebarContent}
            </div>
        </div>

        ${searchScript}
        ${shelfScript}
    `;

    return renderLayout('Discover Books', content, 'discover');
}
