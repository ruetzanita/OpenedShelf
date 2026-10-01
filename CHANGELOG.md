# OpenedShelf Changelog

## Formatting Standards for Future Entries

To maintain consistency, auditable clarity, and strict repository security across all public changelog entries, please adhere to the following standards:

```markdown
### Month Day, Year

* **[Category] Feature/Fix Title**:
  * *Change*: Concise, technical summary of the code or architecture modifications.
  * *Rationale*: The engineering reasoning, bug resolved, or optimization goals.
  * *Files Created*:
    - [file_basename](path/to/file)
  * *Files Retired*:
    - [file_basename](path/to/file)
  * *Files Changed*:
    - [file_basename](path/to/file)
```

### Best Practices & Sanitization Rules for Git Entries:
1. **Repository-Relative Paths Only**:
   - Always link files using relative paths from the workspace root (e.g., `[layout.js](src/ui/layout.js)`).
   - **Never** use absolute filesystem URLs (e.g., `file:///home/username/...`) or local machine paths.
2. **Security & Sanitization**:
   - **IP Addresses**: Do not commit public or private IP addresses. Use generic placeholders like `[PRODUCTION_VPS_IP]` or `[SERVER_IP]`.
   - **Credentials & Keys**: Never commit SSH keys, passwords, API tokens, internal hostnames, or administrative user accounts (`root@...`).
   - **Untracked / Private Files**: Never reference gitignored developer scratchpads, local keys, or private files (e.g., `Notes for Next time`, `local/*`, `.env`). Refer to operational runbooks generically.
3. **Standard Change Categories**:
   - Prefix entry titles with standard categorization tags: `[Feature]`, `[Fix]`, `[Performance]`, `[Security]`, `[Refactor]`, `[Infrastructure]`, or `[Docs]`.
4. **Empty Categories**:
   - Explicitly list `None` if no files were created, retired, or changed for that category.

---

## Project Structure Standards
For all workers/developers: The root directory is strictly reserved for core configuration (`package.json`, `wrangler.jsonc`), the `LICENSE.md`, `OpenedShelf_changelog.md` / `CHANGELOG.md`, and core documentation. Personal scratchpads and sensitive keys belong strictly in gitignored directories (`local/`). **All other files must be placed in their appropriate subdirectories:**
- `src/` for all active Cloudflare Worker application code and UI modules.
- `docs/` for all documentation and markdown specs.
- `db/` for SQLite database schemas and scripts (`.sql` files).
- `scripts/` for data processing, build, and pipeline scripts.
- `tests/` for automated testing scripts.
- `public/` for static assets and public icons.
- `archive/` for retired legacy scripts.

---

> [!IMPORTANT]
> ### NOTICE FOR ALL AGENTS & DEVELOPERS: CANONICAL UI LOCATION FOR CLOUDFLARE DEPLOYMENT
> **All active, authentic frontend UI templates and presentation components are located in `src/ui/`:**
> - [src/ui/layout.js](src/ui/layout.js): Global layout shell, header, footer, book card renderer with synopsis accordion and Open Library external link, and Rabbit Hole zero-state screen with Fuzzy Fallback section.
> - [src/ui/styles.js](src/ui/styles.js): Master CSS design system and responsive tokens.
> - [src/ui/pages/home.js](src/ui/pages/home.js): Primary Discover catalog page with full-width centered hero (`/rabbit_reading.png`), smart tag input, Boolean tag pills, dynamic language filtering (`LANGUAGE_TAGS`), and collapsible "Refine by Subgenre" sidebar.
> - [src/ui/pages/about.js](src/ui/pages/about.js): OpenedShelf Manifesto, lateral interest exploration, reader primer, and transparency schedule.
> - [src/ui/pages/myshelf.js](src/ui/pages/myshelf.js): Private shelf saving, JSON library card export, and anonymous 3-word cloud sync (`/rabbit_surrounded.png`).
> - [src/ui/pages/propose.js](src/ui/pages/propose.js): Community tag proposal form with Librarian Council guidance (`/rabbit_scribbling.png`).
> - [src/ui/pages/verify.js](src/ui/pages/verify.js): Moderation review queue and Library Council manifesto.
> 
> **CRITICAL DIRECTIVE**: Under NO circumstances should any agent replace `src/worker.js` or `src/ui/` with holding pages, placeholder templates, or legacy code from historical Wrangler dev bundles. The files in `src/ui/` represent the validated, authentic production release of OpenedShelf for Cloudflare Worker deployment.

---

# 🚀 WE ARE LIVE!!!

## Recent Updates (October 2026)

### October 1, 2026

* **Production Dedicated VPS & Cloudflare Tunnel Live Deployment**:
  * *Change*:
    1. Provisioned Hetzner Cloud CPX22 instance (`[PRODUCTION_VPS_IP]`, Ubuntu 26.04 LTS, 4 GB RAM, 80 GB NVMe) in Falkenstein, Germany. Hardened system network security with `ufw` blocking all inbound traffic except OpenSSH on port 22.
    2. Streamed the 25.02 GB SQLite catalog (`catalog/08_2026/database.sqlite`) directly from Cloudflare R2 to `/var/data/openedshelf/openedshelf_master.sqlite` over high-speed backbone in ~5 minutes at 80 MB/s. Verified master row counts: 41,726,235 Works, 984 Tags, and 1,228,516 Thriller works.
    3. Deployed the native Node.js 22 read-only query service as a hardened systemd unit (`openedshelf-query.service`) configured with memory management (1024 MB mmap, 32 MB cache, pool size 2).
    4. Re-architected multi-tag query evaluation in `src/engine.js`: replaced the expensive Cartesian `GROUP BY w.id HAVING COUNT(...)` query with indexed chained joins (`JOIN Works_Tags wt_n ... WHERE w.id = wt0.work_id`), reducing multi-tag intersection time on 155M rows from 10+ second timeouts down to <100ms.
    5. Configured and launched Cloudflare Tunnel (`cloudflared`) on the VPS, publishing `search.openedshelf.org` over QUIC with zero inbound firewall ports and automated TLS termination at Cloudflare edge.
    6. Updated `wrangler.jsonc` with `"SEARCH_API_URL": "https://search.openedshelf.org"` and deployed production Worker to `www.openedshelf.org` and `openedshelf.org`.
    7. Validated end-to-end production search: `https://www.openedshelf.org/?q=genre:thriller` and multi-tag intersections (`genre:romance genre:historical`) actively return 50 book cards per page.
    8. Generated secure console credentials and verified end-to-end SSH key authentication into production search host. Documented all server access and monthly update procedures in operational runbooks.
  * *Rationale*: Permanently eliminates all developer laptop dependencies for production search, unlocks full-catalog 41.7M book search capabilities at sub-second edge latency without data pruning, and prepares Cloudflare R2 bucket for safe decommissioning.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [wrangler.jsonc](wrangler.jsonc)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)
    - Operational Runbooks

### September 30, 2026

* **Rarity-Based Query Engine Restoration & Edge Search Architecture Audit**:
  * *Change*:
    1. Restored the missing June 5, 2026 Rarity-Based Search Query Optimization in `src/engine.js`. The query generator now checks `tagCounts` and sorts `uniqueInclude` tags by frequency (rarest tag first) before building SQL statements, ensuring index lookups execute against the smallest B-tree partition first and eliminating full table scans.
    2. Conducted a complete end-to-end diagnostic of the initial production deployment (`www.openedshelf.org/?q=genre:thriller` returning 0 books). Identified that `src/worker.js` defaults `SEARCH_API_URL` to unroutable loopback `http://127.0.0.1:8788`, because the previously introduced `query-service` was running locally rather than on a dedicated edge/cloud host.
    3. Audited remote Cloudflare infrastructure state: verified remote R2 bucket `openedshelf-search-database` contains the 25.02 GB artifact `catalog/08_2026/database.sqlite` (and `manifest.json`), while remote D1 `openedshelf_master` contains 0 catalog tables (only internal `_cf_KV`).
    4. Verified exact catalog row counts on `db/openedshelf_db_08_2026.sqlite` (41,726,235 Works, 155,438,642 Works_Tags, and 984 Tags; `genre:thriller` matches 1,228,516 books).
    5. Ran full test suite (`npm test`), verifying all pre-flight integrity, query service resilience, and edge worker tests pass.
    6. Evaluated cloud deployment strategies to permanently remove local developer machine dependencies: documented Docker vs. Cloudflare Tunnel integration, resolved Hetzner VPS stock availability (switching from NBG1/HEL1 to Falkenstein FSN1), outlined R2 decommissioning to save recurring storage costs, and drafted the complete decision guide in architecture runbooks.
  * *Rationale*: Re-anchors sub-millisecond query evaluation at the engine level, documents the operational disconnect between edge Workers and the catalog database, and prepares the architecture for autonomous cloud deployment without local machine dependencies.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)
    - Operational Runbooks

* **Wrangler Deployment Configuration & npm Scripts Standardization**:
  * *Change*:
    1. Resolved Cloudflare Wrangler schema error in `wrangler.jsonc` by replacing the obsolete `"binding"` property in the `ratelimits` block with `"name"` (`"name": "RATE_LIMIT_SEARCH"`, `"name": "RATE_LIMIT_SUBMIT"`).
    2. Symlinked the local Wrangler CLI into `node_modules/.bin/wrangler` for seamless execution.
    3. Expanded `package.json` scripts with `"dev"`, `"start"`, `"deploy"`, and `"deploy:dry-run"` (`wrangler deploy --dry-run`).
    4. Executed and verified `npm run deploy:dry-run`, ensuring all 8 static assets in `public/`, routes for `openedshelf.org` and `www.openedshelf.org`, D1 database (`openedshelf_master`), R2 bucket (`openedshelf-search-database`), and rate-limiting bindings package cleanly without errors.
  * *Rationale*: Guarantees error-free execution of `wrangler deploy` to `www.openedshelf.org` and aligns repository build scripts with standard Node.js and Cloudflare Workers deployment workflows.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [wrangler.jsonc](wrangler.jsonc)
    - [package.json](package.json)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

