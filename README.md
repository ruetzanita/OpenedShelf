# OpenedShelf 🐇📚
*Open → Discovery → The Rabbit Hole*

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE.md)
[![Taxonomy: CC0-1.0](https://img.shields.io/badge/Taxonomy-CC0_1.0-lightgrey.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Runtime: Cloudflare Workers](https://img.shields.io/badge/Edge-Cloudflare_Workers-orange.svg)](https://workers.cloudflare.com/)
[![Catalog: 41.7M Works](https://img.shields.io/badge/Catalog-41.7M_Works-green.svg)](https://www.openedshelf.org)

**OpenedShelf** is a Boolean book discovery engine and public-domain narrative taxonomy mapping over **41.7 million works**. It is engineered from first principles using set theory, Boolean intersection, and radical data privacy—eliminating algorithmic engagement loops, commercial popularity bias, and tracking cookies.

🌐 **Live Website**: [https://www.openedshelf.org](https://www.openedshelf.org)

---

## 💡 Why OpenedShelf Exists

Most modern book discovery platforms are optimized to sell units rather than facilitate curiosity:
- **Commercial Bias**: Recommendation feeds prioritize bestsellers, sponsored placements, and algorithmic popularity loops.
- **Fuzzy Vector Hallucinations**: Semantic AI search tools guess what a book "feels like" rather than matching what a book *actually contains*.
- **Data Extravagance**: Heavy JavaScript single-page apps (SPAs) track user clicks and demand high bandwidth, excluding readers on metered connections.

**OpenedShelf operates on set theory:**  
*"OpenedShelf does not map how a book feels; it maps what a book is."*

### Who OpenedShelf Serves:
1. **The Infrastructure-Constrained Reader**: Served by a low-bandwidth, brutally efficient edge architecture with server-rendered HTML and sub-50ms Time-to-First-Byte (TTFB).
2. **The Hyper-Specific Discoverer**: Readers who want to stack exact narrative facts (e.g., `genre:space_opera` + `resource_scarcity` + `isolated` + `first_person_pov`) and receive mathematically precise intersections.
3. **The Algorithmically Marginalized**: Readers seeking indie authors, #OwnVoices titles, and specific cultural narratives that corporate recommendation loops bury beneath commercial bestsellers.
4. **The Privacy-Conscious Reader**: Readers who believe that browsing a library should be private, untracked, and free of behavioral profiling.

---

## ✨ Key Features

### 1. Strict Boolean AND / NOT Intersections
Stacking search tags applies strict Boolean set intersection. Tagging `genre:cozy_fantasy` and `found_family` returns only books that possess both narrative properties. Excluding tags (e.g., `-genre:romance`) mathematically filters out unwanted elements.

### 2. "The Rabbit Hole" (Zero-Result Discovery)
When deep, multi-tag queries yield 0 results, OpenedShelf treats that zero-state as a discovery in itself:
- Visualizes the step-by-step query progression to show where the intersection collapsed.
- Offers a **"Fuzzy Fall: One Step Back"** breadcrumb highlighting titles matching the closest successful sub-query.
- Confirms whether a conceptual intersection is simply an unwritten or untagged literary gap.

### 3. Three-Tier Controlled Taxonomy
Our taxonomy is split into three disciplined, standardized tiers:
* **Tier 1 — Thematic Tags**: Objective, narrative, or stylistic facts (`isolated`, `unreliable_narrator`, `epistolary`, `resource_scarcity`).
* **Tier 2 — Genre Identities**: Core literary classifications (`genre:space_opera`, `genre:cozy_mystery`, `genre:hard_scifi`).
* **Tier 3 — Genre Tropes**: Verifiable narrative devices and conventions (`genre:locked_room`, `genre:enemies_to_lovers`, `genre:generation_ship`).

### 4. Democratic Community Governance (The Library Council)
Tag curation and taxonomy expansion are governed democratically by the [Library Council](Library%20Council%20-%20Welcome/00_START_HERE_WELCOME_PACK.md), a global body of librarians, authors, and readers. Every single veto is accompanied by a transparent written rationale.

---

## 🏛️ System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │             Cloudflare Edge             │
                  │   (src/worker.js + src/ui/ + public/)   │
                  │        • Sub-50ms Server-Side HTML      │
                  │        • Static Asset Caching           │
                  │        • WAF & Edge Rate Limiting       │
                  └────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 ┌─────────────────────┐               ┌─────────────────────┐
 │    Cloudflare D1    │               │  Dedicated Host VPS │
 │   (openedshelf_master)              │   (query-service/)  │
 │ • Tag Proposals     │               │ • Node 22 Service   │
 │ • Moderation Queue  │               │ • Worker Thread Pool│
 │ • Council Voting    │               │ • 25GB SQLite Index │
 └─────────────────────┘               └─────────────────────┘
```

* **Frontend & Edge Worker (`src/`)**: Pure server-side rendered vanilla JS modules running on Cloudflare Workers. Zero client-side JS runtime dependencies.
* **Search Engine Core (`src/engine.js`)**: Evaluates multi-tag queries with rarity-sorted chained joins, resolving deep queries across 155M relationships in under 100ms.
* **Query Service Microservice (`query-service/`)**: Production multi-threaded Node.js service managing memory-mapped read-only SQLite connections, LRU caching, and graceful worker failover.
* **Infrastructure as Code (`cloudflare/`)**: Terraform rulesets for Cloudflare WAF rate limiting and bot defense.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 22+ (LTS)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/ruetzanita/OpenedShelf.git
cd OpenedShelf
npm install
```

### 2. Run Test Suite
OpenedShelf includes pre-flight database integrity tests, Boolean intersection validation, query pool resilience tests, and Cloudflare Worker edge simulations:
```bash
npm test
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:8787](http://localhost:8787) in your browser.

---

## 📂 Repository Structure

```
OpenedShelf/
├── src/                      # Core Cloudflare Worker & UI modules
│   ├── worker.js             # Edge worker router & request pipeline
│   ├── engine.js             # Canonical SQL search & query generator
│   ├── search_utils.js       # Search token parser and tokenizer
│   ├── tags_*.js             # Controlled taxonomy & trope definitions
│   └── ui/                   # Server-rendered HTML templates & CSS design system
├── query-service/            # High-throughput Node.js query microservice
│   ├── server.mjs            # HTTP server, health checks, & LRU cache
│   ├── pool.mjs              # Multi-threaded worker pool coordinator
│   ├── worker_thread.mjs     # SQLite query evaluation thread
│   ├── Dockerfile            # Containerized deployment manifest
│   └── openedshelf-query.service # Systemd service unit configuration
├── cloudflare/               # Edge infrastructure as code
│   ├── rulesets.tf           # Terraform Cloudflare WAF & cache configuration
│   └── waf_rate_limits.json  # WAF rate limiting rules & bot defenses
├── docs/                     # Architecture maps, specs, and deploy SOPs
├── Library Council - Welcome/# Governance bylaws, onboarding packs, & veto rubrics
├── public/                   # Static assets, mascot illustrations, robots.txt, sitemap
├── scripts/                  # Data ingestion, indexing, and taxonomy maintenance tools
├── tests/                    # Pre-flight integrity, resilience, and edge test suite
├── CHANGELOG.md              # Public engineering release changelog
├── LICENSE.md                # GNU Affero General Public License v3 (AGPL-3.0)
└── wrangler.jsonc            # Cloudflare Worker deployment configuration
```

---

## 📜 Licensing & Open Data Attributions

OpenedShelf is built on the philosophy of open culture and computational transparency:

1. **Software Engine**: Licensed under the **[GNU Affero General Public License v3 (AGPL-3.0)](LICENSE.md)**.
2. **Taxonomy & Mappings**: Dedicated to the public domain under **[Creative Commons Zero v1.0 Universal (CC0 1.0)](https://creativecommons.org/publicdomain/zero/1.0/)**.
3. **Data Sources**:
   - **[Open Library](https://openlibrary.org)** (Internet Archive): CC0 1.0 catalog metadata and edition records.
   - **[Library of Congress](https://data.labs.loc.gov)**: U.S. Public Domain (17 U.S.C. § 105) bibliographic data, MARC 520 summaries, and BIBFRAME Hubs.
   - **[Wikidata](https://www.wikidata.org)**: CC0 1.0 structured conceptual entities.
   - **[Project Gutenberg](https://www.gutenberg.org)**: Public domain literary metadata. *(Notice: Project Gutenberg™ is a registered trademark of the Project Gutenberg Literary Archive Foundation and does not endorse or promote OpenedShelf).*

For detailed attribution and license compliance guidelines, see [docs/DATA_LICENSES_AND_ATTRIBUTION.md](docs/DATA_LICENSES_AND_ATTRIBUTION.md).

---

## 🤝 Community & Governance

Interested in helping curate the world's open literary taxonomy?  
Read the [Library Council Charter & Welcome Pack](Library%20Council%20-%20Welcome/00_START_HERE_WELCOME_PACK.md) or explore our [Taxonomy Governance Protocol](docs/OpenedShelf_TGP.md).
