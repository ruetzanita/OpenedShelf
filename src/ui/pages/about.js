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

export function renderAbout() {
    const content = `
        <div style="max-width: 700px; margin: 0 auto; font-family: var(--font-sans); font-size: 16px; line-height: 1.8;">
            <h1 style="text-align: center; margin-bottom: 2rem; font-family: var(--font-serif);">About OpenedShelf</h1>
            
            <div style="border-left: 3px solid var(--border-color); padding-left: 1.5rem; margin-bottom: 3rem; font-style: italic; font-size: 1.1rem; color: var(--text-color);">
                "OpenedShelf is built to serve the reader at the margins—whether that margin is defined by geography, digital infrastructure, or highly specific literary taste."
            </div>

            <section style="margin-bottom: 3rem;">
                <h2 style="font-family: var(--font-serif); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">The Manifesto</h2>
                <p>If we break down the core audience, the platform is designed to serve four distinct types of readers who are currently failed by mainstream tech monopolies:</p>
                
                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">1. The Infrastructure-Constrained Reader</h3>
                <p>This is the primary demographic for our "brutally efficient" edge architecture. This serves readers in rural areas, individuals relying on heavily metered cellular data, and those using older, second-hand devices. Mainstream platforms lock them out with forced app updates and heavy data loads; OpenedShelf serves them by treating low-bandwidth access as a baseline right, not a fallback feature.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">2. The Hyper-Specific Discoverer</h3>
                <p>Mainstream algorithms are built for broad, generic tastes. OpenedShelf serves the reader who needs surgical precision and gets frustrated when a search for a specific trope just returns the current top 100 bestsellers. This is the reader who wants to stack exact facts—whether they are tracking down a mafia romance with a specific protective dynamic, or trying to find narratives that accurately feature the construction of a walipini greenhouse. It serves the reader whose brain works in intersections.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">3. The Algorithmically Marginalized</h3>
                <p>When discovery is driven by sales and mass appeal, #OwnVoices titles, indie authors, and specific cultural narratives get buried. OpenedShelf serves readers who are exhausted by having to dig through mainstream noise to find accurate representations of their lived experiences. Because the platform maps objective facts rather than algorithmic popularity, it gives these readers a direct, unmediated path to the books that reflect them.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">4. The Data-Conscious Reader</h3>
                <p>Mainstream platforms view the reader as a product, tracking every click, pause, and purchase to feed a predictive advertising loop. OpenedShelf serves the reader who wants to be left alone. By utilizing an architecture that collects no behavioral data and requires no authentication to browse, it serves those who believe that the act of exploring a library should be a private, untracked experience.</p>
            </section>

            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 3rem 0;">

            <section style="margin-bottom: 3rem;">
                <h2 style="font-family: var(--font-serif); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">The Reader's Primer</h2>
                <p>Most book platforms try to guess what you want based on what millions of other people bought. They track your clicks and feed you into a loop of bestsellers. OpenedShelf doesn't guess, and we don't track you. We just map the facts.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">Move with Your Interests, Don't Get Stuck in a Stack</h3>
                <p>Goodreads is fine, but you often just get "vibes" and not the next great read with the exact same feel. Play Books works, but when you finish a <code>genre:biography_memoir</code> tagged with <code>wartime</code>, you can't seamlessly pivot to <code>genre:cookbooks</code> and <code>genre:home_cooking</code> to try the specific recipes they mentioned, or tumble into <code>genre:science_fiction</code> with <code>alternate_history</code> and <code>resistance_movement</code> to indulge in a scenario where the Axis won and a new rebellion is rising.</p>
                <p>OpenedShelf encourages lateral movement. The "Fuzzy Fall" doesn't let the discovery end. You can start in history, pivot into a cookbook based on a historical footnote, and tumble right into a sci-fi thriller that matches the exact emotional tone of the memoir you just finished.</p>
                
                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">How to Explore</h3>
                <p>Think of OpenedShelf like a highly organized, physical archive. Instead of typing "give me a good winter thriller," you build your search by stacking facts.</p>
                <ol style="margin-left: 1.5rem; padding-left: 0;">
                    <li><strong>Start Broad:</strong> Type what you're looking for (e.g., "time travel" or "spicy") to get smart tag suggestions, or pick a genre shelf like <code>genre:mystery</code>.</li>
                    <li><strong>Stack the Facts:</strong> Add elements you specifically want to see. Add thematic tags like <code>isolated</code> + <code>unreliable_narrator</code>.</li>
                    <li><strong>Dig Deeper:</strong> Pick the path in your genre identity that speaks to you.</li>
                    <li><strong>Narrow it Down:</strong> Add verifiable plot devices (tropes) like <code>locked_room_puzzle</code>.</li>
                    <li><strong>Get Specific:</strong> You can also tell us what you <em>don't</em> want. Exclude <code>violent_content</code> to keep it gentle.</li>
                </ol>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">And More</h3>
                <ol style="margin-left: 1.5rem; padding-left: 0;">
                    <li><strong>Filter by Language:</strong> To restrict results to a specific language, use the <code>lang:</code> prefix followed by its 3-letter code (e.g. <code>lang:spa</code> for Spanish).</li>
                    <li><strong>Find an Author:</strong> If you are looking for a specific writer, use the <code>author:</code> prefix (e.g. <code>author:smith</code> or <code>author:tolkien</code>).</li>
                    <li><strong>Filter by Publication Year:</strong> Filter by a year or date range using the <code>year:</code> prefix (e.g. <code>year:1984</code> or <code>year:2010-2020</code>). <em>(Note: This data is sourced from Library of Congress metadata and may not be available for all books.)</em></li>
                </ol>

                <p><strong>Why stack genres, identities, and tropes?</strong></p>
                <ul>
                    <li>Sub-genres like <code>genre:mystery</code> tell the engine which major shelf the book lives on.</li>
                    <li>Tropes like <code>locked_room_puzzle</code> tell the engine what actually happens inside the book.</li>
                    <li>Thematic tags like <code>isolated</code> define the setting and tone.</li>
                </ul>
                <p>This stack allows you to be incredibly precise!</p>
                <p>The system will only show you books that match your exact factual recipe.</p>

                <p>💡 <strong>Pro Tip:</strong> Our engine is smart enough to auto-map standard tags. You don't need to type <code>genre:mystery</code>. Just type <code>mystery</code> and the engine will instantly recognize and format the facts.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">The Rabbit Hole (When You Run Out of Books)</h3>
                <p>Because our engine is mathematically precise, you will eventually stack a combination of tags that results in zero books. <strong>This is not an error.</strong></p>
                <p>When the screen says, <em>"We couldn't quite find that one on the shelf,"</em> it means you've successfully discovered a gap in the literary map. You've imagined a highly specific combination of tropes and facts that the community hasn't logged yet—or maybe that hasn't been written yet. When you hit the end of the Rabbit Hole, copy the URL. Share it. Let the community know what's missing.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">Saving Your Shelf (The Private Way)</h3>
                <p>If you find books you want to save for later, you can add them to "My Shelf".</p>
                <p><strong>Absolute Privacy:</strong> Your shelf is saved directly to your browser's local storage. We do not track what you save, we do not require you to make an account, and we do not ask for your email address.</p>
                <p><strong>Cross-Device Sync:</strong> If you want to access your shelf on another device, use the "Cloud Sync" feature on the My Shelf page.</p>
                <ol style="margin-left: 1.5rem; padding-left: 0;">
                    <li>Click <strong>Generate a new phrase</strong>. You will receive a random 3-word phrase (e.g. <code>copper-owl-reading</code>).</li>
                    <li>Go to your other device, visit My Shelf, and type in that phrase to load your books.</li>
                </ol>
                <p><strong>Warning:</strong> Treat your phrase like a crypto key. Because we don't know who you are, there is no "Forgot My Password" button. If you lose the phrase, we cannot recover the sync connection. Unused sync phrases are automatically purged from our servers after 60 days of inactivity to keep our infrastructure clean and your data private.</p>
            </section>

            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 3rem 0;">

            <section style="margin-bottom: 3rem;">
                <h2 style="font-family: var(--font-serif); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Data Transparency & Update Schedule</h2>
                <p>Because OpenedShelf is community-curated, we believe in radical transparency regarding when and how our database is updated. To ensure stability and quality control, we operate on a predictable schedule:</p>
                
                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">Weekly Taxonomy Updates</h3>
                <p>Every week, the <strong>Library Council</strong> reviews and votes on newly submitted tags. At the end of the voting cycle, all approved tags are compiled into a new tag dump, and the backend taxonomy is updated to reflect the community's latest curations.</p>

                <h3 style="font-family: var(--font-serif); margin-top: 1.5rem;">Monthly Full Platform Updates</h3>
                <p>While tags are updated weekly, major additions to the book catalog, core algorithm tweaks, and new platform features are rolled out on a monthly basis. This allows us to maintain our brutally efficient architecture without disrupting the daily discovery experience.</p>
            </section>
        </div>
    `;
    return renderLayout('About OpenedShelf', content, 'about');
}