* **Restoration of Authentic Modular UI & Image Layout Stabilization**:
  * *Change*:
    1. Restored the full, authentic May 24/25 modular UI architecture across `src/ui/layout.js`, `src/ui/styles.js`, `src/ui/pages/home.js`, `src/ui/pages/about.js`, `src/ui/pages/myshelf.js`, `src/ui/pages/propose.js`, and `src/ui/pages/verify.js`.
    2. Fixed hero placement in `home.js` by placing the welcome banner full-width across the top (`max-width: 800px; text-align: center;`) with intrinsic `1024x1024` dimensions for `/rabbit_reading.png` (styled `150px; opacity: 0.8;`), resolving Cumulative Layout Shift and sidebar misalignment.
    3. Restored the "Fuzzy Fall: One Step Back" discovery layer in `src/worker.js` and `src/ui/layout.js`, rendering `/fuzzy_fall_quizzical.png` and up to 5 alternative matching titles when a search runs out of results.
    4. Added the dynamic language filter dropdown in `src/ui/pages/home.js` backed by `src/tags_language.js` ISO-639 mapping.
    5. Implemented anonymous 3-word cloud sync (`/api/shelf/sync`, `/api/shelf/load`) with fallback KV persistence, and added the "Download Library Card" JSON export feature in `src/ui/pages/myshelf.js`.
    6. Updated `src/utils/url.js` to properly import `parseSearchTokens`, eliminating runtime reference errors during tag toggling.
    7. Optimized `buildDiscoveryQuery` and `buildCountQuery` in `src/engine.js` by introducing a `LIMIT 1000` ceiling and eliminating redundant column joins/`GROUP_CONCAT` on count queries, cutting aggregation time on large category filters over the 25 GB database from seconds to milliseconds.
    8. Hardened `scripts/dev_server.mjs` to auto-provision D1 moderation databases, mock KV stores for cloud shelf sync, support both bound and unbound prepared statements, and deliver static artwork from `public/`.
  * *Rationale*: Guarantees authentic visual fidelity across all breakpoints, prevents layout thrashing, ensures reliable local testing on port 8787, and aligns edge deployment code with the complete product specifications.
  * *Files Created*:
    - [tags_language.js](src/tags_language.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [home.js](src/ui/pages/home.js)
    - [about.js](src/ui/pages/about.js)
    - [myshelf.js](src/ui/pages/myshelf.js)
    - [propose.js](src/ui/pages/propose.js)
    - [verify.js](src/ui/pages/verify.js)
    - [layout.js](src/ui/layout.js)
    - [styles.js](src/ui/styles.js)
    - [url.js](src/utils/url.js)
    - [worker.js](src/worker.js)
    - [engine.js](src/engine.js)
    - [dev_server.mjs](scripts/dev_server.mjs)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

* **Phase 0 Pre-Flight Infrastructure & Edge Resilience Hardening**:
  * *Change*:
    1. Upgraded the read-only query service (`query-service/server.mjs`) with SQLite memory-mapped caching (`PRAGMA mmap_size = 2GB`, `PRAGMA cache_size = 64MB`, `PRAGMA query_only = ON`, `PRAGMA temp_store = MEMORY`), an asynchronous worker-thread connection pool (`query-service/pool.mjs`, `query-service/worker_thread.mjs`) for non-blocking multi-core search concurrency, instant in-memory tag counts preloading, an LRU search query cache with 60s TTL, and an operational `/health` telemetry endpoint.
    2. Authored full automatic restart policies and container definitions for the query service, including systemd service (`query-service/openedshelf-query.service`), production Dockerfile (`query-service/Dockerfile`), Docker Compose (`query-service/docker-compose.yml`), PM2 configuration (`query-service/ecosystem.config.cjs`), and capacity planning guide (`docs/query_service_sizing_and_resilience.md`).
    3. Implemented Cloudflare Workers route and edge caching rules (`src/worker.js`, `public/_headers`), creating canonical exclusion rules in `public/robots.txt` and canonical sitemap in `public/sitemap.xml`, establishing 30-day immutable edge caching for static assets, 7-day edge caching for search engine metadata, and Cloudflare `caches.default` edge acceleration for `/api/tag-counts`.
    4. Engineered multi-layer rate limiting and abuse prevention across WAF and Edge Worker layers (`cloudflare/waf_rate_limits.json`, `cloudflare/rulesets.tf`, `wrangler.jsonc`, `src/worker.js`). Configured 60 req/min limit on `/api/search` and 10 req/min limit on tag proposals (`/submit-tag`, `/propose`), returning ultra-compact 429 JSON payloads (<120 bytes) with `Retry-After: 60` to guarantee zero data-allowance degradation for rural and metered cellular readers. Authored comprehensive operational documentation in `docs/cloudflare_waf_and_rate_limiting.md`.
    5. Created automated integration test suites (`tests/test_query_pool_resilience.mjs` and `tests/test_worker_edge_resilience.mjs`), integrating them into the root `npm test` workflow.
  * *Rationale*: Guarantees backend and edge stability under traffic surges from public launches, protects against scraping floods and D1 proposal spam without penalizing low-bandwidth users, and ensures sub-millisecond edge response times for public readers.
  * *Files Created*:
    - [pool.mjs](query-service/pool.mjs)
    - [worker_thread.mjs](query-service/worker_thread.mjs)
    - [openedshelf-query.service](query-service/openedshelf-query.service)
    - [Dockerfile](query-service/Dockerfile)
    - [docker-compose.yml](query-service/docker-compose.yml)
    - [ecosystem.config.cjs](query-service/ecosystem.config.cjs)
    - [query_service_sizing_and_resilience.md](docs/query_service_sizing_and_resilience.md)
    - [_headers](public/_headers)
    - [robots.txt](public/robots.txt)
    - [sitemap.xml](public/sitemap.xml)
    - [waf_rate_limits.json](cloudflare/waf_rate_limits.json)
    - [rulesets.tf](cloudflare/rulesets.tf)
    - [cloudflare_waf_and_rate_limiting.md](docs/cloudflare_waf_and_rate_limiting.md)
    - [test_query_pool_resilience.mjs](tests/test_query_pool_resilience.mjs)
    - [test_worker_edge_resilience.mjs](tests/test_worker_edge_resilience.mjs)
  * *Files Retired*: None
  * *Files Changed*:
    - [server.mjs](query-service/server.mjs)
    - [worker.js](src/worker.js)
    - [wrangler.jsonc](wrangler.jsonc)
    - [package.json](package.json)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

* **Phase 0 Pre-Flight Database & Ingestion Integrity Hardening**:
  * *Change*: 
    1. Validated catalog artifact parity for `db/openedshelf_db_08_2026.sqlite` (23.30 GiB, ~44.1M Works, ~157.1M Works_Tags, and 984 Tags).
    2. Resolved critical Boolean AND set-intersection bug in `buildDiscoveryQuery` (`src/engine.js`) by adding `HAVING COUNT(DISTINCT t.name) = uniqueInclude.length` and tag deduplication. This restores true Boolean set intersection and guarantees proper 0-result gap collapses ("The Rabbit Hole") for multi-tag and disjoint searches.
    3. Defined the official Cloudflare D1 moderation and governance schema (`db/d1_moderation_schema.sql`) for `Pending_Tags`, `Moderation_Log`, and `Council_Votes`, with strict architectural decoupling from catalog search.
    4. Authored and integrated an automated pre-flight test suite (`tests/test_preflight_database_integrity.mjs`) covering catalog parity, 1-tag to 5-tag intersections, disjoint gap states, pagination boundaries, and D1 table isolation. Configured `npm test` script.
  * *Rationale*: Ensures database integrity, protects against non-deterministic search behaviors during public traffic spikes, and enforces strict separation between read-only search queries and write-heavy moderation transactions.
  * *Files Created*:
    - [d1_moderation_schema.sql](db/d1_moderation_schema.sql)
    - [test_preflight_database_integrity.mjs](tests/test_preflight_database_integrity.mjs)
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [package.json](package.json)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

* **Raw Data Licensing Compliance and Attribution Framework**:
  * *Change*: Conducted a comprehensive audit of all raw data assets, upstream distribution endpoints, and secondary ingestion pipelines (Open Library CC0, Library of Congress Public Domain/BIBFRAME, Wikidata CC0, Project Gutenberg Public Domain metadata, and Google Books API). Formulated and published the official `DATA_LICENSES_AND_ATTRIBUTION.md` specification detailing provenance, copyleft AGPLv3 compatibility, trademark rules, and required machine-readable/UI crediting statements. Updated `worker.js` holding template to display clear bibliographic source attributions and open-source licensing notices in the footer.
  * *Rationale*: Establishes rigorous legal compliance, protects the project against incompatible proprietary/academic-only datasets, and ensures all institutional and open data partners are properly attributed across both code and public web interfaces.
  * *Files Created*:
    - [DATA_LICENSES_AND_ATTRIBUTION.md](docs/DATA_LICENSES_AND_ATTRIBUTION.md)
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

### September 7, 2026

* **Catalog Search Storage Migration and R2 Publication**:
  * *Change*: Added the read-only SQLite query service, Worker search-service client, R2 catalog binding, versioned R2 publication script, AWS SDK multipart uploader, fixture regression test, and deployment documentation. The publisher uploads the large SQLite artifact and manifest through Cloudflare R2's S3-compatible API without requiring AWS CLI. Public catalog search preserves the existing query syntax, result contract, counts, Rabbit Hole behavior, fuzzy fallback, and UI display. D1 remains responsible for `Pending_Tags` and moderation workflows.
  * *Rationale*: The supplied catalog is approximately 23.3 GiB with more than 41 million Works and 197 million Works_Tags rows. Wrangler's direct R2 upload is limited to 300 MiB, so the AWS SDK multipart uploader is used for the large object. Cloudflare R2 stores the artifact but does not execute SQLite, so query execution is separated from the Worker while keeping the catalog immutable and rollbackable.
  * *Files Created*:
    - [search_api.js](src/search_api.js)
    - [server.mjs](query-service/server.mjs)
    - [publish_r2_database.sh](build/v2/scripts/publish_r2_database.sh)
    - [upload_r2.mjs](build/v2/scripts/upload_r2.mjs)
    - [test_search_service.mjs](tests/test_search_service.mjs)
  * *Files Changed*:
    - [worker.js](src/worker.js)
    - [wrangler.jsonc](build/v2/wrangler.jsonc)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)
    - [OpenedShelf_deploy.md](docs/OpenedShelf_deploy.md)
    - [OpenedShelf_architecture_map_v2.md](docs/OpenedShelf_architecture_map_v2.md)
    - [OpenedShelf_Schema_Map.md](docs/OpenedShelf_Schema_Map.md)

### August 26, 2026

* **8-Stage Offline Data Processing Pipeline Optimization**:
  * *Change*: Refined and repeatedly tweaked the existing 8-stage offline data processing pipeline (`run_pipeline.sh`), including optimizations to metadata extraction (`tag_dump_meta.js`), database assembly (`tag_dump_assembly.mjs`), LOC data augmentation (`tag_dump_augment.js`), and tag count pre-computation (`tag_dump_counts.mjs`). Updated the raw SQL seed file (`dump_seed.sql`) and adjusted the corresponding Standard Operating Procedure (`OpenedShelf_Data_Update_SOP.md`) and architecture maps.
  * *Rationale*: Continual tweaks to the pipeline were necessary to improve parsing accuracy, optimize memory management during the massive 17GB text dump processing, and ensure robust tagging across the 30M+ records without hardware exhaustion.
  * *Files Created*:
    - None
  * *Files Retired*:
    - None
  * *Files Changed*:
    - [dump_seed.sql](build/v2/dump_seed.sql)
    - [dump_seed.sql](dump_seed.sql)
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)
    - [tag_dump_assembly.mjs](build/v2/scripts/tag_dump_assembly.mjs)
    - [tag_dump_augment.js](build/v2/scripts/tag_dump_augment.js)
    - [tag_dump_counts.mjs](build/v2/scripts/tag_dump_counts.mjs)
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)
    - [package.json](src/package.json)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)
    - [OpenedShelf_architecture_map_v2.md](docs/OpenedShelf_architecture_map_v2.md)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

### August 10, 2026

* **Standalone Post-Pipeline Cloudflare D1 Deployment Engine**:
  * *Change*: Built an evergreen, standalone post-pipeline deployment system consisting of `prepare_deploy_db.js`, `chunk_master_db.js`, and `deploy_d1.sh`. `prepare_deploy_db.js` creates a production clone (`openedshelf_d1_prod.sqlite`) and sets raw offline staging columns (`ol_subjects` and `ol_genres`) to `NULL`, freeing ~8–10 GB of disk space without pruning any books or affecting live UI features. `chunk_master_db.js` partitions the production SQLite database into 15 MB SQL files with 10,000-row `BEGIN TRANSACTION ... COMMIT;` blocks. `deploy_d1.sh` orchestrates community `Pending_Tags` backups, database optimization, chunk generation, and Wrangler CLI uploads (`npx wrangler d1 execute`) with automated retry logic. Updated all project documentation.
  * *Rationale*: Prevents Cloudflare D1 upload failures caused by payload size limits and D1's 10 GB per-database storage cap. Retains 100% of all books (including self-published, indie, and non-ISBN titles) in strict compliance with the OpenedShelf Manifesto, while providing a 50x throughput increase for monthly remote database refreshes.
  * *Files Created*:
    - [prepare_deploy_db.js](build/v2/scripts/prepare_deploy_db.js)
    - [chunk_master_db.js](build/v2/scripts/chunk_master_db.js)
    - [deploy_d1.sh](build/v2/scripts/deploy_d1.sh)
  * *Files Retired*:
    - None
  * *Files Changed*:
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)
    - [OpenedShelf_deploy.md](docs/OpenedShelf_deploy.md)
    - [OpenedShelf_architecture_map_v2.md](docs/OpenedShelf_architecture_map_v2.md)

---

## Recent Updates (July 1, 2026 - July 15, 2026)

### July 14, 2026

