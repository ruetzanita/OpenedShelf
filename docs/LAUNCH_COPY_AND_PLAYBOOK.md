# OpenedShelf: Complete Public Launch Copy & Creator Playbook

> **Target Platform:** Hacker News ("Show HN"), Lobste.rs, Social Channels, and Direct Community Drops  
> **Launch Window:** Tuesday / Wednesday at 08:00 AM EDT (12:00 UTC)  
> **Live Site:** [https://openedshelf.org](https://openedshelf.org)  
> **Repository:** [https://github.com/openedshelf/openedshelf](https://github.com/openedshelf/openedshelf) (AGPLv3)  
> **Taxonomy & Data:** CC0 1.0 Universal Public Domain  

---

## Part 1: Hacker News ("Show HN") Submission

### 1.1 Submission Title Options

* **Primary (Recommended):**
  > `Show HN: OpenedShelf – A Boolean book discovery engine with a community taxonomy`

* **Alternative A (Narrative Hook):**
  > `Show HN: OpenedShelf – I built a Boolean book discovery engine after reading 1913`

* **Alternative B (Technical & Anti-Monopoly Focus):**
  > `Show HN: OpenedShelf – Self-hostable, edge Boolean book discovery (zero tracking, CC0 taxonomy)`

---

### 1.2 Show HN Post Body (Copy & Paste Ready)

```markdown
I built this because of a book called "1913" by Florian Illies — a month-by-month portrait of the last year before the world changed. It covers Louis Armstrong picking up a cornet, Coco Chanel opening her first shop, Kafka writing agonizing love letters, and Stravinsky composing The Rite of Spring.

When I finished it, I didn't want one "similar" book — I wanted a dozen. A cookbook from that world. A Russian political history. A French novel set in that exact cultural moment.

Every search tool I tried gave me one single lane: pre-war European history, then straight into WWI military strategy. None of them could do what my brain was doing: moving sideways across the same slice of time and theme.

The mainstream discovery model is broken by design. Recommendation algorithms optimize for sales volume, recency bias, and algorithmic engagement loops. Search engines reduce books to keyword matching or fuzzy vector embeddings that hallucinate recommendations based on popular consensus rather than textual reality.

So I built OpenedShelf (https://openedshelf.org).

OpenedShelf is a Boolean book discovery engine built on a three-tier, community-governed taxonomy:
1. Thematic Tags (Tier 1): Genre-agnostic, objective, verifiable textual properties (e.g., `isolated`, `resource_scarcity`, `first_person_pov`, `unreliable_narrator`).
2. Genre Identities (Tier 2): Standard literary classifications (e.g., `genre:space_opera`, `genre:cozy_mystery`, `genre:hard_scifi`).
3. Genre Tropes (Tier 3): Verifiable narrative devices that happen *inside* a plot (e.g., `genre:locked_room`, `genre:enemies_to_lovers`, `genre:generation_ship`).

Key aspects of how it works:

1. Strict Boolean Intersection (AND Logic)
You stack exact, verifiable properties. When you select `isolated` AND `resource_scarcity` AND `genre:space_opera`, the engine strictly intersects those sets. There are no sponsored placements, popularity boosts, or affiliate steering.

2. "The Rabbit Hole" (Zero-Result Discovery)
Because the engine is strict, detailed queries will eventually run out of results. That zero-result state is not treated as a dead-end error — it is a discovery in itself. It proves that the exact book you are imagining either hasn't been tagged yet in the open catalog, or hasn't been written yet. The UI breaks down the query step-by-step, shows you exactly where the intersection collapsed, offers a "one step back" breadcrumb trail of alternative titles, and gives you a permanent, shareable URL for that conceptual gap.

3. "Brutally Efficient" Edge Architecture
OpenedShelf is built for readers at the margins — including those on metered 2G/3G cellular connections or older secondhand devices:
- Server-rendered plain HTML from Cloudflare Workers (sub-50ms time to first byte globally).
- Zero client-side JavaScript frameworks.
- Zero analytics, telemetry, fingerprinting, or tracking pixels.
- Zero user authentication required to search, discover, or share.
- System font stack (zero external CDN font downloads).
- If book covers fail to load on high-latency networks, the UI dynamically generates CSS book spines from typography.

4. Offline Pipeline & SQLite Edge Storage
The multi-gigabyte Open Library catalog dump, Library of Congress (LOC MARC 21 and BIBFRAME Hubs) bibliographic metadata, Wikidata entities, and Project Gutenberg catalog are processed offline via an 8-stage data pipeline. The pipeline cleans, normalizes, and strips millions of raw records into a compact, immutable SQLite database published to Cloudflare R2. Public searches are executed by a read-only query service with zero cold starts, while Cloudflare D1 handles transactional tag proposals.

5. Open Governance: The Library Council
The taxonomy is dedicated to the public domain (CC0 1.0), and the engine is licensed under the GNU AGPLv3. The taxonomy is not maintained by an opaque algorithm or corporate committee; it is governed by a community Library Council — genre-literate readers and librarians who review tag submissions, vote on promotions from trope to thematic tag, and publicly publish every veto with a written rationale.

Try a few starting rabbit holes:
- The 1913 Cultural Moment: https://openedshelf.org/search?q=1913+pre_war_europe
- Isolation in Speculative Fiction: https://openedshelf.org/search?q=isolated+resource_scarcity+genre:space_opera
- Cozy Found Family: https://openedshelf.org/search?q=genre:cozy_fantasy+found_family
- The Intentional Gap: https://openedshelf.org/search?q=genre:cyberpunk+genre:regency_romance

Code: https://github.com/openedshelf/openedshelf (AGPLv3)
Self-Hosting Guide: https://github.com/openedshelf/openedshelf/blob/main/docs/OpenedShelf_deploy.md

I would love your feedback on the search precision, the taxonomy structure, and the zero-js edge architecture.
```

---

## Part 2: Hacker News First-Comment Technical Addendum

*Post this as the author's immediate follow-up comment within 2 minutes of the main submission.*

```markdown
Author here. A few extra technical details for those curious about the architecture and data processing:

Why SQLite instead of Elasticsearch / Meilisearch / Vector Databases?
1. Determinism: Book discovery here is set-theoretic, not probabilistic. When someone specifies `locked_room` AND `historical_mystery`, we don't want fuzzy vector cosine similarity returning a contemporary thriller that "feels" similar. Set intersection on indexed SQLite junction tables (`Works_Tags`) is blazing fast, strictly reproducible, and uses a tiny fraction of the memory.
2. Portability: By compiling our entire indexed catalog into an immutable SQLite artifact (`openedshelf_db_*.sqlite`), the database can be mirrored anywhere via R2 or S3, opened read-only, and queried with zero warm-up time.
3. Self-Hostability: You don't need a Docker cluster or 16GB of RAM to run this locally. You can clone the repo, download the CC0 catalog dump, and query it directly using the SQLite CLI or a tiny Node/Python process.

How the 8-Stage Offline Pipeline Works:
The raw bibliographic data comes from several massive upstream dumps:
- Open Library catalog dumps (millions of works & editions).
- Library of Congress MARC 21 records & BIBFRAME Hubs (for high-fidelity subject headings and field 520 synopses).
- Wikidata (for cross-referenced entity relationships).
- Project Gutenberg (for public domain texts).

The offline pipeline (`run_pipeline.sh`):
1. Ingests raw `.gz` dumps into staging tables.
2. Normalizes cataloging punctuation, author names, and subtitle junk (e.g. stripping "/ by..." and bracketed library markers).
3. Executes a greedy multi-word tokenizer that maps free-form subject strings against our 800+ controlled taxonomy terms.
4. Drops orphaned catalog records (works with no tags, no synopsis, or missing editions).
5. Strips out raw staging columns (`ol_subjects`, `ol_genres`) to save ~10 GB.
6. Generates SQLite FTS5 virtual tables and B-tree indexes for fast tag intersection.
7. Publishes the immutable snapshot to R2 for the query service.

On Privacy & Low Bandwidth:
The site is built according to the principle of least privilege. There are no cookies, no localStorage tokens, no Google Fonts, no third-party scripts, and no analytics beacons. Every search is a bookmarkable `GET` request. On a 3G mobile link, the entire initial page payload is under 25 KB uncompressed.

Happy to answer any questions about the data ingestion pipeline, the tag taxonomy, or the edge setup!
```

---

## Part 3: Show HN Comment Response Playbook

Prepare these answers to address predictable HN discussion points quickly, authoritatively, and politely.

### Q1: "Why not use LLM embeddings or vector search for this?"
> **Response:**  
> Vector search is wonderful for vague, semantic queries ("find me a book with a melancholic autumn vibe"), but it fails at strict constraint satisfaction. 
> 
> If you ask a vector database for a sci-fi novel that *specifically* features a generation ship, zero-gravity physics, and no faster-than-light travel, high cosine similarity will inevitably hallucinate popular space operas that mention "ships" in their summary even if they violate your constraints.
> 
> OpenedShelf is built on set theory, not probability. When you stack tags on OpenedShelf, every tag is an absolute constraint. The goal is verifiable facts about texts, not algorithmic approximations.

---

### Q2: "How does this compare to Goodreads, StoryGraph, or LibraryThing?"
> **Response:**  
> Goodreads and StoryGraph are primarily social reading logs and review platforms built on engagement loops, five-star ratings, and algorithmic recommendation feeds. Because their business models rely on traffic and affiliate book sales, they naturally prioritize bestsellers and popular releases.
> 
> LibraryThing has incredible bibliographic depth, but its tag cloud is largely unstructured user folksonomy with massive redundancy (`scifi`, `sci-fi`, `science-fiction`, `space`).
> 
> OpenedShelf is not a social network or a review site. It has no user accounts, no ratings, and no reviews. It is purely a discovery filter using a curated, three-tier controlled vocabulary (Thematic, Genre, Trope). It treats books as intersectional sets of objective properties.

---

### Q3: "How does the SQLite on R2 + Query Service architecture work under load?"
> **Response:**  
> Cloudflare Workers handle routing, request sanitization, and server-side HTML rendering at edge PoPs globally. Because Worker sandboxes have memory and execution limits that make opening multi-gigabyte SQLite databases directly impractical, we decouple storage from search compute:
> 
> 1. The catalog database is compiled offline and stored as an immutable versioned artifact on R2 (`openedshelf_db_[date].sqlite`).
> 2. The read-only query service pulls the active version into local memory/SSD cache and serves strict SQL tag intersections via `POST /search` and `GET /tag-counts`.
> 3. Cloudflare D1 is strictly reserved for lightweight write transactions (`Pending_Tags` proposals and moderation actions).
> 
> This keeps public search responses sub-100ms and ensures catalog queries never lock or degrade the transactional moderation database.

---

### Q4: "How do you prevent spam or vandalism on tag proposals without user accounts?"
> **Response:**  
> There is a hard boundary between the public search catalog and user submissions:
> 
> 1. Public catalog queries run against an immutable, read-only SQLite database. It is physically impossible for an incoming HTTP request to alter the live search index.
> 2. Community tag submissions via `/submit-tag` write exclusively to an isolated `Pending_Tags` table in Cloudflare D1.
> 3. Submissions are strictly rate-limited at the Cloudflare edge WAF.
> 4. Nothing enters the searchable catalog automatically. The Library Council reviews pending proposals in weekly batches. Only approved tags are folded into the next offline pipeline build.

---

### Q5: "Why AGPLv3 for the engine and CC0 for the taxonomy?"
> **Response:**  
> This two-tier licensing model is deliberate:
> - **The Engine (AGPLv3):** We want OpenedShelf to remain free and open forever. The Affero GPL ensures that if a commercial entity takes our search engine and runs it as a modified network service, they must contribute their improvements back to the open-source commons.
> - **The Taxonomy & Data (CC0 1.0):** Knowledge about books belongs to humanity. The taxonomy terms, tag definitions, and book-tag relationship mappings are dedicated to the public domain. Anyone — from local libraries and universities to indie bookshops — can export and use the taxonomy without restriction.

---

### Q6: "How do you handle book synopses and copyright?"
> **Response:**  
> We take copyright and open data compliance very seriously (we have a formal compliance guide in `docs/DATA_LICENSES_AND_ATTRIBUTION.md`):
> - Primary catalog metadata and author records come from Open Library (Internet Archive) under CC0.
> - Bibliographic summaries are sourced from the Library of Congress (MARC 21 Field 520), which is in the worldwide public domain as a work of the U.S. Government (17 U.S.C. § 105).
> - For missing synopses on popular titles, we perform surgical, rate-limited lookups via the Google Books API according to their developer terms of service.
> - We strictly ban datasets with Non-Commercial (NC) restrictions (such as scraped Goodreads academic dumps) to preserve our clean-room licensing integrity.

---

### Q7: "Can I self-host this on a Raspberry Pi or VPS?"
> **Response:**  
> Yes! That is our "Escape Hatch" guarantee (documented in [docs/OpenedShelf_deploy.md](docs/OpenedShelf_deploy.md)).
> 
> While our primary public deployment uses Cloudflare Workers and R2 for global edge speed, the core engine has zero vendor lock-in. You only need:
> - Node.js (or Python 3.10+)
> - SQLite3
> - Bash
> 
> You can download the latest compiled SQLite snapshot, run `src/engine.js`, and have a fully functional local discovery engine running on your home network in under 5 minutes.

---

## Part 4: Short-Form Social Copy (X / Mastodon / Bluesky)

### 4.1 Launch Post (Fediverse / Mastodon `#Bookstodon`)

```text
Announcing OpenedShelf (https://openedshelf.org) 🐇📚

A Boolean book discovery engine with a community-governed taxonomy.

Instead of algorithmic bestseller feeds and predictive ad tracking:
• Stack exact, verifiable facts (`isolated` + `genre:space_opera` + `resource_scarcity`)
• Strict Boolean AND intersection
• When queries return 0 results, the gap is the point
• Server-rendered plain HTML, sub-50ms latency, zero tracking, no accounts
• AGPLv3 engine + CC0 public domain taxonomy

Built for readers who want to explore sideways across history and genre.

Code & self-hosting: https://github.com/openedshelf/openedshelf
```

### 4.2 Launch Post (X / Twitter)

```text
Most book discovery tools push you into one lane: current bestsellers and algorithmic vibes.

I wanted something different: a discovery engine that lets you move sideways across history, genres, and themes.

Today I'm launching OpenedShelf: https://openedshelf.org

Here's why it works: 🧵👇

1/ Stacking Objective Facts
Instead of subjective star ratings, OpenedShelf uses a 3-tier Boolean taxonomy:
• Thematic Tags (e.g. `unreliable_narrator`, `isolated`)
• Genre Identities (e.g. `genre:cozy_fantasy`)
• Plot Tropes (e.g. `genre:enemies_to_lovers`)

2/ The Zero-Result Rabbit Hole
The engine applies strict set intersection (AND). When your query hits zero results, it's not an error — it's proof of a literary gap that hasn't been tagged or written yet. The URL is permanent and shareable.

3/ Brutally Lightweight Architecture
• Server-rendered HTML from the edge (sub-50ms TTFB)
• Zero client-side JS frameworks
• Zero tracking, cookies, or telemetry
• Immutable SQLite catalog on Cloudflare R2
• AGPLv3 open source + CC0 taxonomy

Try exploring: https://openedshelf.org
```

---

## Part 5: Launch Day Operations Checklist for the Poster

1. **T-30 Minutes:**
   - Verify `https://openedshelf.org` returns HTTP 200 with snappy response times.
   - Run a live query test on mobile (metered data or throttling enabled).
   - Have GitHub repository open and public.

2. **T-0 (Launch Moment):**
   - Submit the Hacker News link post with title:  
     `Show HN: OpenedShelf – A Boolean book discovery engine with a community taxonomy`  
     URL: `https://openedshelf.org`
   - Immediately post **Part 2 (Technical Addendum)** as the top comment.

3. **T+5 to T+240 Minutes (The Active Window):**
   - Keep HN tab open; refresh every 3–5 minutes.
   - Answer every technical, philosophical, or data question promptly using the playbook in **Part 3**.
   - Acknowledge constructive feedback and catalog bug reports gracefully ("Great catch, added to our ingestion backlog for next week's build!").
