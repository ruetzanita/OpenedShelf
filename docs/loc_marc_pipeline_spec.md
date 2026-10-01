# Library of Congress MARC 520 Extraction: Project Spec

## Project Overview
This specification outlines a new parallel pipeline to extract rich plot blurbs and descriptions directly from the Library of Congress (LOC). 

**The Problem:** OpenLibrary builds its database by parsing LOC MARC records, but it notoriously mangles or entirely drops **MARC Field 520** (the designated field for "Summary, Etc."). This leaves our `short_synopsis` column severely starved.
**The Solution:** We will bypass OpenLibrary's schema and download the LOC's bulk MARC datasets directly. We will stream these files, specifically hunting for Field 520, and merge those summaries into our `secondary_seed.db`.

---

## Architecture Strictures for Assigned Workers
You **MUST** adhere to the backend architecture established for the OpenedShelf project:
1. **Single-Pass Streaming:** You must use a streaming XML or MARC parser. Do not load entire datasets into RAM.
2. **Batched Transactions:** All writes must be buffered in memory arrays (e.g., 10,000 records) and executed inside `db.exec('BEGIN TRANSACTION;'); ... db.exec('COMMIT;');` blocks.
3. **Hardware Cooldowns:** Implement a hard pause (`await new Promise(r => setTimeout(r, 5000))`) every 50,000 processed entities to prevent thermal throttling and memory spikes.

---

## Phase 1: Data Acquisition
*   **Task 1.1:** Navigate to the Library of Congress [Data Labs / Bulk Downloads](https://data.labs.loc.gov/) or their MARC distribution services.
*   **Task 1.2:** Download the bulk Books datasets. (They are typically provided as massive MARC XML or binary `.mrc` files). 
*   **Note:** Do **not** attempt to use the LOC JSON API for this. The API restricts pagination to 100,000 items, making it impossible to scrape the millions of records we need. You must use the bulk static dumps.

## Phase 2: Streaming Ingestion Pipeline
*   **Task 2.1 (The Script):** Create `scripts/loc_marc_ingest.js`.
*   **Task 2.2 (Parsing Logic):**
    *   Set up a ReadStream for the downloaded file.
    *   Use a specialized streaming parser (e.g., `marc-record-js` for binary or `fast-xml-parser` for MARCXML).
    *   For every record, inspect the datafields.
*   Task 2.3 (Data Extraction):
    *   **ISBN:** Extract from **Field 020**, subfield `$a`.
    *   **Title:** Extract from **Field 245**, subfield `$a`.
    *   **Author:** Extract from **Field 100**, subfield `$a` (if available).
    *   **Summary (The Payload):** Extract from **Field 520**. Combine subfields `$a` (Brief Summary) and `$b` (Expansion of summary note) if both exist.
    *   **Publication Year:** Extract from **Control Field 008** (bytes 07-10) with a fallback to extracting a 4-digit year from tags **260** or **264** subfield `$c`.
*   Task 2.4 (Database Insertion):
    *   Filter out any records that do not possess a 520 field.
    *   Buffer the valid records and insert them into `db/secondary_seed.db` using the `Descriptions` table: `(isbn, title, author, synopsis, publish_year)`.
    *   Use `INSERT OR REPLACE` to handle potential duplicate ISBNs seamlessly.

## Phase 3: Verification
*   **Task 3.1:** Execute the script against a smaller subset of the LOC dump to ensure the parser correctly navigates the esoteric MARC 21 subfield arrays.
*   **Task 3.2:** Verify that the `synopsis` field in SQLite actually contains human-readable paragraph text, free from XML or MARC delimiter artifacts.