* **Migrate LOC Ingest Pipeline to BIBFRAME JSON-LD**:
  * *Change*: Rewrote `loc_marc_ingest.js` to parse the modern Library of Congress BIBFRAME JSON-LD dataset (`hubs.bibframe.jsonld.gz`) instead of the legacy 2016 MARC XML format. Replaced `fast-xml-parser` with Node's native `readline` module for highly efficient single-pass streaming. Implemented a mapping engine to extract `bf:mainTitle`, `rdfs:label` (Synopsis), `bf:originDate`, and `bf:Isbn` from the flattened `@graph` structure. Updated the `OpenedShelf_Data_Update_SOP.md` documentation to instruct users to download the Hubs JSON-LD dump. Included a schema bugfix to cleanly drop the `Descriptions` table before repopulating it to prevent migration collisions.
  * *Rationale*: The Library of Congress 2016 MARC dump was outdated and cumbersome. Updating the pipeline to use the modern BIBFRAME JSON-LD Hubs dataset provides much more recent books, higher quality plot synopses, and a more robust line-by-line processing model that avoids V8 memory exhaustion.
  * *Files Created*:
    - None
  * *Files Retired*:
    - None
  * *Files Changed*:
    - [loc_marc_ingest.js](build/v2/scripts/loc_marc_ingest.js)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)

---

## Recent Updates (June 1, 2026 - June 15, 2026)

### June 9, 2026

* **Rabbit Hole Progressive Tag Step Breakdown & Fuzzy Fallback Mapping**:
  * *Change*: Refactored `rabbitHoleData` generation in `worker.js` to incrementally evaluate and push `includeTags` and `excludeTags` one by one with explicitly mapped `includes` and `excludes` array snapshots, rather than cumulatively parsing raw input query strings. Updated the display loop in `layout.js` to render the individually added tag for each progressive step instead of repeating the cumulative string, and formatted subsequent inclusions/exclusions with explicit `+` and `-` prefixes. Additionally, `fuzzyResults` logic was updated to use the exact `includes` and `excludes` snapshot from the last non-zero step.
  * *Rationale*: Transforms the "Rabbit Hole" view into a clean, step-by-step breakdown of exactly how each tag narrowed the results down to 0, visually satisfying the user flow while properly retaining the accurate subset of tags required to render the "Fuzzy Fall: One Step Back" related works feature.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [layout.js](src/ui/layout.js)
    - [worker.js](src/worker.js)

### June 5, 2026

* **Rarity-Based Search Query Optimization**:
  * *Change*: Propagated `tagCounts` to `buildCountQuery` in `engine.js` and modified all callers inside `worker.js` (including the Rabbit Hole progressive search loop and the fuzzy fallback query) to pass `tagCounts`.
  * *Rationale*: Prevents catastrophic database timeouts and table scans. Previously, checking the intersection count of a very common tag (e.g. `lang:eng` with 21.4M rows) and a nonexistent tag forced a scan of all 21.4 million rows. By passing `tagCounts`, the engine correctly sorts tag constraints by rarity (rarest first), resulting in sub-millisecond query evaluation (a 10,000x+ performance speedup).
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [worker.js](src/worker.js)

* **Publication Year Ingestion from LOC MARC XML Data**:
  * *Change*: Added a `publish_year` column to the `Works` database schema and intermediate `Descriptions` schema. Updated `loc_marc_ingest.js` to parse the 4-digit publication year from control field `008` (bytes 07–10) with a fallback to tags `260` or `264` subfield `c`. Updated `tag_dump_augment.js` to synchronize the parsed years from the secondary database into the primary database's `Works` table. Fully documented the prefix search syntax (`year:`) and the LOC-exclusive data source details in the Taxonomy Governance Protocol, the Reader's Primer, the Schema Map, and the Data Update SOP.
  * *Rationale*: Equips the database with publication year metadata to enable granular search capabilities. Using LOC's control field `008` ensures a highly consistent 4-digit format compared to the chaotic text found in Open Library dumps. Limiting this to LOC data avoids bloated DB schema changes for Open Library parsing while documenting its restrictions clearly.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [schema.sql](src/schema.sql)
    - [loc_marc_ingest.js](build/v2/scripts/loc_marc_ingest.js)
    - [tag_dump_augment.js](build/v2/scripts/tag_dump_augment.js)
    - [OpenedShelf_TGP.md](docs/OpenedShelf_TGP.md)
    - [OpenedShelf_reader.md](docs/OpenedShelf_reader.md)
    - [loc_marc_pipeline_spec.md](docs/loc_marc_pipeline_spec.md)
    - [secondary_data_pipeline_spec.md](docs/secondary_data_pipeline_spec.md)
    - [OpenedShelf_Schema_Map.md](docs/OpenedShelf_Schema_Map.md)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)

* **Subgenre Collapsible Dropdowns for Categories and Tropes**:
  * *Change*: Refactored the sidebar categories and tropes rendering logic in `home.js`. Replaced the flat tag clouds with interactive `<details>` and `<summary>` collapsible dropdowns grouped by their active parent subgenre (e.g. Science Fiction Interest and Science Fiction Trope). Re-styled the language `<select>` element to use a centralized CSS class `.sidebar-select` inside `styles.js`.
  * *Rationale*: Grouping categories and tropes by subgenre and putting them inside details elements reduces visual clutter, makes active subgenres and tropes easy to filter, and maintains visual consistency with the existing Broad Genres and Thematic Elements sections.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [home.js](src/ui/pages/home.js)
    - [styles.js](src/ui/styles.js)

* **Responsive Layout Width Scaling & Typography Measure**:
  * *Change*: Expanded the maximum container width of `header`, `footer`, and `main` layout wrappers from `1000px`/`800px` to `1200px` for viewports wider than `800px`. Adjusted `.dashboard-layout` columns to `3fr 1.2fr` and increased the gap to `3rem` to leverage the expanded space. Constrained `.book-description` blocks to `max-width: 68ch` and set `line-height: 1.45` to preserve typography readability standards.
  * *Rationale*: Improves layout spaciousness and usability on modern high-resolution displays. Keeps paragraph line lengths within the optimal reading range (50-75 characters) to ensure readability does not suffer on extra-wide screens, while leaving tablet and mobile styling completely unaffected.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [styles.js](src/ui/styles.js)

### June 4, 2026

* **Language Tag DB Migration & UI Alignment**:
  * *Change*: Executed a local database migration script using `node:sqlite` to mass `REPLACE` all `lang_` prefixed identifiers with `lang:` across the `Tags` and `Works_Tags` tables (temporarily disabling foreign keys to prevent constraint violations).
  * *Rationale*: Resolves a critical bug where the local SQLite database still held over 21 million `lang_XXX` records, while the frontend UI and discovery engine had been updated to expect `lang:XXX` (causing all language queries to return 0 books and triggering `SQLITE_BUSY` locks during massive concurrent updates).
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*: None (Local database state updated)

* **Data Ingestion Pipeline Orchestration & SOP Sync**:
  * *Change*: Integrated the secondary data augmentation script (`tag_dump_augment.js`) directly into the automated `run_pipeline.sh` orchestrator as Stage 2.5 (triggering conditionally if `secondary_seed.db` is present). Updated the `OpenedShelf_Data_Update_SOP.md` documentation to reflect the new 8-Stage Architecture, accurately describing the Library of Congress vocabulary additions and removing obsolete references to fallback scripts.
  * *Rationale*: Automates the previously isolated secondary data enrichment phase, ensuring plot synopses are seamlessly merged before the taxonomy regex engines execute. Aligns the documentation with the current realities of the pipeline architecture.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)

* **Database Renaming & Paradigm Shift**:
  * *Change*: Renamed the core local SQLite database from `openedshelf_monthly.sqlite` to `openedshelf_master.sqlite` and updated all pipeline scripts (`run_pipeline.sh`) and documentation files to reflect the new path.
  * *Rationale*: Clarifies the true nature of the database as a persistent, continuously growing master repository that builds additively on existing records, rather than a disposable asset that gets wiped and regenerated each month.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)
    - [OpenedShelf_Data_Update_SOP.md](docs/OpenedShelf_Data_Update_SOP.md)
    - [OpenedShelf_discovery.md](docs/OpenedShelf_discovery.md)
    - [OpenedShelf_deploy.md](docs/OpenedShelf_deploy.md)
    - [OpenedShelf_Schema_Map.md](docs/OpenedShelf_Schema_Map.md)
    - [OpenedShelf_architecture_map_v2.md](docs/OpenedShelf_architecture_map_v2.md)

* **Thematic Taxonomy Streaming & Performance Overhaul**:
  * *Change*: Completely refactored `tag_dump_thematic.js` to match the advanced streaming architecture established in `tag_dump_trope.js`. Eliminated the exponential O(N^2) `OFFSET` scanning loop in favor of strict O(N) Keyset Pagination (`rowid > ?`). Fixed a critical bug where fallback rules were being generated for all tags rather than just `tier = 'thematic'`. Brought over the dynamic `triggerWords` `Set` pre-filter and `compileKeywordToRegexSource` logic to ensure thematic regex parsing benefits from early-exit optimizations and handles advanced linguistic rules. Removed the buggy fallback to `TROPE_KEYWORDS` and strictly constrained folksonomy logic to `THEMATIC_KEYWORDS` and `THEME_TROPE_MAP` cascades. Expanded text scanning to cover `short_synopsis`, `ol_subjects`, and `ol_genres`.
  * *Rationale*: The thematic script was still relying on legacy chunking and naive literal Regex strings without pre-filtering, which caused severe script stalls over massive data sets. The upgrade drastically decreases processing time and ensures exact lexical accuracy without polluting the log with thousands of non-thematic regex evaluations.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_thematic.js](build/v2/scripts/tag_dump_thematic.js)

* **Thematic Database Validation & Yield Tracking**:
  * *Change*: Successfully executed the refactored `tag_dump_thematic.js` pipeline against the 40M-row database. The script correctly cascaded **32,598,314 tags** from the `THEME_TROPE_MAP` explicit rule engine, and subsequently identified and added an additional **2,578,521 tags** via the folksonomy regex fallback pass, while safely skipping 12.6M existing fallback mappings.
  * *Rationale*: Validates the success of the new thematic tag pipeline. The massive 32.5M cascade yield confirms that linking thematic parent tags to genre tropes exponentially enriches the database and ensures broad themes (like "romance" or "survival") are reliably populated based on specific explicit trope matches. The 2.5M regex mappings confirm that the folksonomy dictionary is efficiently capturing missing records without stalling out.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*: None (Database state updated locally)

### June 3, 2026

* **Trope Taxonomy Overhaul & Semantic Engine Refactor**:
  * *Change*: Fully expanded the `tags_trope_keywords.js` dictionary with formal Library of Congress (LOC MARC 520) vocabulary, effectively solving the "Literal Trap" and "Non-Fiction Deficit" across 21 genres. Refactored `tag_dump_trope.js` to dynamically compile these keywords into highly flexible RegEx patterns (handling noun aliases, verb stemming, and prepositions). Crucially, implemented a massive performance optimization via a `triggerWords` `Set` intersection pre-filter on tokenized row data, eliminating 90%+ of heavy RegExp tests. Finally, injected hardcoded SQL mappings for foundational non-fiction works into `seed_mappings.js`.
  * *Rationale*: The previous folksonomy-based RegEx dictionary yielded a minuscule number of matches against formal library text, leaving millions of works untagged. This overhaul bridges the vocabulary gap and secures the pipeline architecture against V8 thermal throttling via the `Set` pre-filter, anchoring the tagging database securely.
  * *Files Created*:
    - [test_trope_regex.js](tests/test_trope_regex.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [tags_trope_keywords.js](src/tags_trope_keywords.js)
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)
    - [seed_mappings.js](src/seed_mappings.js)

