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

import { renderLayout } from '../layout.js';

export function renderMyShelf() {
    const content = `
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <h2>My Private Shelf</h2>
                <div>
                    <button id="export-shelf-btn" class="secondary-btn" onclick="downloadLibraryCard()" style="display: none; margin-right: 1rem;">
                        Download Library Card
                    </button>
                    <button id="clear-shelf-btn" class="remove-btn" onclick="clearShelf()" style="display: none; border-color: #d32f2f; color: #d32f2f; font-weight: bold;">
                        Clear All Saved Books
                    </button>
                </div>
            </div>
            <div style="text-align: center; margin-bottom: 2rem;">
                <img src="/rabbit_surrounded.png" alt="A rabbit surrounded by books" style="width: 150px; opacity: 0.8;" />
            </div>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 2rem;">
                These books are saved directly in your browser's local storage. No data is sent to our servers unless you choose to sync.
            </p>
            
            <div id="myshelf-list" style="margin-bottom: 3rem;">
                <p>Loading your shelf...</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid var(--border-color); margin: 3rem 0;" />
            
            <div style="background: #f4f4f4; padding: 2rem; border-radius: 8px;">
                <h3>Anonymous Cloud Sync</h3>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 1.5rem;">
                    Want to view your shelf on another device? We don't ask for emails. Generate a sync phrase, but treat it like a crypto key—if you lose it, we cannot recover it. Unused syncs are purged after 60 days.
                </p>
                
                <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4>Generate a new phrase</h4>
                        <button class="primary-btn" onclick="generateAndSync()" style="margin-bottom: 1rem;">Sync Current Shelf</button>
                        <div id="sync-phrase-display" style="font-family: monospace; font-size: 1.2rem; font-weight: bold; padding: 1rem; background: white; border: 1px solid var(--border-color); border-radius: 4px; display: none;"></div>
                        <p id="sync-status" style="font-size: 14px; color: #d32f2f; display: none;"></p>
                    </div>
                    
                    <div style="flex: 1; min-width: 250px;">
                        <h4>Load an existing shelf</h4>
                        <input type="text" id="load-phrase-input" placeholder="e.g. copper-owl-reading" style="padding: 0.8rem; width: 100%; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 1rem; box-sizing: border-box;" />
                        <button class="secondary-btn" onclick="loadFromPhrase()">Load Shelf</button>
                        <p id="load-status" style="font-size: 14px; display: none; margin-top: 1rem;"></p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        const ADJ = ['copper', 'crimson', 'fuzzy', 'silent', 'wandering', 'ancient', 'hidden', 'silver', 'golden', 'iron', 'wooden', 'broken', 'wild', 'calm', 'dark', 'light', 'cold', 'warm'];
        const NOUN = ['owl', 'rabbit', 'fox', 'bear', 'wolf', 'river', 'mountain', 'stone', 'tree', 'leaf', 'book', 'page', 'shelf', 'ocean', 'tide', 'fire', 'wind', 'star'];
        const VERB = ['reading', 'writing', 'walking', 'running', 'sleeping', 'waking', 'flying', 'falling', 'rising', 'singing', 'whispering', 'thinking', 'dreaming', 'listening', 'watching'];
        
        function loadShelf() {
            const listContainer = document.getElementById('myshelf-list');
            const clearBtn = document.getElementById('clear-shelf-btn');
            const exportBtn = document.getElementById('export-shelf-btn');
            const shelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
            
            if (shelf.length === 0) {
                listContainer.innerHTML = \`
                    <div style="text-align: center; margin-top: 4rem;">
                        <p>Your shelf is empty. Follow the white rabbit back to <a href="/">Discover</a> and find some books!</p>
                    </div>
                \`;
                clearBtn.style.display = 'none';
                exportBtn.style.display = 'none';
                return;
            }
            
            clearBtn.style.display = 'inline-block';
            exportBtn.style.display = 'inline-block';
            
            listContainer.innerHTML = shelf.map(book => {
                const tagsList = book.tags ? book.tags.split(',') : [];
                const isbn = book.isbn || 'Unknown ISBN';
                const desc = book.short_synopsis || 'No description available.';
                
                const coverPlaceholder = \`
                    <div class="book-cover-placeholder">
                        <div class="title">\${book.title}</div>
                        <div class="author">\${book.author}</div>
                    </div>
                \`;
                
                return \`
                    <div class="book-card" id="shelf-book-\${book.id}">
                        \${coverPlaceholder}
                        <div class="book-details">
                            <div class="book-title">\${book.title}</div>
                            <div class="book-author">by \${book.author}</div>
                            <div class="book-isbn">ISBN: \${isbn}</div>
                            <div class="book-description">\${desc}</div>
                            <div class="book-tags">
                                \${tagsList.map(t => \`<a href="/?q=\${encodeURIComponent(t)}" class="tag">\${t}</a>\`).join('')}
                            </div>
                            <button class="remove-btn" onclick="removeFromShelf('\${book.id}')" style="margin-top: 1rem; border-color: #d32f2f; color: #d32f2f; font-weight: bold;">
                                Remove from Shelf
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function removeFromShelf(id) {
            let shelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
            shelf = shelf.filter(b => b.id !== id);
            localStorage.setItem('openedshelf_shelf', JSON.stringify(shelf));
            loadShelf();
        }
        
        function clearShelf() {
            if (confirm('Are you sure you want to clear your saved shelf?')) {
                localStorage.removeItem('openedshelf_shelf');
                loadShelf();
            }
        }
        
        function downloadLibraryCard() {
            const shelf = localStorage.getItem('openedshelf_shelf') || '[]';
            const blob = new Blob([shelf], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'openedshelf_library_card.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        async function generateAndSync() {
            const statusEl = document.getElementById('sync-status');
            const displayEl = document.getElementById('sync-phrase-display');
            const shelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
            
            if (shelf.length === 0) {
                statusEl.textContent = 'Add some books to your shelf first!';
                statusEl.style.display = 'block';
                return;
            }
            
            statusEl.textContent = 'Syncing...';
            statusEl.style.color = '#1a1a1a';
            statusEl.style.display = 'block';
            
            const adj = ADJ[Math.floor(Math.random() * ADJ.length)];
            const noun = NOUN[Math.floor(Math.random() * NOUN.length)];
            const verb = VERB[Math.floor(Math.random() * VERB.length)];
            const phrase = \`\${adj}-\${noun}-\${verb}\`;
            
            try {
                const res = await fetch('/api/shelf/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phrase, shelf })
                });
                
                if (!res.ok) throw new Error('Failed to sync');
                
                statusEl.textContent = 'Synced successfully! Save this phrase carefully.';
                statusEl.style.color = 'green';
                
                displayEl.textContent = phrase;
                displayEl.style.display = 'block';
            } catch (err) {
                statusEl.textContent = 'Error syncing to cloud. Please try again.';
                statusEl.style.color = '#d32f2f';
            }
        }
        
        async function loadFromPhrase() {
            const statusEl = document.getElementById('load-status');
            const inputEl = document.getElementById('load-phrase-input');
            const phrase = inputEl.value.trim().toLowerCase();
            
            if (!phrase) {
                statusEl.textContent = 'Please enter a phrase.';
                statusEl.style.color = '#d32f2f';
                statusEl.style.display = 'block';
                return;
            }
            
            statusEl.textContent = 'Loading...';
            statusEl.style.color = '#1a1a1a';
            statusEl.style.display = 'block';
            
            try {
                const res = await fetch('/api/shelf/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phrase })
                });
                
                if (!res.ok) throw new Error('Shelf not found or expired');
                
                const data = await res.json();
                const remoteShelf = data.shelf || [];
                
                // Merge logic
                let localShelf = JSON.parse(localStorage.getItem('openedshelf_shelf') || '[]');
                const localIds = new Set(localShelf.map(b => b.id));
                
                let added = 0;
                for (const book of remoteShelf) {
                    if (!localIds.has(book.id)) {
                        localShelf.push(book);
                        added++;
                    }
                }
                
                localStorage.setItem('openedshelf_shelf', JSON.stringify(localShelf));
                loadShelf();
                
                statusEl.textContent = \`Success! Merged \${added} new books into your shelf.\`;
                statusEl.style.color = 'green';
                inputEl.value = '';
            } catch (err) {
                statusEl.textContent = 'Could not find that shelf. It may have expired or the phrase is incorrect.';
                statusEl.style.color = '#d32f2f';
            }
        }
        
        document.addEventListener('DOMContentLoaded', loadShelf);
        </script>
    `;
    return renderLayout('My Shelf', content, 'myshelf');
}
