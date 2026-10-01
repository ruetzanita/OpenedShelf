# OpenedShelf: OpenLibrary Data Update Standard Operating Procedure (SOP)

This document provides explicit, step-by-step instructions for safely processing the monthly Open Library data dump. Because the data dump is massive (~17GB text, 30M+ records), this process utilizes the offline extraction and 4-pass tagging architecture to prevent memory crashes and server timeouts.

> [!WARNING]
> **Hardware Warning:** Do not disable the hardcoded `setTimeout` cooldowns in `tag_dump_*file*.js`. They are explicitly designed to prevent your computer from overheating and decoupling hardware during these massive operations.

> [!NOTE]
> **Working Directory:** All terminal commands in this document assume you are running them from the **project root directory** (e.g., `~/Documents/Playground/OpenShelf`), *not* from inside the `build/v2` folder.

---

## Pipeline Architecture & Logic Breakdown

Before running the update, it's important to understand *why* the pipeline is split into distinct stages.

Open Library's text dump separates "Works" (the abstract book concept) from "Editions" (the physical publication with ISBNs and Authors). If we tried to apply complex tag mappings in a single pass while streaming the text file, we wouldn't know the Author or Title of a book when we were looking at its Synopsis. Furthermore, running thousands of regex queries against 17GB of text in a single Node process would cause V8 memory exhaustion and severe hardware overheating.

> [!WARNING]
> **Community Data Preservation:** With the introduction of the Book Tag Submission Feature, the production database now contains user-generated `Pending_Tags`. You MUST back up this table before executing a new data dump to production, otherwise all community proposals will be lost.

Therefore, we use a deferred, hardware-safe **8-Stage Architecture**, fully orchestrated by `run_pipeline.sh`:

1. **Extraction (`tag_dump_meta.js`)**: Streams the 17GB compressed text file natively via a 3-pass architecture. It builds a persistent `authors_map.db` from `/type/author` records, extracts valid Works (splitting OpenLibrary data cleanly into `ol_subjects`, `ol_genres`, and `short_synopsis` columns to prevent categorical cross-contamination) along with their actual mapped authors into a raw SQL seed file (`dump_seed.sql`), and finally parses Editions as a fallback for missing authors and ISBNs.

2. **Database Assembly (`tag_dump_assembly.mjs`)**: The orchestrator initializes the schema, streams the raw SQL seed file (`dump_seed.sql`) with progress logging and hardware safety pauses, and populates the base taxonomy structures in the Tags table.

3. **Database Augmentation (`tag_dump_augment.js`)**: If a secondary data source (like the Library of Congress MARC field 520 dump) is available as `secondary_seed.db`, this merges its high-quality plot synopses and publication years directly into the primary database to enrich the parsing and filtering engine.

4. **Explicit Genre Identity & Fallback (`tag_dump_identity.js`)**: Executes explicit SQL mapping rules (`seed_mappings.js`) to accurately grant standard genres based on title/author substrings, followed by a high-speed regex pass using `tags_identity_keywords.js` against the `ol_subjects` and `ol_genres` arrays to capture colloquial folksonomy.

5. **Explicit Genre Tropes (`tag_dump_trope.js`)**: Executes explicit SQL mapping rules using formal Library of Congress vocabulary and reader slang, combined with a `Set` intersection pre-filter to safely assign granular tropes and auto-grant parent tags.

6. **Data Cleaning & Orphan Purge (`tag_dump_clean.js`)**: Trims whitespace, deduplicates ISBNs, and performs a crucial `DELETE` sweep to purge millions of orphaned books (0 non-language tags + 0 metadata) *before* the expensive regex phase.

7. **Dynamic Thematic Fallback (`tag_dump_thematic.js`)**: A final chunked regex mapping pass (100k records at a time) to catch thematic keywords within the synopses, subjects, and genres of the remaining works using the `THEMATIC_KEYWORDS` dictionary and cascading tropes via `THEME_TROPE_MAP`.

8. **Tag Count Pre-computation (`tag_dump_counts.mjs`)**: Calculates the total number of books assigned to each tag and saves it statically in the database, preventing the edge worker from executing slow `GROUP_CONCAT` math on every user visit.

---

## Phase 1: Download and Execution

1. **Download the OpenLibrary Dump**
   Place the downloaded dump in the `Raw_Data/` directory (e.g. `Raw_Data/ol_dump_latest.txt.gz` or `Raw_Data/ol_dump_YYYY-MM-DD.txt.gz`). The pipeline will automatically detect the latest dump file located in `Raw_Data/`.