* **V8 Garbage Collection Stall Hotfix**:
  * *Change*: Refactored the `evaluateFn` dynamic closure compiler in `tag_dump_trope.js` Pass 1 to explicitly pre-instantiate the 376 Regex explicit mapping rules into a statically sized array (`ruleRegexes`). The dynamic function now calls `regexes[index].test(...)` instead of `new RegExp(...)`. Additionally, replaced `.split()` with `.match()` during row tokenization.
  * *Rationale*: The initial streaming pipeline stalled at 2.5 million rows due to catastrophic V8 Garbage Collection starvation. The previous architecture was instantiating and immediately destroying over 37.6 million `RegExp` objects per chunk (100k rows * 376 rules), completely exhausting the V8 JS heap. The fix brings RegExp compilation down to exactly 376 instances at script boot, fully restoring single-pass streaming speeds.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)

* **Core Loop Streaming & Memory Optimizations**:
  * *Change*: Swapped word-bounded `RegExp.test()` for native `String.prototype.includes()` in the `seed_mappings.js` compiler (Pass 1). Extracted dynamic `.toLowerCase()` calls from the evaluation loop and cached them sequentially per database row. Decreased the SQLite chunk limit from 100,000 to 10,000 and injected a `setImmediate` micro-yield every 2,500 rows.
  * *Rationale*: Despite fixing the V8 GC stall, the script's raw runtime was hovering near 90 minutes. Profiling revealed that Pass 1 was heavily penalized by thousands of redundant `.toLowerCase()` calls and computationally heavy `RegExp` objects on simple substring queries. Transitioning to `.includes()` yields a 3x speedup and matches SQLite's native `LIKE '%...%'` substring semantics. Furthermore, clamping the chunk size prevents array memory bloat, and the micro-yielding prevents the event loop from locking up over 40 million records. Total runtime is now estimated safely under 30 minutes.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)

* **Database Validation & Deployment Impact Analysis**:
  * *Change*: Successfully executed the refactored `tag_dump_trope.js` pipeline against the 40M-row database. The script finished the massive sweep in record time, successfully identifying and adding **10,290,501 new explicit & regex trope mappings** while safely skipping 21.3M existing records.
  * *Rationale*: Validates the success of the multi-phase Library of Congress formal vocabulary expansion and the V8 streaming optimizations.
  * *Pipeline Impact*: The `Works_Tags` table has expanded by over 10 million rows. When migrating this updated SQLite state to the production Cloudflare D1 environment, the deployment automation must ensure that `INSERT` statements are strictly chunked and batched to prevent hitting D1's transactional memory and payload-size caps.
  * *UI/Frontend Impact*: The "Rabbit Hole" discovery engine will become vastly richer. Millions of previously sterile, un-tagged works (especially foundational non-fiction and formally cataloged fiction) will now populate dynamic tag clouds and "related works" sidebars. UI rendering logic may need to be audited to ensure that books receiving an overwhelming number of new tags are visually truncated or prioritized (e.g., displaying `tier 1` tropes first) to preserve mobile layout fidelity.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*: None (Database state updated locally)

* **Phase 2 Core Database Augmentation Script**:
  * *Change*: Created `tag_dump_augment.js` to merge the secondary Wikidata and Library of Congress descriptions directly into the primary D1 database `Works` table. Implemented an incredibly fast in-memory Javascript mapping of all `secondary_seed.db` ISBNs and normalized Title/Author combinations to completely bypass executing millions of SQL queries. Processed the primary database via 100k chunked streams and executed `UPDATE` statements inside 10,000-record batched transactions with 5-second thermal cooldowns.
  * *Rationale*: Successfully enriched over 4.8 million books with plot synopses without causing memory lockouts or thermal throttling, drastically improving the frontend reading experience.
  * *Files Created*:
    - [tag_dump_augment.js](build/v2/scripts/tag_dump_augment.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Phase 3 Trope Taxonomy Discovery (Postmortem)**:
  * *Change*: Executed `tag_dump_trope.js` against the newly augmented database. The output revealed that 4,140,098 trope mappings already existed from previous runs, while the regex engine only generated 4,068 new mappings from the 4.8 million imported plot synopses.
  * *Rationale*: The minuscule yield of 4,068 new tags proved that the data extraction pipeline failed its primary goal. The regex dictionary (`tags_trope_keywords.js`) inherently requires colloquial reader slang (e.g., "enemies to lovers"), while the text imported from national libraries and Wikidata is purely formal and academic, completely evading relational trope detection.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*: None

*   **Scrapped Wikidata Secondary Pipeline**:
  * *Change*: Archived `scripts/wikidata_ingest.js` to `scripts/archive/` and removed Task 1.1 from the Secondary Data Pipeline Spec. Deleted the 153GB `latest-all.json.gz` raw dump.
  * *Rationale*: Determined that Wikidata's descriptions, while plentiful, are strictly factual and encyclopedic. This renders them virtually useless for the regex trope matching engine, which relies on marketing colloquialisms. The 153GB payload was deemed unnecessary bloat compared to the much smaller and more descriptive Library of Congress dataset.
  * *Files Created*: None
  * *Files Retired*:
    - [wikidata_ingest.js](scripts/archive/wikidata_ingest.js)
  * *Files Changed*:
    - [secondary_data_pipeline_spec.md](docs/secondary_data_pipeline_spec.md)

### June 2, 2026

* **LOC MARC 520 Data Extraction Pipeline**:
  * *Change*: Created `loc_marc_ingest.js` to process the Library of Congress bulk MARCXML dataset. Implemented single-pass streaming using `fast-xml-parser` (configured to properly array-wrap `datafield` tags to avoid single-tag crashes). Designed robust regex sanitization for ISBN extraction (stripping trailing cataloger text) and extracted Title, Author, and Field 520 (summaries). Valid records are buffered and inserted in batches of 10,000 using SQLite transactions with `INSERT OR REPLACE` to seamlessly merge with the existing Wikidata seed. Implemented a 5-second hardware cooldown every 50,000 records.
  * *Rationale*: OpenLibrary drops or mangles MARC Field 520 (plot blurbs). This script establishes a parallel ingestion pipeline that extracts high-quality book summaries directly from the Library of Congress bulk dumps, resolving a massive data deficit for the `secondary_seed.db`. The streaming XML architecture with batched transactions and hardware cooldowns guarantees the script can safely parse the ~13.7GB dataset without RAM exhaustion or CPU thermal throttling.
  * *Files Created*:
    - [loc_marc_ingest.js](build/v2/scripts/loc_marc_ingest.js)
    - [loc_data_download_instructions.md](docs/loc_data_download_instructions.md)
  * *Files Retired*:
    - None
  * *Files Changed*:
    - None

* **Task 1.1 Wikidata Ingestion Script**:
  * *Change*: Created a new script to ingest the 153GB Wikidata JSON dump (`latest-all.json.gz`). It utilizes Node's native `readline` module with `zlib.createGunzip()` to stream and decompress the dump efficiently. Extracted data (ISBN, Title, Description, and Author P50) is buffered and inserted into `db/secondary_seed.db` using batched SQL transactions. Added live terminal progress monitoring and thermal throttling protection.
  * *Rationale*: Fulfills Task 1.1 of the Secondary Data Ingestion Pipeline Spec. Because the dump is structured as a massive array of single-line JSON objects separated by commas, the `readline` approach avoids the massive CPU bottleneck of `stream-json`. Batched SQLite writes directly to the DB replace the intermediate JSONL file requirement, skipping unnecessary steps. Hard thermal pauses are triggered every 50,000 lines to prevent CPU overheating during the multi-hour run.
  * *Files Created*:
    - [wikidata_ingest.js](build/v2/scripts/wikidata_ingest.js)
  * *Files Retired*:
    - None
  * *Files Changed*:
    - None

* **Root Directory Cleanup & Structure Standardization**:
  * *Change*: Cleaned up the root directory by moving all loose documentation, specs, database files, and scripts into their respective folders (`docs/`, `db/`, `scripts/`, `tests/`).
  * *Rationale*: Maintains a clean root directory, making it easier to identify core project files and configuration. Enforces a standard where the root is strictly for configuration and essential docs.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - All loose `*.md` files (except Changelog, License) moved to `docs/`
    - `authors_map.db` and `secondary_seed.db` moved to `db/`
    - `stats.sql` moved to `scripts/`
    - `test_pass2.mjs` and `test_rules.mjs` moved to `tests/`

## Recent Updates (May 16, 2026 - May 31, 2026)

### May 31, 2026

* **Scrapped Gutenberg Secondary Pipeline**:
  * *Change*: Archived `scripts/ingest_gutenberg.js` and `scripts/ingest_gutenberg.py` to `scripts/archive/` and removed Task 1.2 from the Secondary Data Pipeline Spec.
  * *Rationale*: Determined that Gutenberg's RDF metadata descriptions are heavily reliant on Wikipedia. Since the pipeline already relies on Wikidata (which provides identical, highly-structured Wikipedia descriptions mapped directly to ISBNs for millions of works), the Gutenberg pipeline was deemed entirely redundant.
  * *Files Created*: None
  * *Files Retired*:
    - [ingest_gutenberg.js](scripts/archive/ingest_gutenberg.js)
    - [ingest_gutenberg.py](scripts/archive/ingest_gutenberg.py)
  * *Files Changed*:
    - [secondary_data_pipeline_spec.md](secondary_data_pipeline_spec.md)

* **Renamed OpenLibrary_dump to Raw_Data**:
  * *Change*: Renamed the `OpenLibrary_dump` directory to `Raw_Data`. Updated all internal paths in the pipeline scripts and the Data Update SOP to point to the new directory.
  * *Rationale*: Better reflects the generalized nature of the raw data directory.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [peek_dump.mjs](build/v2/scripts/peek_dump.mjs)
    - [peek_empty.mjs](build/v2/scripts/peek_empty.mjs)
    - [peek_fields.mjs](build/v2/scripts/peek_fields.mjs)
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)
    - [OpenedShelf_Data_Update_SOP.md](OpenedShelf_Data_Update_SOP.md)

### May 30, 2026

* **Open Source Licensing (AGPLv3) Header Application**:
  * *Change*: Prepended the standard AGPLv3 header comment block to the beginning of all active source, script, and test files in the project. Configured the correct comment syntax per file type (`/* ... */` for JS/MJS, `# ...` for Shell/Python, and `-- ...` for SQL) and ensured that any script file containing a shebang (`#!`) preserves it on the first line by placing the header on the lines immediately following it.
  * *Rationale*: Ensures the codebase is properly and consistently licensed under the AGPLv3, protecting the platform's copyleft ethos, whilst preventing syntax/execution failures on scripts that require intact shebang lines.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)
    - [worker.js](src/worker.js)
    - [engine.js](src/engine.js)
    - [search_utils.js](src/search_utils.js)
    - [schema.sql](src/schema.sql)
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)
    - (and 60 other active source, script, and test files in the project)

* **Genre Trope Streaming Architecture Overhaul**:
  * *Change*: Refactored `build/v2/scripts/tag_dump_trope.js` to adopt the new single-pass JS memory streaming architecture. Eliminated the N-Query SQL scanning engine. Explicit mapping rules are compiled into V8 Javascript closures. Folksonomy regex matches evaluate sequentially via `.test()` across `short_synopsis`, `ol_subjects`, and `ol_genres` without allocating concatenated strings. Batched transaction inserts are implemented alongside explicit hardware protection pauses to yield the event loop.
  * *Rationale*: Matches the massive performance gains seen in the `_identity` script. Eliminates a highly inefficient structure that appended dynamic SQL conditionals and queried the database separately for every single trope mapping rule. The sequential `.test()` evaluations specifically avoid Javascript string-allocation bottlenecks during massive 40M-row processing loops.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)

* **Identity Taxonomy Mapping Restore & Hardening**:
  * *Change*: Fixed a catastrophic bug in `tag_dump_identity.js` where a testing loop limit (`iter++ < 2`) was artificially capping the script to scan only 200,000 rows. Re-enabled infinite database streaming. Hardened the `seed_mappings.js` rules to correctly query the `ol_subjects` array rather than `short_synopsis`. Refactored the SQL `LIKE` parameter translation engine to use proper JavaScript Word Boundary Regular Expressions (`/\bpattern\b/`) rather than naive `.includes()` matches. Implemented a Set-based deduplication buffer to optimize transaction inserts.
  * *Rationale*: The testing limit caused the explicit identity mapping counts to plunge from ~19M to 1.7M, leaving the database vastly undertagged. Furthermore, the previous `.includes()` translation meant explicit rules matching `%war%` would inadvertently trigger on words like "hardware", polluting the genre mapping tags. Word boundaries resolve this, and the deduplication buffer significantly accelerates SQLite `INSERT` processing.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_identity.js](build/v2/scripts/tag_dump_identity.js)
    - [seed_mappings.js](src/seed_mappings.js)

* **Identity Taxonomy Split & Schema Integration**:
  * *Change*: Split the genre identity pipeline into two explicit parts: `seed_mappings.js` now strictly handles Title/Author explicit matches, while a newly created `tags_identity_keywords.js` handles all regex-based folksonomy keyword logic. The pipeline script `tag_dump_identity.js` was updated to read exclusively from the newly separated `ol_subjects` and `ol_genres` columns.
  * *Rationale*: Prevents false positive wildcard mappings and increases taxonomy parsing precision.
  * *Files Created*:
    - [tags_identity_keywords.js](src/tags_identity_keywords.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [seed_mappings.js](src/seed_mappings.js)
    - [tag_dump_identity.js](build/v2/scripts/tag_dump_identity.js)

* **Genre Trope Colloquial Fracturing Fix (The Literal Trap)**:
  * *Change*: Created a new dictionary `src/tags_trope_keywords.js` to map chaotic, colloquial reader tags (e.g., `rivals to lovers`, `hate to love`) to standard genre trope IDs (e.g., `genre:enemies_to_lovers`). Updated the dynamic fallback regex builder in `build/v2/scripts/tag_dump_thematic.js` to import this dictionary and generate comprehensive `OR`-based regex patterns for tropes. Additionally, updated the primary explicit parsing script `build/v2/scripts/tag_dump_trope.js` to dynamically inject these synonyms into the fast SQL `INSTR` exact-match queries, bypassing the previous exact literal string split in both phases.
  * *Rationale*: Resolves the massive data gap where genre tropes were drastically under-represented in the database. OpenLibrary `subjects` are populated by users as folksonomies without standardized nomenclature; the strict literal string matching (`%enemies-to-lovers%`) was dropping almost all valid variations. The engine now dynamically adapts to reader slang during both explicit matching and fallback regex.
  * *Files Created*:
    - [tags_trope_keywords.js](src/tags_trope_keywords.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_thematic.js](build/v2/scripts/tag_dump_thematic.js)
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)
    - [OpenedShelf_architecture_map_v2.md](OpenedShelf_architecture_map_v2.md)
    - [OpenedShelf_Data_Update_SOP.md](OpenedShelf_Data_Update_SOP.md)

* **Pipeline Hardware Cooldown Completeness**:
  * *Change*: Refactored the `UPDATE Tags` query in `tag_dump_counts.mjs` to execute in `LIMIT/OFFSET` chunks using SQLite's internal `rowid` and injected a 5-second cooldown between each chunk. Appended a 5-minute hardware protection cooldown sleep after the final step in `run_pipeline.sh`.
  * *Rationale*: The final tag counts step was the only script missing hardware cooldown protections, running a massive unchunked `UPDATE` query that pinned the CPU at 100%. This ensures the entire 7-stage data ingestion pipeline runs safely without thermal throttling.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_counts.mjs](build/v2/scripts/tag_dump_counts.mjs)
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)

* **Schema Separation of OpenLibrary Categorical vs. Descriptive Text**:
  * *Change*: Altered the `Works` table schema to add `ol_subjects` and `ol_genres` columns. Modified `tag_dump_meta.js` to extract these arrays and store them in their respective columns, rather than dumping them all into `short_synopsis`. `short_synopsis` is now repurposed to exclusively hold the block text plot blurb (`description`).
  * *Rationale*: Mixing categorical tags (like `subjects`) with narrative text (`description`) into a single string was structurally unsound. Downstream scripts using SQL `LIKE` queries against `short_synopsis` were triggering massive false positives (e.g., a plot blurb mentioning "history of a descent into madness" triggering the History genre). Isolating the data prevents these false positives and provides downstream agents a clean target.
  * *Files Created*:
    - [OpenedShelf_Schema_Map.md](OpenedShelf_Schema_Map.md)
  * *Files Retired*: None
  * *Files Changed*:
    - [schema.sql](src/schema.sql)
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)
    - [OpenedShelf_Data_Update_SOP.md](OpenedShelf_Data_Update_SOP.md)

* **Language Tag Namespace Unification**:
  * *Change*: Migrated the language tag prefix from `lang_` to `lang:` across all extraction scripts (`tag_dump_meta.js`, `tag_dump_clean.js`), taxonomy seeders (`tags_language.js`, `seed_base_tags.js`), and frontend parsers (`home.js`).
  * *Rationale*: Unifies the language tags with the established `genre:` and `author:` namespace syntax, providing consistent parsing rules and preventing potential collisions with thematic tags.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)
    - [tag_dump_clean.js](build/v2/scripts/tag_dump_clean.js)
    - [tags_language.js](src/tags_language.js)
    - [seed_base_tags.js](src/utils/seed_base_tags.js)
    - [home.js](src/ui/pages/home.js)

* **Taxonomy Pipeline Streaming Architecture**:
  * *Change*: Refactored `build/v2/scripts/tag_dump_identity.js` to use an in-memory Single-Pass JS Streaming Architecture instead of the previous N-Query SQL scanning engine. The script now reads the 40-million row database exactly once in chunks, compiles the mapping rules into V8 RegExp closure functions, evaluates them instantly in memory, and performs batched bulk `INSERT` operations. Strictly enforced the hardware cooling logic: the script now explicitly yields the Node.js event loop every 100,000 rows to prevent the CPU from pegging at 100%, and performs a full 5-second deep rest every 500,000 rows.
  * *Rationale*: The previous architecture executed 737 full-table unindexed `INSTR` scans across 40 million rows, causing the script to stall for over 1.5+ hours. By pushing the string evaluation to V8 memory, it processes 300,000+ rows in seconds, completely resolving the pipeline stall while maintaining identical tagging logic and robust thermal safety limits.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_identity.js](build/v2/scripts/tag_dump_identity.js)

* **Author Tag Search Support**:
  * *Change*: Enabled direct author filtering in the search engine via the `author:` prefix (e.g., `author:smith`). Updated `search_utils.js` to bypass greedy token matching for author strings, and refactored `engine.js` to process these strings into optimized `LIKE` filters against the primary `Works.author` metadata column.
  * *Rationale*: Allows users to filter discovery sets by specific authors without forcing the system to maintain a massive, high-cardinality UI dropdown menu, preserving sub-millisecond edge latency while expanding search capabilities.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [search_utils.js](src/search_utils.js)
    - [engine.js](src/engine.js)
    - [OpenedShelf_discovery.md](OpenedShelf_discovery.md)

* **Genre Identity Formal Vocabulary Overhaul**:
  * *Change*: Completely rewrote the `genre_identity` SQL mappings in `src/seed_mappings.js` to target formal Library of Congress Subject Headings (LCSH) and BISAC standard vocabulary instead of colloquial reader slang (e.g., matching `%climatic changes fiction%` instead of `%clifi%`).
  * *Rationale*: Since OpenLibrary subjects strictly use formal controlled vocabularies, mapping against colloquial terms returned zero hits, leaving the database identical to previous loads despite new rules. By aligning our taxonomy mapping strings with standard library systems, millions of works are now correctly tagged.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [seed_mappings.js](src/seed_mappings.js)

* **Strict Scoped Parents for Ambiguous Subgenres**:
  * *Change*: Enforced the optional 4th tuple parameter (`scopedParent`) across all multi-parent subgenres (such as `genre:historical`, `genre:cozy`, `genre:dark`, `genre:psychological`) in `seed_mappings.js`.
  * *Rationale*: Because a matched genre identity acts as a genre seeding fallback that automatically populates a null parent genre, an ambiguous match would cause a false-positive cascade (granting a single book 5+ conflicting parent genres). The scoped parent explicitly binds the mapping to a single parent.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [seed_mappings.js](src/seed_mappings.js)

### May 29, 2026

* **Trope Keywords Dictionary Full Expansion**:
  * *Change*: Expanded `src/tags_trope_keywords.js` from 25 trope entries (~120 keyword phrases) to **382 trope entries (~3,716 keyword phrases)**, achieving 100% coverage of every trope defined in `tags_genre_tropes.js` across all 21 genre groups. Each trope now carries ~9.7 colloquial aliases on average, including common misspellings, abbreviations, hyphen variants, reader slang, and folksonomy phrasing.
  * *Rationale*: The initial keywords dictionary only covered a handful of Sci-Fi, Romance, Mystery, Horror, and Adventure tropes, leaving ~330 tropes without any colloquial mapping. This meant the dynamic regex fallback in the tagging pipeline could not resolve the vast majority of user-generated subject tags back to canonical trope identifiers. The expansion was processed systematically by genre group to preserve accuracy and focus. Only Tier 3 trope tags were mapped; Tier 2 genre identity parent tags were correctly excluded per the taxonomy governance protocol.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tags_trope_keywords.js](src/tags_trope_keywords.js)

* **Synopsis Truncation & Description Extraction Fix**:
  * *Change*: Modified `build/v2/scripts/tag_dump_meta.js` Pass 2 to stop truncating OpenLibrary `subjects` to just the first 8 items. It now joins the entire subjects array. Additionally, if the book has a true `description` field, it safely extracts up to 500 characters of it and appends it to the subjects string.
  * *Rationale*: Prevents catastrophic data loss during downstream tag mapping. Previously, any valid subjects past the 8th item were entirely deleted before the regex or LIKE mapping rules could even run. Appending the description maximizes the text surface area for colloquial tag matches.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)

* **ISBN & Author Separate Update Bug Fix**:
  * *Change*: In `tag_dump_meta.js` Pass 3, the `UPDATE` logic for appending edition-level ISBNs and Authors was decoupled. Tracking was split into two independent optimized memory sets (`updatedAuthorSet` and `updatedIsbnSet`).
  * *Rationale*: Resolves a bug where millions of ISBNs were lost because the previous logic skipped updating the ISBN if the author had already been successfully resolved in Pass 2.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)


* **Pipeline Restoration & Seeder Alignment**:
  * *Change*: Restored `seed_mappings.js` from the `archive/` folder back to `src/` to ensure explicit SQL tag mappings are available for the pipeline. Moved `seed_base_tags.js` to `src/utils/` and updated `run_pipeline.sh` to correctly execute it during Stage 2 (Database Assembly). Cleaned up obsolete test scripts (`force_seed_all_tags.js`).
  * *Rationale*: Fixes a fatal `MODULE_NOT_FOUND` error that broke the data pipeline. Properly separating `seed_base_tags.js` (which builds the empty schema rows) from `seed_mappings.js` (which holds the SQL matching rules) ensures the database can actually grant tags without skipping due to missing `Tags` records.
  * *Files Created*: None
  * *Files Retired*:
    - [force_seed_all_tags.js](archive/force_seed_all_tags.js)
  * *Files Changed*:
    - [seed_mappings.js](src/seed_mappings.js)
    - [seed_base_tags.js](src/utils/seed_base_tags.js)
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)

### May 28, 2026

* **Thematic Tagging Overhaul & Expansion**:
  * *Change*: Refactored `tag_dump_thematic.js` to extract the massive 1900-line `THEMATIC_KEYWORDS` dictionary into a standalone module (`src/tags_thematic_keywords.js`) for significantly better maintainability.
  * *Change*: Expanded `theme_trope_map.js` with over 230 new 1-to-many cross-walks bridging `tags_genre_identity.js` and `tags_genre_tropes.js` to their thematic parent tags.
  * *Rationale*: Maximizes the platform's core credo of discoverability by ensuring specific tropes cascade accurately into their thematic elements. Resolves missing tag inflation due to SQLite literal string matching.
  * *Files Created*:
    - [tags_thematic_keywords.js](src/tags_thematic_keywords.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_thematic.js](build/v2/scripts/tag_dump_thematic.js)
    - [theme_trope_map.js](src/theme_trope_map.js)

