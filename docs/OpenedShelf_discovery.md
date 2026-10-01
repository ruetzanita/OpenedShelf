# **OpenedShelf Discovery Engine: Technical Documentation — Outline**

# **1\. Project Mission**

* **Core Principles:** The project is built on three cascading principles: Open → Discovery → Rabbit Hole.  
* **In Practice:**  
  * **Open:** The codebase, taxonomy, and data are fully open, with no proprietary dependencies or collection of behavioral data. The taxonomy is governed by community members with genre literacy.  
  * **Discovery:** Driven by a three-layer objective taxonomy: standard literary genres (with sub-genre conventions), cross-genre thematic tags, and audience qualifiers. Thematic tags cross all genres (e.g., `isolated`) to surface diverse works (history, romance, philosophy, novel) simultaneously.  
  * **Rabbit Hole:** The precise Boolean engine will run out of results, showing the reader exactly where the search ended. This is the intended product, rewarding curiosity.  
* **Project Limitations:** The project is not a book hosting platform, a recommendation engine, a social reading tool, or a commercial product.

# **2\. Infrastructure & Edge Architecture**

* **Architecture:** Relies entirely on edge computing to achieve sub-millisecond global latency without heavy server provisioning.  
* **Components:**  
  * **Compute:** Cloudflare Workers handle routing, processing, interaction with upstream sources, and stripping heavy JSON payloads.  
  * **Catalog Storage:** Cloudflare R2 stores immutable, versioned SQLite catalog artifacts.
  * **Catalog Compute:** A read-only SQLite query service synchronizes the active R2 artifact locally and serves search requests to the Worker.
  * **Moderation Database:** Cloudflare D1 stores `Pending_Tags` and moderation state.
  * **Scaling Strategy:** Catalog storage and query compute scale independently; the Worker does not load the multi-gigabyte database.
* **Portability:** The Worker logic must avoid Cloudflare-specific APIs to ensure migration to a self-hosted alternative is possible within a weekend.

# 

# **3\. Data Aggregation (The Middleware "Bloat Stripper")**

