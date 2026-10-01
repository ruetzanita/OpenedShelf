# OpenedShelf: Secondary Data Ingestion Pipeline Spec

## Project Overview
This specification outlines the multiphase integration of open, secondary data sources (Wikidata, Project Gutenberg) to enrich the `short_synopsis` fields of the OpenedShelf database. The ultimate goal is to provide the raw conceptual text necessary for the regex engines in `tag_dump_trope.js` and `tag_dump_thematic.js` to accurately map Tier 1 and Tier 3 taxonomy tags.

**License Compliance:** As an AGPLv3 project, all secondary sources must be Public Domain (CC0) or open-source compatible. Academic-only datasets (e.g., UCSD Goodreads) are strictly prohibited.

---

## Architecture Strictures for Assigned Workers
All workers assigned to these phases **MUST** adhere to the backend architecture established in the May 2026 update:
1. **No N-Query Loops:** Never execute an `UPDATE` or `SELECT` inside a `for` loop over millions of rows. 
2. **Single-Pass Streaming:** Iterate the database using chunked streams (`SELECT rowid, id... WHERE rowid > ? ORDER BY rowid ASC LIMIT 100000`).
3. **Batched Transactions:** All writes must be buffered in memory arrays and executed inside `db.exec('BEGIN TRANSACTION;'); ... db.exec('COMMIT;');` blocks.
4. **Hardware Cooldowns:** Scripts must explicitly yield the Node.js event loop using `await new Promise(r => setTimeout(r, 5000))` every 500,000 processed rows to prevent thermal throttling.

---

## Phase 1: Data Acquisition & Pre-Processing
**Goal:** Retrieve open datasets and normalize them into an intermediate SQLite database mapping ISBNs/Titles to Descriptions.

*   **Task 1.1 (Library of Congress):** Download the official Library of Congress bulk MARCXML dataset (Books All). Extract MARC Field 520 (plot blurbs) alongside ISBN, Title, Author, and publication year metadata (from control field 008 or tags 260/264). 
*   **Task 1.3 (Normalization):** Create a standalone intermediate SQLite DB (`secondary_seed.db`). 
    *   Table: `Descriptions (isbn TEXT PRIMARY KEY, title TEXT, author TEXT, synopsis TEXT, publish_year INTEGER)`
    *   *Note:* Ensure the DB is configured with `PRAGMA journal_mode = WAL;`.

## Phase 2: Core Database Augmentation
**Goal:** Merge the enriched descriptions into the primary OpenedShelf database without overwriting existing valid OpenLibrary data.

*   **Task 2.1 (The Merge Script):** Create `build/v2/scripts/tag_dump_augment.js`.
*   **Task 2.2 (Execution Flow):** 
    *   Stream the `Works` table from the primary DB.
    *   Filter for rows where `short_synopsis` is either `NULL` or extremely short (e.g., < 50 characters).
    *   Look up the work in `secondary_seed.db` using ISBN. If ISBN is null, attempt a normalized Title + Author fuzzy match (using Javascript in-memory logic, not SQL `LIKE`).
    *   Buffer updates: `UPDATE Works SET short_synopsis = ? WHERE id = ?`.
    *   Execute batched transactions every 10,000 matches. Include hardware cooldowns.

## Phase 3: Taxonomy Re-evaluation
**Goal:** Run the enriched text through the `_trope` and `_thematic` regex engines.

*   **Task 3.1 (Trope Sweep):** Execute the newly refactored `tag_dump_trope.js`. The script's single-pass architecture will automatically ingest the newly populated `short_synopsis` fields and match them against the 3,700+ regex colloquialisms in `tags_trope_keywords.js`.
*   **Task 3.2 (Thematic Sweep):** Execute `tag_dump_thematic.js` to parse the new descriptions and cascade any newly granted tropes upward into thematic tags via the `THEME_TROPE_MAP`.
*   **Task 3.3 (Verification):** Validate that the ratio of tags granted vs. tags skipped has significantly improved from the baseline ~10% coverage.

## Phase 4: Surgical API Backfill (Google Books)
**Goal:** Fill the remaining gaps using commercial APIs while strictly respecting rate limits.

*   **Task 4.1 (Query Generation):** Stream the `Works` table to isolate highly accessed "Rabbit Hole" books (books frequently triggering 0-result searches) that *still* lack a `short_synopsis` after Phase 2.
*   **Task 4.2 (Throttled Execution):** Create a script to ping the Google Books API using ISBNs. **Crucially**, enforce a strict limit of requests per day to ensure the free-tier quota is never exceeded.
*   **Task 4.3 (Update):** Append the returned publisher summaries to the DB using the chunked transaction architecture.