* **Author Extraction Accuracy**:
  * *Change*: Refactored `build/v2/scripts/tag_dump_meta.js` to use a 3-pass extraction architecture. Built a persistent `authors_map.db` mapping using `better-sqlite3` to accurately extract `/type/author` records instead of relying entirely on messy edition strings.
  * *Rationale*: Improves author mapping from ~38% to near 100%, resolving clean author search criteria.
  * *Files Created*:
    - [authors_map.db](build/v2/scripts/authors_map.db)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)

* **Hardware Cooldown Optimization**:
  * *Change*: Lowered the Pass 3 (`/type/edition`) hardware protection cooldown in `tag_dump_meta.js` from 7 seconds to 5 seconds to moderately speed up processing.
  * *Rationale*: Speeds up processing of edition sweeps once database index performance is confirmed.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)

* **Edge Worker Optimization & Architecture Alignment**:
  * *Change*: Fully decoupled `seeder.js` and `seed_mappings.js` from the edge execution environment (`worker.js`). Removed all legacy `ensureDbSeeded` database ping checks on worker boot.
  * *Rationale*: Ensures the Cloudflare Worker remains perfectly lean and focused strictly on HTTP routing and UI generation.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)

* **Archived Seeder Scripts**:
  * *Change*: Moved `seeder.js` and `seed_mappings.js` to the `archive/` directory and fully removed their remaining import references from `worker.js`.
  * *Rationale*: The database seeding pipeline is completed and verified. Retaining these scripts in the active directory is no longer necessary.
  * *Files Created*: None
  * *Files Retired*:
    - [seeder.js](build/v2/archive/seeder.js)
    - [seed_mappings.js](build/v2/archive/seed_mappings.js)
  * *Files Changed*:
    - [worker.js](src/worker.js)

---

* **Catastrophic Initial Load Time Fix (Edge Aggregation Removal)**:
  * *Change*: Refactored the core discovery engine to eliminate synchronous `GROUP_CONCAT` aggregations that were counting millions of books on every page load. Added a `count` column to the `Tags` table in `schema.sql`. Created `build/v2/scripts/tag_dump_counts.mjs` to calculate tag frequencies completely offline.
  * *Rationale*: The previous edge architecture was forcing Cloudflare D1 to scan the entire `Works_Tags` junction table every time the homepage was accessed, leading to severe load time timeouts. This shift fully resolves the bottleneck.
  * *Files Created*:
    - [tag_dump_counts.mjs](build/v2/scripts/tag_dump_counts.mjs)
  * *Files Retired*: None
  * *Files Changed*:
    - [schema.sql](src/schema.sql)
    - [engine.js](src/engine.js)

* **Edge Layer In-Memory Cache**:
  * *Change*: Introduced a global cache (`globalTagCounts`) inside the Cloudflare Worker (`worker.js`). The worker now fetches static tag counts once per lifespan and serves them from memory.
  * *Rationale*: Prevents wasteful database reads on static metadata, adhering strictly to the OpenedShelf infrastructure-constrained manifesto.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)

* **Multi-Tag Discovery SQL Optimization**:
  * *Change*: Rewrote the SQL generation in `engine.js` for tag filtering. Replaced the `INTERSECT` operator with correlated `EXISTS` subqueries for multi-tag logic.
  * *Rationale*: While `INTERSECT` enforces set logic, it forces SQLite to fully evaluate and build temporary tables across millions of rows before it can apply pagination. Using `EXISTS` restores SQLite's ability to "stream" the index lookup, dropping query times to milliseconds.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)

* **Count Optimization & Rabbit Hole Ceiling**:
  * *Change*: Injected a strict `LIMIT 1000` into the `buildCountQuery` logic. If a search string hits 0 results, the Rabbit Hole UI progressively counts substring combinations. This ceiling forces SQLite to halt count aggregations at 1,000 matches.
  * *Rationale*: Computing exact intersections across millions of rows takes 30+ seconds. Capping the aggregation preserves the instant discovery experience.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)

### May 27, 2026

* **7-Stage Pipeline Architecture (Hardware Safety & Optimization)**:
  * *Change*: Refactored the monolithic data ingestion scripts into a modular 7-stage pipeline. Moved the massive "Orphan Purge" step before the thematic regex parsing, and integrated offline tag counting into the final step. Added SQLite performance PRAGMAs (`WAL` mode) and orchestrated the entire flow inside `run_pipeline.sh` with hard 5-minute sleep cooldowns between phases.
  * *Rationale*: Prevents the CPU thermal throttling and hardware decoupling caused by Node's single-threaded nature during massive database writes.
  * *Files Created*:
    - [run_pipeline.sh](build/v2/scripts/run_pipeline.sh)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_clean.js](build/v2/scripts/tag_dump_clean.js)
    - [tag_dump_identity.js](build/v2/scripts/tag_dump_identity.js)
    - [tag_dump_meta.js](build/v2/scripts/tag_dump_meta.js)
    - [tag_dump_thematic.js](build/v2/scripts/tag_dump_thematic.js)
    - [tag_dump_trope.js](build/v2/scripts/tag_dump_trope.js)

* **Catastrophic Performance Bug (Missing ISBN Index)**:
  * *Change*: Created an explicit index (`CREATE INDEX IF NOT EXISTS idx_works_isbn ON Works(isbn);`) in the live database, and permanently added it to `src/schema.sql` for future builds.
  * *Rationale*: Stalled cleanup scripts were performing 446,000 unindexed SELECT queries. Indexing resolving duplicate merges immediately.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [schema.sql](src/schema.sql)

* **Cleanup Script Hardware Thermal Throttling**:
  * *Change*: Completely rewrote `clean_data.mjs` to execute updates in `LIMIT/OFFSET` chunks using SQLite's internal `rowid`. Injected strict 5-second `setTimeout` cooldowns between every chunk and every 5,000 deduplications to allow the CPU to spin down safely.
  * *Rationale*: The initial implementation ran massive unchunked updates that pegged the CPU at 100%, causing severe thermal throttling.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [clean_data.mjs](archive/clean_data.mjs)

* **Foreign Key Constraint Aborts During Merging**:
  * *Change*: Wrapped the specific tag `INSERT OR IGNORE` operation inside a `try/catch` block in `clean_data.mjs`.
  * *Rationale*: Resolves a bug where the database rejected invalid orphaned language tags and aborted the entire ISBN merge under strict FK checks.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [clean_data.mjs](archive/clean_data.mjs)

* **Taxonomy Regex Double-Escaping Bug**:
  * *Change*: Corrected the escaping string to `\\b` to represent word boundaries properly. Created a standalone `run_pass3_only.mjs` script to allow running fallback tagging after cleanup without full re-sweeps.
  * *Rationale*: A double-escaping error in regex parsing caused the fallback passes to match exactly 0 tags.
  * *Files Created*:
    - [run_pass3_only.mjs](archive/run_pass3_only.mjs)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump_thematic.js](build/v2/scripts/tag_dump_thematic.js)

* **Book Missing a Tag Feature & Multi-Tag Proposals**:
  * *Change*: Revamped the `/propose` form to allow users to specify a book's Title and ISBN instead of relying strictly on an existing internal `work_id`. The form now features three dynamic dropdowns allowing users to simultaneously propose a Thematic Tag, Genre Identity, and Genre Trope. The Cloudflare Worker (`worker.js`) splits this into up to three separate `Pending_Tags` records.
  * *Rationale*: Dramatically lowers the friction for users trying to tag books that haven't been ingested from OpenLibrary yet.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [propose.js](src/ui/pages/propose.js)
    - [worker.js](src/worker.js)

* **Taxonomy False-Positive Cascade Fix**:
  * *Change*: Refactored the offline taxonomy seeder to support `AND` conjunctions in mapping rules and introduced "Scoped Parents" (an optional 4th tuple parameter in `seed_mappings.js`). Audited and tightened over 40 mapping rules. Updated the Taxonomy Governance Protocol (TGP) with Seed Mapping Best Practices.
  * *Rationale*: Resolves a critical bug where books with titles like "Strategic Fiscal Plans 2001" were being incorrectly tagged as "hard scifi".
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [seed_mappings.js](src/seed_mappings.js)
    - [offline_taxonomy_seeder.mjs](archive/offline_taxonomy_seeder.mjs)
    - [OpenedShelf_TGP.md](OpenedShelf_TGP.md)

* **Hardware Protection & Execution Cooldowns**:
  * *Change*: Implemented explicit CPU/RAM cooldown limits inside `tag_dump.js` and `offline_taxonomy_seeder.mjs`. The scripts now pause for 5 seconds every X-thousand records.
  * *Rationale*: Absolutely necessary to prevent the data ingestion scripts from melting the host machine.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump.js](archive/tag_dump.js)
    - [offline_taxonomy_seeder.mjs](archive/offline_taxonomy_seeder.mjs)

* **4-Pass Tagging Architecture & Drop Logic**:
  * *Change*: Restructured the data ingestion pipeline into a sequential 4-Pass system. `tag_dump.js` no longer prematurely drops books that lack thematic tags. A final DELETE sweep purges truly orphaned books.
  * *Rationale*: The previous logic silently discarded pure non-fiction or heavily genre-focused books if they failed the initial thematic sweep.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump.js](archive/tag_dump.js)
    - [offline_taxonomy_seeder.mjs](archive/offline_taxonomy_seeder.mjs)

* **OpenLibrary Data Update SOP**:
  * *Change*: Created `OpenedShelf_Data_Update_SOP.md`, a comprehensive standard operating procedure documenting the full end-to-end monthly data refresh pipeline.
  * *Rationale*: Codifies the hard-won operational knowledge from the May 25-26 data processing sessions into a repeatable, safe procedure.
  * *Files Created*:
    - [OpenedShelf_Data_Update_SOP.md](OpenedShelf_Data_Update_SOP.md)
  * *Files Retired*: None
  * *Files Changed*: None

* **Taxonomy Mapping Refinements**:
  * *Change*: Refined the `offline_taxonomy_seeder.mjs` mapping logic. Explicit SQL mappings now convert LIKE patterns from `seed_mappings.js` into `INSTR(LOWER(column), LOWER(?))`.
  * *Rationale*: Ensures mapping accuracy by eliminating SQL wildcard mismatches and prevents Node.js V8 heap exhaustion.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [offline_taxonomy_seeder.mjs](archive/offline_taxonomy_seeder.mjs)

### May 26, 2026

* **Cloudflare D1 Search Performance Optimization**:
  * *Change*: Eliminated UI freezing and request hangs during multi-tag filtering by implementing two major performance refactors. First, rewritten `engine.js` query generators now compute the heavy `GROUP_CONCAT` taxonomy subqueries *only* on the paginated ID subset (`LIMIT 50`). Second, `seeder.js` was patched to prevent a 119-statement language tag `db.batch()` from executing unconditionally.
  * *Rationale*: Ensures the core multi-tag discovery engine runs instantaneously on large databases by minimizing synchronous execution load.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [seeder.js](build/v2/archive/seeder.js)

* **OpenLibrary Dump Parsing - Author & ISBN Extraction Fix**:
  * *Change*: Modified `tag_dump.js` Pass 2 to properly extract the `by_statement` (Author) and `isbn_13`/`isbn_10` (ISBN) from the OpenLibrary edition records. Expanded the `SUBJECT_TAG_MAP` to capture additional subject tags.
  * *Rationale*: The previous iteration of the OpenLibrary ingestion script hardcoded 'Unknown' for authors and skipped ISBNs entirely.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump.js](archive/tag_dump.js)

* **Failsafe OpenLibrary External Links**:
  * *Change*: Updated the "View on Open Library" link in `src/ui/layout.js` to dynamically fall back to the generic Work URL if an ISBN is missing or marked 'Unknown ISBN'.
  * *Rationale*: Prevents broken external links for books that lack valid edition metadata.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [layout.js](src/ui/layout.js)

### May 25, 2026