2. **Prepare Secondary Data (Optional but Recommended)**
   Navigate to the [Library of Congress BIBFRAME Download page](https://id.loc.gov/download/) and download the "BIBFRAME Hubs" **JSONLD** dataset (`.jsonld.gz`). Place it into the `Raw_Data/` directory.
   Ensure you have run `node build/v2/scripts/loc_marc_ingest.js` to parse this JSON-LD and create the `secondary_seed.db` in the `db/` directory. The pipeline will automatically detect it and enrich the data.
   > [!NOTE]
   > **Pipeline Optimization Note (For Next Dump):** Before running the next LOC ingestion, optimize `loc_marc_ingest.js` / `tag_dump_augment.js` title string normalization (strip cataloging subtitles and slashes) to improve the match yield beyond ~2%, and filter out sparse unmatched LOC records prior to database insertion to minimize downstream orphan purge overhead.


3. **Run the Automated Pipeline**
   The entire data update process has been automated into a single 8-stage pipeline script that extracts data, initializes the database, augments synopses, populates mappings, cleans the data, runs regex parsing, and pre-computes tag frequencies, with built-in 5-minute hardware cooldowns between major phases.
   ```bash
   build/v2/scripts/run_pipeline.sh
   ```
   *Time Estimate: ~8 hours. The script chunks through ~20 million records, runs thousands of regexes, and triggers explicit cooldowns to protect your hardware. It is highly recommended to let this run overnight.*

3. **Final Cleanup Check**
   The pipeline automatically runs a final `DELETE` sweep during the "clean" phase to purge any books that survived with 0 tags and 0 metadata. Ensure the console logs report successful completion and dropped orphans before proceeding to deployment.

4. **Running Individual Scripts**
   While the `run_pipeline.sh` script automates the entire process, you can also run any of the individual pipeline scripts separately. This is useful if a specific stage fails, or if you only need to re-run a specific pass (e.g., re-running `tag_dump_identity.js` after updating genre rules) without extracting the entire 17GB dump again. Ensure you are in the project root directory when running these individual scripts.
   ```bash
   node build/v2/scripts/tag_dump_identity.js
   ```

---

## R2 Search Database Publication

The production catalog database is approximately 24 GB and contains about 41 million Works and 197 million Works_Tags rows. R2 stores this SQLite file as a versioned object; R2 does not execute SQL. A separate read-only SQLite query service must download or synchronize the published object locally and expose the `/search` and `/tag-counts` endpoints used when the Worker has `SEARCH_API_URL` configured.

Publish the supplied database with:

```bash
build/v2/scripts/publish_r2_database.sh openedshelf-search-database db/openedshelf_db_08_2026.sqlite
```

The script uploads an immutable `catalog/<version>/` prefix containing `database.sqlite` and `manifest.json`. Verify the object size, checksum, SQLite integrity, required indexes, and query-service parity before changing `SEARCH_API_URL` or promoting a new active version. Retain the prior prefix until rollback testing is complete. The Worker continues to use D1 for `Pending_Tags` and moderation; this publication does not change UI rendering or search syntax.

Your versioned SQLite catalog database is now a perfectly tagged, 100% complete representation of Open Library.

The R2 publication is the catalog deployment. The separate D1 deployment below is retained only for moderation data or transitional catalog deployments.

To safely push this massive database up to Cloudflare D1 without exceeding D1's 10 GB limit or hitting HTTP payload size caps, run the standalone deployment script:

```bash
build/v2/scripts/deploy_d1.sh [d1_database_binding]
```

### What the Standalone Deployment Script Handles Automatically:
1. **Preserves Community Proposals**: Backs up live `Pending_Tags` from production to `build/v2/pending_tags_backup.json`.
2. **Optimizes Schema for D1**: Executes `prepare_deploy_db.js` to create `openedshelf_d1_prod.sqlite` and nullify raw offline staging columns (`ol_subjects` and `ol_genres`). This saves ~8–10 GB while keeping 100% of books, synopses, and tag mappings intact.
3. **Generates Wrangler-Optimized SQL Chunks**: Executes `chunk_master_db.js` to partition the database into 15 MB `.sql` files wrapped in 10,000-row `BEGIN TRANSACTION; ... COMMIT;` blocks for maximum upload throughput.
4. **Executes Bulk Wrangler Uploads**: Uploads each chunk sequentially to Cloudflare D1 via `npx wrangler d1 execute` with built-in retry logic and exponential backoff.
5. **Restores Community Proposals**: Re-imports user-submitted `Pending_Tags` into the live production database.