* **Function:** The engine acts as a precise query filter and does not host raw book files or full bibliographic datasets on the edge.
* **Payload Reduction (Data Ingestion):** Data is aggregated offline via an ingestion pipeline (`scripts/load_library.js`). This Node.js script acts as a middleware to query open data sources (primarily Open Library's Subject API). It strips the responses down from megabytes to a minimalist JSON package (title, author, isbn, short_synopsis), automatically mapping arbitrary subjects to the strict OpenedShelf taxonomy.
* **Source Abstraction:** Upstream sources are strictly isolated to the offline data ingest pipeline. The pipeline builds a local SQLite database (`openedshelf_db_08_2026.sqlite` or a later version), publishes it as an immutable R2 object, and the query service executes the read-only search workload. The Worker never downloads or executes the catalog database.

# **4\. Data Model: The Three-Tier Taxonomy**

## **4.1 Tier 1: Thematic Tags (OpenedShelf's Objective Factual Properties)**

* **Nature:** Genre-agnostic tags describing verifiable, factual properties of a text. These are OpenedShelf's own system. They use no prefix.
  * **Categories:** Setting & Environment, Time & Era, Scale & Scope, Narrative Structure, Character & Dynamics, Conflict & Tension, Human Themes, Content & Tone, Factual Properties, Audience & Age.
  * **Examples:** `isolated`, `resource_scarcity`, `first_person_pov`, `unreliable_narrator`, `young_adult`.
  * **Validity Rules:** Must be verifiable by any careful reader, hold consistent meaning across genres, and be specific enough to be exclusive. Must not describe emotional response.

## **4.2 Tier 2: Genre Identity (Standard Literary Taxonomy)**

* **Nature:** Standard literary classification using the `genre:` prefix in the database. Organized into 13 broad categories containing 22 parent genres, each with shelving sub-genres.
  * **Function:** Determines what "shelf" a book lives on.
  * **Broad Category Examples:** Speculative Fiction → Science Fiction, Fantasy, Dystopian, Horror. 
  * **Structural Sub-genre Examples:** `genre:space_opera`, `genre:cozy_mystery`, `genre:hard_scifi`.
  * **Governance:** Governed by the core Librarian council using industry standards (BISAC/LCGFT).

## **4.3 Tier 3: Genre Tropes (Verifiable Narrative Devices)**

* **Nature:** Community-specific plot devices and tropes that describe what happens *inside* a genre's plot, rather than the shelf it sits on. Like Tier 2, these utilize the `genre:` prefix.
  * **Examples:** `genre:litrpg`, `genre:enemies_to_lovers`, `genre:locked_room`.
  * **Governance:** Governed by genre-specific Librarian communities.
  * **Promotion Pipeline:** If a trope reaches critical mass across 3+ distinct `genre_identity` parents, it triggers a council vote to be promoted to a Tier 1 `thematic` tag.

## **4.4 Tag Naming Conventions**

* Use lowercase with underscores (e.g., `off_grid_survival`).
  * Tier 2 and Tier 3 use the `genre:` prefix, while Tier 1 uses no prefix.
  * Be noun phrases describing text properties, not reader feelings.

## **4.5 Schema Design**

* Uses a standard many-to-many relationship via `Works` (metadata), `Tags` (stores tier/scope), and `Works_Tags` (junction) tables.

## 4.6 Boolean Discovery Engine

* Applies strict set theory to SQL queries for dynamic discovery. All three layers (genres, thematic tags, audience qualifiers) can be combined freely in Boolean search.
* **Filtering Logic:** Selecting multiple tags utilizes a strict set-intersection (**AND**) operation. This restricts search results to include only works that contain *all* of the selected tags (e.g., selecting `mental_health` and `heist` returns works matching `mental_health` AND `heist`). Detailed searches correctly narrow down the catalog and progressively trigger the "Rabbit Hole" collapse (0 results) when no works matching the full intersection are found.
* **Natural Language Parsing**: The engine bridges the gap between natural language and strict Boolean logic using `src/search_utils.js` (greedy multi-word token parsing) and `src/dictionary.js` (mapping subjective feeling keywords like "spicy" to objective tags like `explicit_sexual_content`).
* **Author Search**: The engine supports targeted author searches via the `author:` prefix (e.g., `author:smith`). Unlike standard taxonomy tags, author queries bypass greedy matching and map directly to flexible `LIKE` filters against the primary database metadata, avoiding the high-cardinality performance constraints of traditional UI tag menus.

# **5\. Community Boards**

* **Purpose:** Primary expression of cross-genre thematic tags, presenting matched works sorted into genre lanes (e.g., a board for `plague` with lanes for Historical Fiction, Romance, Philosophy, etc.).  
* **Action:** The board presents; the reader navigates. It does not recommend.  
* **Construction:** Boards are not algorithmically generated but are proposed, reviewed for sufficient cross-genre coverage, and published as a static query. Requires meaningful results in at least three genre lanes before publication.  
* **Shareability:** Every board is a plain, shareable URL with no authentication, personalization, or tracking.

# **6\. The Rabbit Hole: Zero-Result UX**

* **Philosophy:** A zero-result query is a discovery, meaning the tag combination does not yet exist in the corpus.  
* **UX Features:**  
  * **Intermediate Count Display:** When a query returns zero, the interface displays the result count at each step of tag addition, making the process feel like exploration.  
  * **Fuzzy Fallback ("One Step Back"):** Rather than presenting a dead end, the engine uses the step-by-step query breakdown to identify the last successful search query before results collapsed. It displays up to 5 alternative books from this "one step back" query, naturally surfacing alternative lower-tier tags and providing a new lane for exploration.
  * **Shareable Tag Stacks:** The tag stack is a plain URL query string that can be shared as a statement about what doesn't exist yet.

# **7\. Front-End Interface & UI/UX Principles**

## **7.1 Technology Stack**

* Plain HTML with minimal vanilla JS only.  
  * Server-rendered HTML (Workers return complete pages).  
  * Zero-bandwidth system font stack (no CDN-loaded web fonts).  
  * No analytics or telemetry libraries.  
  * Functional non-JS fallback via standard form submission and URL parameters (progressive enhancement).

## **7.2 Visual Design Principles**

* Visual hierarchy based on typography over assets.  
  * Organic CSS rendering (soft off-white backgrounds, subtle drop shadows).  
  * Graceful degradation: if cover art fails to load, the interface generates a CSS book spine from the title text.

# **8\. Licensing & Openness**

* **OpenedShelf Engine:** Released under the GNU Affero General Public License v3 (AGPL-3.0).  
* **Taxonomy Data:** Released separately under CC0 (public domain dedication).

# **9\. Open Questions (To Be Resolved Before Build)**

* ~~Define minimum viable thematic tag set for V0 (target: 5 themes).~~ **Resolved:** 133 thematic tags across 10 categories.
* ~~Define minimum viable genre convention tag set for V0 (target: 2–3 genres).~~ **Resolved:** 22 parent genres with 508 sub-genre conventions.
* ~~Document the upstream adapter interface specification.~~ **Resolved:** Handled offline by the 8-Stage Pipeline (`run_pipeline.sh`) to build and publish the optimized SQLite catalog database.
* Define community board publication criteria in full.
* Confirm Cloudflare free tier limits against projected V0 usage.
* Document self-hosted fallback deployment path.
* ~~Define tag contribution and wrangling process for community governance.~~ **Resolved:** See TGP §2 Verification Pipeline.

