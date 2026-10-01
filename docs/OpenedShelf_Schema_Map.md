# OpenedShelf Information Schema Map

This document outlines how the raw data from OpenLibrary (OL) is ingested, transformed, and stored within the local SQLite catalog database, then published to R2 for the read-only query service.

## Deployment Ownership

The `Works`, `Tags`, and `Works_Tags` tables are catalog data. They are published as an immutable SQLite artifact to Cloudflare R2 and queried by the separate read-only SQLite query service. `Pending_Tags` is moderation data and remains in Cloudflare D1. The Worker does not execute SQL against the R2 object and the schema itself is unchanged by the storage migration.

It is designed to give downstream agents (Identity, Tropes, Thematic) a clear understanding of exactly where OpenLibrary metadata lives in the final `Works` table, so they can write highly targeted SQL mapping rules.

## OpenLibrary -> OpenedShelf Mapping

### Kept and Moved (Direct Extractions)

| OpenLibrary Raw Field | Target Database Column | Description & Usage |
| :--- | :--- | :--- |
| `key` (`/works/OL123W`) | `Works.id` | The unique identifier for the book. Stripped of the `/works/` prefix. |
| `title` | `Works.title` | The core title of the book. |
| `authors[0].author.key` | `Works.author` | Pass 1 maps the author ID to `authors_map.db` to extract the human-readable string. If missing, it falls back to the `by_statement` in Pass 3. |
| `isbn_13` / `isbn_10` | `Works.isbn` | Extracted from the Edition records during Pass 3. Prefers ISBN-13 over ISBN-10. |
| `subjects` (array) | `Works.ol_subjects` | **NEW**: The entire user-generated subjects array is joined by commas. *This is the primary target for all `seed_mappings.js` categorical rules!* |
| `genres` (array) | `Works.ol_genres` | **NEW**: The formal genres array (when it exists) is joined by commas. An extremely clean target for strict Identity rules. |
| `description` | `Works.short_synopsis` | **NEW**: The block text plot blurb (up to 500 characters). *Use extreme caution when running `LIKE` queries against this column, as plot descriptions will trigger false-positive genre matches.* |
| `languages` (array) | `Works_Tags` (junction) | Language keys are prefixed with `lang:` and automatically inserted as tags. |
| - | `Works.publish_year` | **NEW**: The publication year. Sourced exclusively from Library of Congress (LOC) MARC datasets during Stage 2.5 augmentation. |

### Lost / Ignored Data
To keep the OpenedShelf database lean and focused purely on discovery, the following OpenLibrary data points are intentionally dropped during extraction:
* `covers` / `first_publish_date` / `latest_revision` (UI handles fetching covers live; publication year is selectively populated from LOC data instead)
* `notes` / `links` / `excerpts`
* Secondary authors (only the primary author is currently tracked)
* Publisher / Publish Country / Page Counts (Edition-specific physical metadata)
* Any subject tags past the 8th index? **(FIXED: We now keep ALL subjects!)**

## Downstream Agent Execution Rules

Because we have isolated categorical data (`ol_subjects`, `ol_genres`) from narrative data (`short_synopsis`), all downstream taxonomy scripts must adhere to the following logic to prevent false positives:


