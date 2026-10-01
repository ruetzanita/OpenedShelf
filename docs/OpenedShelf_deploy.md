# OpenedShelf: The "Escape Hatch" Deployment Guide

## Philosophy
OpenedShelf is currently deployed via edge infrastructure for maximum efficiency and global reach. However, true open-source software cannot be held hostage by its hosting provider. If our edge provider changes their terms, or if you simply want to run a completely private, localized instance, this guide explains how to spin up the core engine on any machine.

*Note on Licensing:* OpenedShelf is licensed under the **AGPLv3**. This ensures that if you modify and host the platform publicly as a network service, you must share your source code with the community. This explicitly protects the project from being enclosed by proprietary tech monopolies while keeping it completely free for self-hosting.

## Prerequisites
Because the architecture is intentionally lightweight, you only need a basic terminal environment:
* Python 3.10+
* SQLite3
* Bash

## 1. Local Database Initialization
The production D1 database is built on SQLite. To migrate or build locally, export the D1 schema and instantiate it using standard terminal commands:

```bash
# Initialize the local instance schema
cd build/v2
sqlite3 openedshelf_local.db < src/schema.sql

# If importing community data (CC0 public domain dump)
sqlite3 openedshelf_local.db < latest_taxonomy_dump.sql
```

## 2. Generating Live Data (OpenLibrary Ingest)
If you want to pull fresh, live book metadata rather than relying on a static dump, you can run the built-in 8-stage offline ingestion pipeline. This orchestrator processes the massive OpenLibrary data dump, auto-assigns tags according to the local taxonomy, and generates the SQLite catalog database.

```bash
# Ensure Node is installed
# Make sure ol_dump_latest.txt.gz exists in the project root directory
build/v2/scripts/run_pipeline.sh

# The script will completely generate the local openedshelf_master.sqlite database in the db/ folder.
```

## 3. Running the Self-Hosted Query Service

The catalog database (~24 GB SQLite artifact) is served by the lightweight read-only query service (`query-service/server.mjs`). You can run it locally or on your own VPS/container:

```bash
# Start the read-only SQLite search service locally
R2_DATABASE_PATH=db/openedshelf_db_08_2026.sqlite PORT=8788 node query-service/server.mjs
```

The self-hosted service provides:
* `GET /tag-counts` (or `/api/tag-counts`): Pre-computed tag distribution counts.
* `POST /search` (or `/api/search`): Exact Boolean tag intersection discovery engine.
* `GET /credits` (or `/api/credits`): Machine-readable open data provenance and legal metadata.

### Publishing Catalog Artifacts to Cloudflare R2 (Optional)
If deploying alongside Cloudflare Workers, publish the read-only SQLite artifact to an R2 bucket:

```bash
build/v2/scripts/publish_r2_database.sh openedshelf-search-database db/openedshelf_db_08_2026.sqlite
```

Configure your Worker with `SEARCH_API_URL` pointing to your query service instance and provide the matching `SEARCH_API_TOKEN` if authentication is configured.

## 4. Deploying Moderation Data to Cloudflare D1
The D1 deployment is now limited to moderation data and `Pending_Tags`. Public catalog search is served by the query service described above. If D1 remains the selected catalog backend for a transitional deployment, use the standalone deployment tool:

```bash
# Run standalone post-pipeline deployment
build/v2/scripts/deploy_d1.sh [d1_database_binding]
```

This automated script strips raw offline staging text (`ol_subjects`, `ol_genres`) to save ~8-10 GB, generates 15 MB transaction-wrapped SQL chunks (`chunk_0001.sql`), uploads them via `npx wrangler d1 execute`, and preserves community `Pending_Tags` proposals.