* **Library Council Infrastructure & Transparency**:
  * *Change*: Drafted the Library Council manifesto and rules for community-curated tagging. Added the manifesto to the Verification Queue (`verify.js`) to provide reviewers with clear guidelines. Updated the About page (`about.js`) to include a "Data Transparency & Update Schedule". Added a global attribution to Open Library in the site footer (`layout.js`).
  * *Rationale*: Formalizes the crowdsourced tagging process, provides clear update cadences, and properly attributes data sources.
  * *Files Created*:
    - [Library_Council_Draft.md](Library_Council_Draft.md)
  * *Files Retired*: None
  * *Files Changed*:
    - [verify.js](src/ui/pages/verify.js)
    - [about.js](src/ui/pages/about.js)
    - [layout.js](src/ui/layout.js)

* **Save My Shelf (Anonymous Cloud Sync)**:
  * *Change*: Implemented a privacy-first shelf saving feature using `localStorage` for primary retention and Cloudflare KV (`SHELVES` namespace) for anonymous cross-device synchronization. Added a "Download Library Card" JSON export feature. Added sync and load endpoints in `worker.js`.
  * *Rationale*: Aligns with the Data-Conscious Reader manifesto pillar by allowing cross-device persistence without requiring user accounts or tracking.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)
    - [myshelf.js](src/ui/pages/myshelf.js)

* **Language Tagging Integration**:
  * *Change*: Integrated ISO-639 language tracking into the tagging system. Added `tags_language.js` to decouple language metadata. Updated `tag_dump.js` to convert language metadata natively into `lang:XXX` tags. Enhanced the UI with a dynamically sorted language dropdown.
  * *Rationale*: Allows users to filter works by language without polluting the thematic tagging namespaces.
  * *Files Created*:
    - [tags_language.js](src/tags_language.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump.js](archive/tag_dump.js)
    - [templates.js](src/templates.js)

* **Memory-Optimized Two-Pass Data Ingestion**:
  * *Change*: Rewrote the `tag_dump.js` script to process the massive 17GB OpenLibrary data dump in two passes.
  * *Rationale*: Prevents the Cloudflare D1 database from ballooning with tens of millions of "orphaned" language tags.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tag_dump.js](archive/tag_dump.js)

* **Repository Audit & Dead Code Cleanup**:
  * *Change*: Conducted a comprehensive file audit across the repository. Archived obsolete legacy code, outdated SQL seeders, root configuration files, and temporary scratch scripts into a dedicated `archive/` folder.
  * *Rationale*: Streamlines the repository structure and clarifies the separation between current production components and future roadmap scaffolding.
  * *Files Created*: None
  * *Files Retired*:
    - Root configuration and legacy scripts archived to [archive](archive/)
  * *Files Changed*: Various project file locations.

* **Offline Regex Taxonomy Auto-Seeding**:
  * *Change*: Fully decoupled the heavy regex taxonomy mapping from the Cloudflare Worker boot sequence by creating a standalone `build/v2/scripts/offline_taxonomy_seeder.mjs` script. Removed the aborted mapping logic from `src/seeder.js`.
  * *Rationale*: Prevents the Cloudflare Worker from freezing during database seed.
  * *Files Created*:
    - [offline_taxonomy_seeder.mjs](archive/offline_taxonomy_seeder.mjs)
  * *Files Retired*: None
  * *Files Changed*:
    - [seeder.js](build/v2/archive/seeder.js)

### May 24, 2026

* **Fuzzy Fallback for Rabbit Hole Discoveries**:
  * *Change*: Implemented a "Fuzzy Fall" secondary discovery layer on the Rabbit Hole (0-results) screen. The system now utilizes the step-by-step query progression tracker to identify the last successful search query before results collapsed, using it to display up to 5 alternative books.
  * *Rationale*: Enhances the Rabbit Hole experience by rewarding users who reached the end of the catalog.
  * *Files Created*:
    - [fuzzy_fall_quizzical.png](build/v2/public/fuzzy_fall_quizzical.png)
  * *Files Retired*: None
  * *Files Changed*:
    - [home.js](src/ui/pages/home.js)
    - [worker.js](src/worker.js)

* **Mobile Responsiveness & Dynamic Layout**:
  * *Change*: Refactored the dashboard and search layouts for mobile screens (< 800px).
  * *Rationale*: Dramatically improves the mobile UX by eliminating flex-box overflow.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [styles.js](src/ui/styles.js)
    - [layout.js](src/ui/layout.js)

* **Open Source Licensing (AGPLv3)**:
  * *Change*: Officially licensed the OpenedShelf project under the GNU Affero General Public License v3 (AGPLv3) by adding a `LICENSE.md` file to the repository root.
  * *Rationale*: Protects the platform's core ethos.
  * *Files Created*:
    - [LICENSE.md](LICENSE.md)
  * *Files Retired*: None
  * *Files Changed*: None

* **Repository Restructuring for Dual Deployment**:
  * *Change*: Split the project into two independent Cloudflare Worker deployments. The root directory now hosts a standalone landing page, while the core beta application, database bindings, and API were relocated to `build/v2/`.
  * *Rationale*: Decouples the production pre-launch page from the beta app's database dependencies.
  * *Files Created*:
    - [package.json](build/v2/package.json)
    - [wrangler.jsonc](build/v2/wrangler.jsonc)
  * *Files Retired*: None
  * *Files Changed*:
    - Moved all beta/v2 files into [build/v2](build/v2/)

### May 23, 2026

