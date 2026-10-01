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

import { STYLES } from './styles.js';
import { buildToggleUrl } from '../utils/url.js';

export function renderLayout(title, content, activeTab) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="OpenedShelf: Open → Discovery → Rabbit Hole">
    <title>${title} | OpenedShelf</title>
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐇</text></svg>">
</head>
<body>
    <header>
        <a href="/" class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 16a3 3 0 0 1 2.24 5"></path>
                <path d="M18 12h.01"></path>
                <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3"></path>
                <path d="M20 8.54V4a2 2 0 1 0-4 0v3"></path>
                <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3"></path>
            </svg> OpenedShelf
        </a>
        <nav>
            <a href="/" class="${activeTab === 'discover' ? 'active' : ''}">Discover</a>

            <a href="/myshelf" class="${activeTab === 'myshelf' ? 'active' : ''}">My Shelf</a>
            <a href="/propose" class="${activeTab === 'propose' ? 'active' : ''}">Submit Tag</a>
            <a href="/about" class="${activeTab === 'about' ? 'active' : ''}">About</a>
        </nav>
    </header>
    <main>
        ${content}
    </main>
    <footer>
        <p>OpenedShelf Engine is licensed under AGPL-3.0. Taxonomy under CC0. • Built for privacy. • Book metadata provided by <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" style="color: inherit;">Open Library</a>. • Contact: <a href="mailto:rabbit@openedshelf.org">rabbit@openedshelf.org</a></p>
    </footer>
</body>
</html>
    `;
}

export function renderBookCard(book, currentQuery = '') {
    const tagsList = book.tags ? book.tags.split(',') : [];

    const bookJson = encodeURIComponent(JSON.stringify({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        tags: book.tags || '',
        short_synopsis: book.short_synopsis || ''
    }));

    const title = book.title;
    const author = book.author;
    const isbn = book.isbn || 'Unknown ISBN';
    const desc = book.short_synopsis || 'No description available.';

    const coverPlaceholder = `
        <div class="book-cover-placeholder">
            <div class="title">${title}</div>
            <div class="author">${author}</div>
        </div>
    `;

    return `
        <div class="book-card" id="book-${book.id}">
            ${coverPlaceholder}
            <div class="book-details">
                <div class="book-header">
                    <div class="book-title-group">
                        <div class="book-title">${title}</div>
                        <div class="book-author">by ${author}</div>
                        <div class="book-isbn">ISBN: ${isbn}</div>
                    </div>
                    <button class="add-shelf-btn" onclick="addToShelf('${book.id}', '${bookJson}')" id="add-btn-${book.id}">
                        Save to My Shelf
                    </button>
                </div>
                <details class="book-synopsis-accordion">
                    <summary>Read Synopsis</summary>
                    <div class="book-description">${desc}</div>
                    ${(isbn && isbn !== 'Unknown ISBN') 
                        ? `<a href="https://openlibrary.org/isbn/${isbn}" target="_blank" rel="noopener noreferrer" class="external-library-link">View on Open Library ↗</a>` 
                        : `<a href="https://openlibrary.org/works/${book.id.toUpperCase()}" target="_blank" rel="noopener noreferrer" class="external-library-link">View on Open Library ↗</a>`
                    }
                </details>
                <div class="book-tags">
                    ${tagsList.map(t => `<a href="${buildToggleUrl(currentQuery, t)}" class="tag">${t}</a>`).join('')}
                </div>
            </div>
        </div>
    `;
}

export function renderRabbitHole(rabbitHoleData, q, fuzzyResults = []) {
    const stepsHtml = rabbitHoleData && rabbitHoleData.length > 0 ? `
        <div class="rabbithole-steps">
            <h4>How you got here:</h4>
            ${rabbitHoleData.map((step, index) => {
        let tagDisplay = step.addedTag || step.query; // Fallback to query if addedTag is missing
        if (index > 0 && step.addedTag) {
            if (tagDisplay.startsWith('-')) {
                tagDisplay = `- ${tagDisplay.substring(1)}`;
            } else {
                tagDisplay = `+ ${tagDisplay}`;
            }
        }
        const displayStepCount = step.count >= 1000 ? '1,000+' : step.count;
        return `
                    <div class="rabbithole-step">
                        <span><code>${tagDisplay}</code></span>
                        <span><strong>${displayStepCount}</strong> book${step.count === 1 ? '' : 's'}</span>
                    </div>
                `;
    }).join('')}
        </div>
    ` : '';

    return `
        <div class="rabbithole-container">
            <h3>We couldn't quite find that one on the shelf.</h3>
            <p>You have successfully discovered a gap in the literary map! You've stacked a combination of tropes and facts that does not exist in our catalog yet.</p>
            
            <img class="rabbithole-graphic" src="/rabbithole.png" alt="A rabbit reading a book by a rabbit hole" width="551" height="345" loading="lazy" />
            
            ${stepsHtml}
            
            <button id="share-btn" class="share-btn" onclick="copyRabbitHoleUrl()">
                Share this Rabbit Hole
            </button>

            ${fuzzyResults && fuzzyResults.length > 0 ? `
                <div class="fuzzy-fall-section" style="margin-top: 3rem; border-top: 1px dashed var(--border-color); padding-top: 2rem; text-align: left;">
                    <h3 style="font-family: var(--font-serif); margin-bottom: 0.5rem; text-align: center;">Fuzzy Fall: One Step Back</h3>
                    <p style="margin-bottom: 2rem; opacity: 0.9; text-align: center;">We couldn't find an exact match for all your tags, but here are some books that are just one step away. A new rabbit hole awaits.</p>
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <img class="fuzzyfall-graphic" src="/fuzzy_fall_quizzical.png" alt="A quizzical rabbit looking for books" width="1024" height="1024" loading="lazy" />
                    </div>
                    <div class="results-list">
                        ${fuzzyResults.map(b => renderBookCard(b, '')).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <script>
        function copyRabbitHoleUrl() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const btn = document.getElementById('share-btn');
                btn.innerText = 'URL Copied!';
                btn.style.borderColor = '#2e7d32';
                btn.style.color = '#2e7d32';
                setTimeout(() => {
                    btn.innerText = 'Share this Rabbit Hole';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
        </script>
    `;
}
