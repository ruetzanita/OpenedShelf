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

export function renderVerify(pendingTags = []) {
    const listHtml = pendingTags.length > 0 ? pendingTags.map(tag => `
        <div style="border: 1px solid var(--border-color); background: #fff; padding: 1rem; margin-bottom: 1rem; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Tag: <code>${tag.proposed_tag_name}</code></strong>
                <span style="font-size: 12px; opacity: 0.7;">Tier: ${tag.proposed_tier}</span>
            </div>
            <div style="font-size: 13px; margin-bottom: 0.5rem;">
                <strong>Book:</strong> ${tag.book_title || 'Unknown Title'} <br/>
                <strong>ISBN:</strong> <code>${tag.book_isbn || 'N/A'}</code>
            </div>
            <div style="font-size: 14px; font-style: italic; margin-bottom: 0.5rem; font-family: var(--font-serif);">
                "${tag.justification}"
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <form action="/api/verify/approve" method="POST" style="margin: 0;">
                    <input type="hidden" name="id" value="${tag.id}">
                    <button type="submit" class="remove-btn" style="border-color: #2e7d32; color: #2e7d32; font-weight: bold;">Approve</button>
                </form>
                <form action="/api/verify/reject" method="POST" style="margin: 0;">
                    <input type="hidden" name="id" value="${tag.id}">
                    <button type="submit" class="remove-btn" style="border-color: #d32f2f; color: #d32f2f; font-weight: bold;">Reject</button>
                </form>
            </div>
        </div>
    `).join('') : '<p>No pending tag proposals to verify.</p>';

    const content = `
        <div style="max-width: 600px; margin: 0 auto;">
            <h2>Librarian Verification Queue</h2>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 2rem;">
                Review community tag submissions. Approved tags will be added to the taxonomy and index.
            </p>
            ${listHtml}

            <hr style="margin-top: 3rem; margin-bottom: 2rem; border: 0; border-top: 1px solid var(--border-color);" />
            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); color: #333;">
                <h3 style="margin-top: 0;">The OpenShelf Library Council</h3>
                <p style="font-size: 14px; line-height: 1.5;">The Library Council is the community-driven curation body responsible for maintaining the quality and accuracy of OpenShelf's taxonomy. The Council acts as a specialized review board to evaluate, promote, and moderate user-submitted tags.</p>
                
                <h4 style="margin-bottom: 0.5rem;">How the Council Works</h4>
                <p style="font-size: 14px; line-height: 1.5;"><strong>Genre Expertise:</strong> Council members are assigned to specific genres based on their proven expertise to monitor user submissions and promote valuable, accurate genre-specific tags.</p>
                <p style="font-size: 14px; line-height: 1.5;"><strong>Tag Promotion:</strong> If a specific genre tag begins appearing consistently across 3 or more different genres, it becomes eligible to be promoted to a broader Thematic Tag.</p>
                
                <p style="font-size: 14px; margin-bottom: 0.5rem;"><strong>The Weekly Voting Cycle:</strong></p>
                <ol style="font-size: 14px; line-height: 1.5; margin-top: 0;">
                    <li><strong>Submission & Promotion:</strong> Users submit tag suggestions. Council members review and promote the best candidates.</li>
                    <li><strong>Voting:</strong> Once a week, promoted Thematic Tags are voted on by all Council members.</li>
                    <li><strong>Transparency & Vetoes:</strong> Results are publicly posted. Vetoed tags must include a written explanation.</li>
                    <li><strong>Backend Updates:</strong> Approved tags are compiled into a new tag dump to update the backend.</li>
                </ol>
                
                <h4 style="margin-bottom: 0.5rem;">Joining the Library Council</h4>
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 0;">To join during our initial launch phase, please submit an application via email including a brief introduction, your requested genre(s) of expertise, and evidence of your domain knowledge.</p>
            </div>
        </div>
    `;
    return renderLayout('Verification Queue', content, 'verify');
}