* **Pre-Beta Route Additions**:
  * *Change*: Created a new `/coming-soon` route and template (`src/ui/pages/coming_soon.js`), and added the official contact email to the global footer layout.
  * *Rationale*: Prepares the platform for public visibility.
  * *Files Created*:
    - [coming_soon.js](src/ui/pages/coming_soon.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [layout.js](src/ui/layout.js)

* **Project Rename to OpenedShelf**:
  * *Change*: Renamed the project from "OpenShelf" to "OpenedShelf" across the entire codebase.
  * *Rationale*: The original name "OpenShelf" had domain name collisions with existing entities.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [wrangler.jsonc](build/v2/wrangler.jsonc)
    - [OpenedShelf_changelog.md](OpenedShelf_changelog.md)

* **Thematic Tag UI State Persistence**:
  * *Change*: Implemented state-persistence for sidebar dropdowns by dynamically adding the `open` attribute to `<details>` elements based on active tag selection.
  * *Rationale*: Improves user experience by keeping relevant parent categories expanded after a tag is selected.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [home.js](src/ui/pages/home.js)

* **Genre Trope Database Stress Testing**:
  * *Change*: Developed `build/v2/scripts/force_seed_all_tags.js` to populate the database with all 877 taxonomy tags and generate 100% tag coverage mock books.
  * *Rationale*: Ensures system stability and performance when stress testing.
  * *Files Created*:
    - [force_seed_all_tags.js](archive/force_seed_all_tags.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Database Seeder Refinements for Tag Generation**:
  * *Change*: Refactored the `src/seeder.js` mapping pipeline to use in-memory regex parsing for fallback tag generation.
  * *Rationale*: fetches all synopses into memory with one query and evaluates them using JavaScript `\b` word boundary regexes.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [seeder.js](build/v2/archive/seeder.js)
    - [seed_mappings.js](src/seed_mappings.js)

* **Book Card UI Refinements**:
  * *Change*: Re-designed the book card layout. Moved the "Save to My Shelf" button into the header inline with the book's metadata and converted the static synopsis text into an expandable accordion.
  * *Rationale*: Dramatically cleans up the visual hierarchy.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [templates.js](src/templates.js)

* **Submit Tag UI Updates**:
  * *Change*: Added informational sections to the `/propose` (Submit a Tag) page detailing the tag approval process.
  * *Rationale*: Improves transparency and manages user expectations.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [propose.js](src/ui/pages/propose.js)

* **Archived Unused Adapter File**:
  * *Change*: Moved the unused `src/adapter.js` to the `archive/` directory.
  * *Rationale*: The file was dead code not imported or used anywhere.
  * *Files Created*: None
  * *Files Retired*:
    - [adapter.js](archive/adapter.js)
  * *Files Changed*: None

### May 22, 2026

* **Repository Clean-up and Archiving**:
  * *Change*: Created a top-level `archive/` directory, moved obsolete/redundant utility files there, and organized remaining active configuration files.
  * *Rationale*: Cleared clutter from the project root and scripts directory.
  * *Files Created*: None
  * *Files Retired*:
    - [split_tags.js](archive/split_tags.js)
    - [split.mjs](archive/split.mjs)
    - [rewrite_home.py](archive/rewrite_home.py)
    - [rewrite_templates.py](archive/rewrite_templates.py)
    - [theme_trope_map.json](archive/theme_trope_map.json)
    - [bulk_seed.sql](archive/bulk_seed.sql)
    - [seed_actual_genres.sql](archive/seed_actual_genres.sql)
  * *Files Changed*:
    - [schema.sql](src/schema.sql) (moved to `src/schema.sql`)

* **UI Code Modularization**:
  * *Change*: Refactored the monolithic 1,200-line `src/templates.js` file into a modular `src/ui/` structure (Page-Based Separation).
  * *Rationale*: The file was acting as a CSS stylesheet, layout engine, URL builder, and page router all at once.
  * *Files Created*:
    - [styles.js](src/ui/styles.js)
    - [layout.js](src/ui/layout.js)
    - [home.js](src/ui/pages/home.js)
    - [about.js](src/ui/pages/about.js)
    - [myshelf.js](src/ui/pages/myshelf.js)
    - [propose.js](src/ui/pages/propose.js)
    - [verify.js](src/ui/pages/verify.js)
  * *Files Retired*: None
  * *Files Changed*:
    - [templates.js](src/templates.js) (preserved as barrel)

* **About Page Font Readability**:
  * *Change*: Updated the body text font family on the "About" page from serif to sans-serif.
  * *Rationale*: Shifted long-form body copy to sans-serif to reduce cognitive load on low-bandwidth screens.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [styles.js](src/ui/styles.js)

* **Tagging Taxonomy UI Renaming**:
  * *Change*: Replaced technical, database-centric labels in the sidebar, `/propose` form, and `/about` page with action-oriented, intuitive phrases.
  * *Rationale*: Guides the user through a clear top-down exploration pipeline.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [home.js](src/ui/pages/home.js)
    - [propose.js](src/ui/pages/propose.js)
    - [about.js](src/ui/pages/about.js)

* **Sidebar State Auto-Expansion & Highlight Styling**:
  * *Change*: Resolved the sidebar filter state limitation and added active selection indicators.
  * *Rationale*: Child tags direct selections now automatically resolve to parents to prevent panel collapses.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [templates.js](src/templates.js)

* **Restoration of Strict AND (Set-Intersection) Tag Filtering with URL/UI Decoupling**:
  * *Change*: Restored Boolean set-intersection ("AND" logic) for multi-tag filtering in the discovery engine, while simultaneously decoupling the UI sidebar expansion state from active URL query parameters.
  * *Rationale*: Broad OR searches caused tag inflation and lack of discovery focus, but previous AND forced parent queries to clash. UI/engine decoupling resolves both.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [engine.js](src/engine.js)
    - [url.js](src/utils/url.js)
    - [home.js](src/ui/pages/home.js)

* **Taxonomy Updates & Database Sync**:
  * *Change*: Patched the taxonomy mapping system and aligned database seeds.
  * *Rationale*: Restores correctness of database seed lists and schema constraints check tiers.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [tags_genre_identity.js](src/tags_genre_identity.js)
    - [schema.sql](src/schema.sql)

* **Architecture & Documentation**:
  * *Change*: Refreshed architecture and reader documentation.
  * *Rationale*: Aligns docs with three-tier layout and correct query prefixes.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [OpenedShelf_tagging_redesign.md](OpenedShelf_tagging_redesign.md)
    - [OpenedShelf_architecture_map_v2.md](OpenedShelf_architecture_map_v2.md)
    - [OpenedShelf_discovery.md](OpenedShelf_discovery.md)
    - [OpenedShelf_reader.md](OpenedShelf_reader.md)
    - [OpenedShelf_TGP.md](OpenedShelf_TGP.md)

* **Testing & Verification Scripts**:
  * *Change*: Added automated test harnesses.
  * *Rationale*: Mocks worker endpoints, tag checks, and database validation offline without relying on sandboxed network calls.
  * *Files Created*:
    - [verify_worker.mjs](archive/scratch/verify_worker.mjs)
    - [check_sidebar.mjs](archive/scratch/check_sidebar.mjs)
    - [verify_taxonomy_tiers.mjs](archive/scratch/verify_taxonomy_tiers.mjs)
  * *Files Retired*: None
  * *Files Changed*: None

* **Natural Language Dictionary Mapping**:
  * *Change*: Created `src/dictionary.js` to map subjective reader feelings to objective taxonomy tags.
  * *Rationale*: Enhances search by providing smart tag suggestions based on user-friendly terms.
  * *Files Created*:
    - [dictionary.js](src/dictionary.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Greedy Multi-Word Search Matching**:
  * *Change*: Implemented token parsing in `src/search_utils.js` that combines consecutive words (up to 4) into single tags and auto-prefixes missing `genre:` tags.
  * *Rationale*: Allows users to simply type raw multi-word phrases and automatically resolve them.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*:
    - [search_utils.js](src/search_utils.js)

### May 20, 2026

* **Database & Seeding Setup**:
  * *Change*: Initialized local databases and implemented mock data generation scripts and bulk seed SQL files.
  * *Rationale*: Bootstrap development dataset seed pipelines.
  * *Files Created*:
    - [generate_mock_seed.js](archive/generate_mock_seed.js)
    - [load_library.js](archive/load_library.js)
    - [bulk_seed.sql](archive/bulk_seed.sql)
    - [full_seed.sql](archive/full_seed.sql)
  * *Files Retired*: None
  * *Files Changed*: None

* **OpenLibrary Metadata Adapter**:
  * *Change*: Implemented `src/adapter.js` to fetch book metadata and synopses.
  * *Rationale*: Connect to downstream datasets for details enrichment.
  * *Files Created*:
    - [adapter.js](archive/adapter.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Tag Split Implementation**:
  * *Change*: Added scripts for splitting and parsing tags.
  * *Rationale*: Automate parsing logic for text formatting.
  * *Files Created*:
    - [split.mjs](archive/split.mjs)
    - [split_tags.js](archive/split_tags.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Tag Categorization Structure**:
  * *Change*: Initial setup of thematic tags and genre tropes logic.
  * *Rationale*: Provide core tagging code base.
  * *Files Created*:
    - [tags_thematic.js](src/tags_thematic.js)
    - [tags_genre_tropes.js](src/tags_genre_tropes.js)
    - [tags.js](src/tags.js)
    - [seeder.js](build/v2/archive/seeder.js)
  * *Files Retired*: None
  * *Files Changed*: None

* **Project Task Tracking**:
  * *Change*: Updated internal project task tracking and operational backlog.
  * *Rationale*: Maintain roadmap tracking and milestone planning.
  * *Files Created*: None
  * *Files Retired*: None
  * *Files Changed*: None (Internal task tracking)

### May 17, 2026

* **Rabbit Hole Empty State**:
  * *Change*: Added graphic assets and logic for the "Rabbit Hole" state.
  * *Rationale*: Handles strict intersection searches returning zero results.
  * *Files Created*:
    - [rabbithole.png](build/v2/public/rabbithole.png)
  * *Files Retired*: None
  * *Files Changed*:
    - [worker.js](src/worker.js)
    - [home.js](src/ui/pages/home.js)

### May 16, 2026

* **OpenedShelf Manifesto Drafted**:
  * *Change*: Created `OpenedShelf_manifesto.md` outlining the core mission and target demographics.
  * *Rationale*: Establishes four main reader categories to govern app decisions.
  * *Files Created*:
    - [OpenedShelf_manifesto.md](OpenedShelf_manifesto.md)
  * *Files Retired*: None
  * *Files Changed*: None


---

#### 1. Implementing Decoupled Set-Intersection (AND) Tag Search & UI Auto-Expansion

##### The Core Problem
Initially, search tag filters operated under strict set-intersection (Boolean "AND"). If a user searched for `genre:mystery` and `isolated`, they only wanted books matching BOTH tags. However, if a user clicked a thematic tag like `heist`, the system auto-injected all parent genres mapped to it (`genre:dystopian`, `genre:true_crime`, `genre:mystery`) into the query parameters. Under strict AND logic, this forced a search to match all of those genres simultaneously (which is impossible, since a single book does not belong to all three distinct genres), resulting in false "Rabbit Holes" (0 results). 

To attempt to fix this, tag filtering was temporarily changed to broad union ("OR"). However, this caused detailed search terms to return too many results, failing to narrow down (e.g. searching `genre:history` plus multiple subcategories/tropes returned 244 broad results instead of narrowing down or rabbit-holing).

##### The Solution (Decoupled Balance)
We reverted the database discovery engine back to strict set-intersection (**AND**) logic using SQL aggregation, while decoupling it from UI state:

1. **Strict SQL AND Generation**:
   We updated `buildDiscoveryQuery` inside [engine.js](src/engine.js) to re-introduce the `HAVING COUNT(DISTINCT t.name) = N` constraint, where `N` matches the number of unique tags queried.
   ```sql
   SELECT w.id, w.title, w.author, w.isbn, w.short_synopsis,
          (SELECT GROUP_CONCAT(t2.name, ',') FROM Works_Tags wt2 JOIN Tags t2 ON wt2.tag_id = t2.id WHERE wt2.work_id = w.id) as tags
   FROM Works w
   JOIN Works_Tags wt ON w.id = wt.work_id
   JOIN Tags t ON wt.tag_id = t.id
   WHERE t.name IN ('genre:mystery', 'isolated')
   GROUP BY w.id
   HAVING COUNT(DISTINCT t.name) = 2;
   ```

2. **Negation Filters (Strict Exclusion)**:
   Negation works cleanly on top of this by wrapping the SQL query in a subquery select block and excluding works containing any negative tags (`-tag_name`):
   ```sql
   SELECT id, title, author, isbn, short_synopsis, tags 
   FROM (
       SELECT w.id, w.title, w.author, w.isbn, w.short_synopsis, 
              (SELECT GROUP_CONCAT(t2.name, ',') FROM Works_Tags wt2 JOIN Tags t2 ON wt2.tag_id = t2.id WHERE wt2.work_id = w.id) as tags 
       FROM Works w 
       JOIN Works_Tags wt ON w.id = wt.work_id 
       JOIN Tags t ON wt.tag_id = t.id 
       WHERE t.name IN ('genre:mystery', 'isolated') 
       GROUP BY w.id
       HAVING COUNT(DISTINCT t.name) = 2
   ) AS included 
   WHERE id NOT IN (
       SELECT wt.work_id 
       FROM Works_Tags wt 
       JOIN Tags t ON wt.tag_id = t.id 
       WHERE t.name IN ('genre:romance')
   );
   ```

3. **URL Cleanliness**:
   We refactored `buildToggleUrl` in [url.js](src/utils/url.js) to toggle only the targeted tag without appending mapped parent genres. URLs are kept clean (e.g. `?q=heist`), avoiding query collision in the database.

4. **Dynamic UI Sidebar Auto-Expansion**:
   Instead of using the database parameters to drive sidebar expansion, we resolve parent mappings on the fly in the rendering layout:
   In [home.js](src/ui/pages/home.js), during template compilation, we map the active search query tags. If any active tag is a child tag (e.g. `genre:hard_scifi`) or thematic tag mapped to standard genres in `THEME_TROPE_MAP` (e.g. `heist` maps to `genre:mystery`, etc.), we dynamically append those standard genres to `activeGenres` for visual rendering. This keeps the relevant sidebar categories and tropes expanded in the UI, while keeping the SQL search parameters clean and precise.

---

#### 2. Resolving Sidebar State Collapses via Pre-Compiled Hierarchy Mappings

##### The Core Problem
The OpenedShelf sidebar groups options progressively. The "Dig Deeper: Categories" (Tier 2) and "Narrow it Down: Tropes/Devices" (Tier 3) sections are contextual; they only appear when their parent standard genre (Tier 1) is active.
Previously, this check was performed by inspecting the parsed `includeTags` array:
```javascript
const activeGenres = new Set(includeTags.filter(t => t.startsWith('genre:')));
```
However, if a user clicked a specific category or trope directly (such as `genre:hard_scifi` or `genre:generation_ship`), only that specific child tag was added to `includeTags`. The parent genre (`genre:science_fiction`) was not present in the query string. Consequently, `activeGenres` did not contain the parent genre, causing the templates to collapse the Sci-Fi categories and tropes panels immediately, leaving the user with no visual sidebar context.

##### The Solution
We implemented a pre-compiled mapping inside [templates.js](src/templates.js) called `childToParentGenre`. At module-load time, the code traverses the static `GENRE_IDENTITY` and `GENRE_TROPES` configurations to map all children to their parent tags:
```javascript
const childToParentGenre = {};
for (const [key, data] of Object.entries(GENRE_IDENTITY)) {
    if (data.parentTag && data.tags) {
        for (const tag of data.tags) {
            if (!childToParentGenre[tag]) childToParentGenre[tag] = [];
            if (!childToParentGenre[tag].includes(data.parentTag)) {
                childToParentGenre[tag].push(data.parentTag);
            }
        }
    }
}
```
During rendering inside `renderHome`, the system evaluates each active search tag. If a tag is found in `childToParentGenre`, its parent genres are added to the active set:
```javascript
const activeGenres = new Set(includeTags.filter(t => t.startsWith('genre:')));
for (const tag of includeTags) {
    if (childToParentGenre[tag]) {
        for (const parent of childToParentGenre[tag]) {
            activeGenres.add(parent);
        }
    }
}
```
This guarantees that selecting `genre:hard_scifi` automatically marks `genre:science_fiction` as active in the template context, maintaining the expanded view of the Sci-Fi sub-panels.

---

#### 3. Database Schema and Seeding Prefixes Synchronization

##### The Core Problem
The Cloudflare D1 SQL schema defined in [schema.sql](src/schema.sql) enforces CHECK constraints on tag tiers:
```sql
CREATE TABLE IF NOT EXISTS Tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tier TEXT CHECK( tier IN ('thematic', 'genre_identity', 'genre_trope') ) NOT NULL,
    scope TEXT
);
```
However, during seeding, some scripts did not prepend the required `genre:` namespace to Tier 2 (`genre_identity`) and Tier 3 (`genre_trope`) tags, causing mismatches. In other cases, tags were inserted with invalid tiers, triggering SQL CHECK constraint violations and aborting the seed execution.

##### The Solution
1. **Namespace Standardization**: Standardized all Tier 2 and Tier 3 tag identifiers in [tags_genre_identity.js](src/tags_genre_identity.js) and [tags_genre_tropes.js](src/tags_genre_tropes.js) to consistently utilize the `genre:` prefix (e.g., `genre:gothic`, `genre:cosmic`).
2. **Crash Mitigation in Lookup Functions**: Patched `getAllGenreIdentityTags` in [tags_genre_identity.js](src/tags_genre_identity.js):
   * *Old (crashed)*: `Object.values(GENRE_IDENTITY).flatMap(g => g.identityTags)`
   * *New (fixed)*: `Object.values(GENRE_IDENTITY).flatMap(g => g.tags)`
3. **Database Integrity Verification**: Validated that all 877 taxonomy terms conform to the schema constraints. The local SQL seeds are verified to successfully map and insert these prefixed tag items without constraint errors.

---

#### 4. Automated Verification Pipelines

To ensure logic integrity without relying on external curl loopback requests, we created custom script runners:

* **Worker Endpoints (`scratch/verify_worker.mjs`)**:
  * Loads the Node.js experimental `sqlite` module to directly open the miniflare D1 sqlite file.
  * Mocks the worker environment `env.DB` bindings.
  * Asserts route logic, testing home rendering, multi-select search execution, proposals storage, and proposal approvals.
* **Sidebar Templates (`scratch/check_sidebar.mjs`)**:
  * Simulates search requests for granular interest tags (e.g., `genre:traditional`).
  * Asserts that the template output correctly dynamically maps and expands the parent panels.
