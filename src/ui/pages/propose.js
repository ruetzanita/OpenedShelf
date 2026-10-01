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
import { getAllThematicTags } from '../../tags_thematic.js';
import { getAllGenreIdentityTags } from '../../tags_genre_identity.js';
import { getAllGenreTropes } from '../../tags_genre_tropes.js';

export function renderPropose() {
    const thematicTags = getAllThematicTags().sort();
    const genreIdentityTags = getAllGenreIdentityTags().sort();
    const genreTropeTags = getAllGenreTropes().sort();

    const thematicOptions = thematicTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    const genreIdentityOptions = genreIdentityTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    const genreTropeOptions = genreTropeTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');

    const content = `
        <div style="max-width: 500px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="/rabbit_scribbling.png" alt="A rabbit scribbling in a book" style="width: 150px; opacity: 0.8;" />
            </div>
            <h2>Submit a Tag Proposal</h2>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 2rem;">
                Book missing a tag? Propose tags below. Your proposal will be reviewed by the Librarian council.
            </p>
            
            <form action="/api/propose" method="POST" style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="title" style="font-weight: bold; font-size: 14px;">Book Title</label>
                    <input type="text" id="title" name="title" required style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color);">
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="isbn" style="font-weight: bold; font-size: 14px;">ISBN</label>
                    <input type="text" id="isbn" name="isbn" required style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color);">
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="thematic_tag" style="font-weight: bold; font-size: 14px;">Thematic Tag (Tier 1)</label>
                    <select id="thematic_tag" name="thematic_tag" style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color);">
                        <option value="">-- Select a Thematic Tag --</option>
                        ${thematicOptions}
                    </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="genre_identity" style="font-weight: bold; font-size: 14px;">Genre Identity (Tier 2)</label>
                    <select id="genre_identity" name="genre_identity" style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color);">
                        <option value="">-- Select a Genre Identity --</option>
                        ${genreIdentityOptions}
                    </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="genre_trope" style="font-weight: bold; font-size: 14px;">Genre Trope (Tier 3)</label>
                    <select id="genre_trope" name="genre_trope" style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color);">
                        <option value="">-- Select a Genre Trope --</option>
                        ${genreTropeOptions}
                    </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label for="justification" style="font-weight: bold; font-size: 14px;">Justification / Evidence</label>
                    <textarea id="justification" name="justification" rows="4" placeholder="Cite a page number, quote, or narrative proof." style="padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-sans); background: #fff; color: var(--text-color); resize: vertical;"></textarea>
                </div>

                <button type="submit" class="search-submit" style="align-self: flex-start; padding: 0.75rem 2rem;">Submit Proposal</button>
            </form>

            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                <h3 style="margin-bottom: 1rem; font-size: 18px;">How are tags approved?</h3>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 1.5rem; line-height: 1.5;">
                    Once you submit a tag proposal, it enters our review queue. Members of the <strong>Librarian Council</strong> review proposals for accuracy, appropriate categorization, and sufficient justification. Approved tags are immediately added to the OpenedShelf taxonomy and linked to the corresponding book.
                </p>

                <h3 style="margin-bottom: 1rem; font-size: 18px;">How to become an approver</h3>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 0.5rem; line-height: 1.5;">
                    The <strong>Librarian Council</strong> is a community-driven group of trusted contributors. To become an approver, you can:
                </p>
                <ul style="font-size: 14px; opacity: 0.8; margin-bottom: 1.5rem; line-height: 1.5; padding-left: 1.5rem;">
                    <li style="margin-bottom: 0.25rem;">Consistently submit high-quality, well-justified tag proposals.</li>
                    <li style="margin-bottom: 0.25rem;">Actively participate in community discussions and taxonomy refinements.</li>
                    <li>Apply during our open recruitment periods or receive an invitation based on your contributions.</li>
                </ul>
            </div>
        </div>
    `;
    return renderLayout('Submit a Tag', content, 'propose');
}
