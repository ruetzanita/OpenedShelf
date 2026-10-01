# OpenedShelf: Taxonomy Governance Protocol

## 1. The Prime Directive: Fact Over Feeling
OpenedShelf does not map how a book *feels*; it maps what a book *is*. Our discovery engine relies on absolute mathematical precision. If our taxonomy degrades into subjective opinions, the engine breaks. 

Every tag added to the OpenedShelf database must be an **Objective Factual Property**.

### Objective vs. Subjective Examples
* **REJECT (Subjective):**  `suspenseful`, `laugh_out_loud`, `world_building`. (These depend entirely on the reader's personal threshold).
* **ACCEPT (Objective):** `arranged_marriage`, `hydroponic_agriculture`, `first_person_pov`, `locked_room`, `single_parent`. (These are verifiable facts within the text).

*(Note: While subjective feelings are rejected from the database taxonomy, the frontend utilizes a Natural Language Dictionary to map common user terms like "spicy" to objective tags like `explicit_sexual_content` during search.)*

## 2. The Verification Pipeline
OpenedShelf relies on community "Librarians" with demonstrated literacy in specific genres. To ensure accuracy without creating a bureaucratic bottleneck, tag submissions follow a three-step pipeline:

1. **The Proposal:** Any user can propose a new Objective Tag for a work. The proposal must include a one-sentence justification pointing to a factual element in the text.
2. **The Verification Pivot:** The system does not ask the community, "Do you agree with this tag?" It asks a binary factual question: *"Does this book contain [Proposed Element]?"*
3. **Consensus:** A tag requires three independent, unanimous verifications from established community members to be committed to the public database.

## 3. Dispute Resolution
When two readers disagree on a factual plot point, the tag enters "Disputed Status." 
* Disputed tags are temporarily removed from the active Boolean search engine.
* A senior community Librarian must review the dispute. If the element is ambiguous (e.g., "Is this technically a dystopian government or just a corrupt oligarchy?"), the tag is **rejected**. 
* **Rule of Thumb:** If a tag requires an essay to justify, it is not an objective fact. Discard it.

---

## 4. Taxonomy Outline

The OpenedShelf taxonomy has three core tiers. Genre Identities map shelving, Thematic Tags map cross-genre objective facts, and Genre Tropes map community-specific plot devices. All three tiers can be stacked freely in Boolean search utilizing strict set-intersection (**AND**) logic.

### Tier 1: Thematic Tags (Cross-Genre Factual Properties)
Thematic tags have no prefix in the database. They cross all genres and describe verifiable factual properties of a text. Governed by the core Librarian council.

*Examples:* `isolated_setting`, `first_person_pov`, `resource_scarcity`, `coming_of_age`, `grief_and_loss`.

### Tier 2: Genre Identity (Standard Literary Taxonomy)
Genres use the `genre:` prefix. These determine which "shelf" a book lives on. Parent genres are organized into broad categories for browsing. Sub-genre identities define structural form (e.g., `genre:space_opera`, `genre:cozy_mystery`). 
Governed by the core Librarian council using industry standards (BISAC/LCGFT) as arbiters.

### Tier 3: Genre Tropes (Verifiable Narrative Devices)
Tropes also use the `genre:` prefix in the database. These describe what happens *inside* a specific genre's plot. 
*Examples:* `genre:litrpg`, `genre:enemies_to_lovers`, `genre:locked_room`.

**Governance:** Governed by **genre-specific Librarian communities** (e.g., the romance community governs `enemies_to_lovers`, the fantasy community governs `litrpg`).

**Trope Promotion Pipeline:** If a Tier 3 trope tag reaches critical mass (used significantly across 3+ distinct `genre_identity` parents), it automatically triggers a council vote to be promoted to a Tier 1 `thematic` tag.

### Audience & Age Qualifiers
Audience qualifiers are treated as Tier 1 thematic tags that designate the intended reader demographic. 
*Examples:* `young_adult`, `new_adult`, `middle_grade`, `childrens`, `adult`.

### Language Tags
Language tags use the `lang:` prefix followed by an ISO-639 3-letter code. These operate as specialized thematic tags, decoupling language metadata from the core taxonomy so it stacks cleanly with genres and themes.
*Examples:* `lang:eng`, `lang:spa`, `lang:fra`.

### Author Search
Author tracking uses the `author:` prefix. Unlike standard taxonomy tags, author queries bypass the tag-matching engine and map directly to flexible filters against the primary metadata. This allows for vast author discovery without cluttering the thematic taxonomy namespace.
*Examples:* `author:smith`, `author:tolkien`.

### Publication Year Search
Publication year filtering uses the `year:` (or `y:`) prefix. Like author queries, year filters bypass the tag-matching engine and apply a direct metadata filter (supporting exact years or ranges).
*Examples:* `year:1984`, `year:2010-2020`.

> [!NOTE]
> Publication year data is populated exclusively from **Library of Congress (LOC) MARC datasets** (via control field `008` or tags `260`/`264`). Because it relies on LOC records, it is more restrictive and may not be available for all works in the database.

## 5. Taxonomy Mapping Best Practices
With the split architecture for offline taxonomy seeding, strict constraints must be followed to avoid "false-positive cascades" that pollute the database. Mappings are now divided between Explicit Seeding (`seed_mappings.js`) and Dynamic Regex Dictionaries (`tags_identity_keywords.js`, `tags_trope_keywords.js`, `tags_thematic_keywords.js`):

### A. Explicit Seeding (`seed_mappings.js`)
* **Strictly for Seminal Works**: This file is exclusively for hardcoded Title and Author mappings. Do NOT use it for broad categorical mapping.
* **No Ambiguous Titles**: Never use a single year (e.g., `2001`) or a generic word (e.g., `Dune`) as a title match. Use the full title (e.g., `2001: A Space Odyssey`).
* **Conjunctions for Broad Matches**: If matching a short title or common word, use `AND` to combine it with a specific author (e.g., `title LIKE '%Dune%' AND author LIKE '%Frank Herbert%'`).
* **Scoped Shared Tags**: When defining mappings for subgenres that can exist under multiple parent genres (e.g., `dark`, `historical`), you MUST provide an explicit `scopedParent` as the 4th element of the mapping tuple to prevent the tag from granting all possible parent genres.
* **Tight Author Matching**: Never use short, common last names (e.g., `King`, `Fleming`). Use full names (e.g., `Stephen King`, `Ian Fleming`) to prevent accidental matches with unrelated authors.

### B. Dynamic Regex Dictionaries (`tags_*_keywords.js`)
* **Word Boundaries (`\b`)**: All keyword dictionaries are compiled into regexes using strict word boundaries. Keep this in mind when defining terms (e.g., "dystopi" will not match "dystopian").
* **Colloquial vs. Formal Vocabulary**: Include both formal Library of Congress terms (e.g., "climatic changes fiction") and colloquial slang (e.g., "cli-fi") in the keyword arrays to ensure maximum precision when scanning `ol_subjects` and `ol_genres`.
