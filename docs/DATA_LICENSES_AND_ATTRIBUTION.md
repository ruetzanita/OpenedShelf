# OpenedShelf: Raw Data Licenses, Attribution & Compliance Guide

This document establishes the official data licensing compliance framework, provenance records, attribution statements, and ingestion policies for all raw data consumed and published by **OpenedShelf**.

---

## 1. Core Licensing Architecture & Compatibility

OpenedShelf operates under a two-layer open licensing model:
1. **Application Engine & Scripts**: Licensed under the **GNU Affero General Public License v3 (AGPL-3.0)** (see [LICENSE.md](LICENSE.md)).
2. **Taxonomy, Mappings & Derived Tag Databases**: Dedicated to the public domain under **Creative Commons Zero v1.0 Universal (CC0 1.0)**.

To maintain complete legal compliance with copyleft AGPLv3 provisions and Open Data standards:
* **All ingested raw data must be Public Domain, CC0, or under open-source/open-data compatible licenses.**
* **Datasets with Non-Commercial (NC) or Academic-Use-Only clauses (such as the UCSD Goodreads dataset) are strictly prohibited from the pipeline.**

---

## 2. Ingested Raw Data Sources & Provenance

The table below outlines all primary and secondary raw data sources utilized within the offline data pipeline (`Raw_Data/`, `scripts/`, `build/v2/`):

| Data Source | Raw Artifact / Identifier | Origin & Custodian | License / Legal Status | Attribution & Usage Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Open Library** | `Raw_Data/ol_dump_*.txt.gz` | Internet Archive (501(c)(3) non-profit) | **CC0 1.0 Universal Public Domain Dedication** | Attribution recommended; catalog data fully open for redistribution. |
| **Library of Congress (LOC MARC 21 / MARCXML)** | `Raw_Data/master-gdc-gdcdatasets-*`<br>`Books.All.*.utf8.gz`<br>`Books.All.*.xml.gz` | U.S. Library of Congress (General Collections / Data Labs) | **U.S. Government Work / Public Domain Worldwide** (17 U.S.C. § 105) | Attribution to Library of Congress bibliographic datasets. |
| **Library of Congress (BIBFRAME Hubs)** | `Raw_Data/hubs.bibframe.jsonld.gz` | U.S. Library of Congress (Linked Data Service / id.loc.gov) | **CC0 1.0 Universal / Public Domain** | Attribution to Library of Congress BIBFRAME project. |
| **Wikidata** | API / JSON Entity Dumps | Wikimedia Foundation & Wikidata Community | **CC0 1.0 Universal Public Domain Dedication** | Attribution to Wikidata contributors. |
| **Project Gutenberg (Catalog Metadata)** | `Raw_Data/rdf-files.tar.zip` | Project Gutenberg Literary Archive Foundation | **Public Domain (Metadata / RDF Catalog)** | Metadata in public domain. Project Gutenberg trademark restrictions respected. |
| **Google Books API (Surgical Backfill)** | On-demand REST queries via ISBN (Stage 4) | Google LLC | **Google APIs Terms of Service** | Strictly rate-limited; summaries attributed to Google Books / publishers. |

---

## 3. Official Attribution & Crediting Statements

### 3.1 Global Site & Footer Notice
In accordance with open bibliographic traditions and partner terms, the following attribution text is deployed across the user-facing web interface, documentation, and API metadata:

> **Bibliographic & Catalog Data Credits:**
> * Catalog records, editions, and author mappings are sourced from [Open Library](https://openlibrary.org/), an initiative of the [Internet Archive](https://archive.org/), released under the **CC0 1.0 Universal Public Domain Dedication**.
> * Bibliographic metadata, summaries (MARC Field 520), and BIBFRAME Hubs data are provided courtesy of the [Library of Congress](https://data.labs.loc.gov/) and reside in the **Public Domain**.
> * Structured conceptual entities and cross-language descriptions are provided via [Wikidata](https://www.wikidata.org/), dedicated under **CC0 1.0**.
> * Historical catalog metadata is derived from the [Project Gutenberg](https://www.gutenberg.org/) catalog archive. *Project Gutenberg is a registered trademark of the Project Gutenberg Literary Archive Foundation and does not endorse or promote OpenedShelf.*

### 3.2 Machine-Readable API & Export Metadata
When distributing compiled SQLite catalog dumps or serving JSON search endpoints (`/api/search`, `/api/tag-counts`), the system exposes standard attribution fields:

```json
{
  "credits": {
    "engine_license": "AGPL-3.0-or-later",
    "taxonomy_license": "CC0-1.0",
    "sources": [
      {
        "name": "Open Library",
        "url": "https://openlibrary.org",
        "license": "CC0-1.0"
      },
      {
        "name": "Library of Congress",
        "url": "https://loc.gov",
        "license": "Public Domain (17 U.S.C. § 105)"
      },
      {
        "name": "Wikidata",
        "url": "https://wikidata.org",
        "license": "CC0-1.0"
      },
      {
        "name": "Project Gutenberg",
        "url": "https://gutenberg.org",
        "license": "Public Domain Metadata"
      }
    ]
  }
}
```

---

## 4. Strict Compliance & Intake Protocols

To protect OpenedShelf's copyleft integrity and prevent contamination from non-compliant datasets:

1. **No Academic-Only or Non-Commercial Datasets:**
   - Any dataset containing `NC` (Non-Commercial) licenses or university research-only agreements (e.g., UCSD Goodreads, Kaggle scraped sets with restrictive TOUs) is strictly banned from ingestion.
2. **No Unauthorized Web Scraping:**
   - Proprietary consumer platforms (Amazon, Goodreads, StoryGraph) must never be scraped for reviews, user lists, or synopses.
3. **API Rate Limit Strictures:**
   - Any auxiliary API backfill (such as Google Books API or ISBNdb) must operate within published developer quotas, implement exponential backoff, and provide appropriate source attribution.
4. **Offline Clean Room Verification:**
   - All raw data dumps placed in `Raw_Data/` must be verified against their upstream cryptographic checksums and provenance URLs prior to running `build/v2/scripts/run_pipeline.sh`.
