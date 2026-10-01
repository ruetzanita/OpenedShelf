# OpenShelf Council FAQ & Quick Reference Guide

---

## 1. Quick Reference Cheat Sheet

### Syntax & Namespace Reference
| Prefix / Namespace | Tier / Purpose | Examples | Notes |
| :--- | :--- | :--- | :--- |
| *(None)* | **Tier 1: Thematic Tag** | `isolated`, `resource_scarcity`, `first_person_pov` | Universal, cross-genre textual facts. |
| `genre:` | **Tier 2: Genre Identity** | `genre:space_opera`, `genre:cozy_mystery`, `genre:gothic` | Broad shelving classification (BISAC/LCGFT). |
| `genre:` | **Tier 3: Genre Trope** | `genre:locked_room`, `genre:enemies_to_lovers`, `genre:fake_dating` | Narrative conventions within genres. Eligible for promotion via 3-Genre Rule. |
| *(None)* | **Audience Demographic** | `adult`, `young_adult`, `middle_grade`, `childrens` | Stacks alongside Tier 1 thematic tags. |
| `lang:` | **Language Filter** | `lang:eng`, `lang:spa`, `lang:fra`, `lang:deu` | Uses standard **ISO-639-3** lowercase codes. |
| `author:` | **Author Search** | `author:tolkien`, `author:asimov`, `author:butler` | Direct metadata filter (bypasses tag tables). |
| `year:` or `y:` | **Publication Year** | `year:1984`, `year:2010-2020`, `y:1913` | Exact year or range (Library of Congress MARC). |

### Formatting Constraints Checklist
* [x] **Format**: strictly lowercase `snake_case` (e.g., `time_travel`).
* [x] **No Punctuation**: No hyphens, colons (outside prefix), slashes, or spaces.
* [x] **Numbering**: Settings and structural forms are singular (`unreliable_narrator`); relationship tropes are plural (`enemies_to_lovers`).
* [x] **No Negatives**: Never tag `no_violence`; Boolean search handles exclusion via `NOT violent_content`.

---

## 2. Weekly Governance Rhythm at a Glance

```text
  Mon      Tue      Wed      Thu      Fri      Sat      Sun
[------ Triage & Verification ------] [Ballot] [Vote]  [Sync]
  Days 1-4: Curators review /verify     Day 5:   Day 6:  Day 7: 12:00 UTC
  and verify factual citations.         Leads    Plenary  Public Veto Log &
                                        set      Ballot   SQLite Edge Build
                                        ballot.  Closes.  Deploys to R2.
```

* **Standard Tag Approval**: 3 independent curator approvals commit a tag for the weekly build.
* **Plenary Quorum**: Minimum 40% of active Council members.
* **Trope-to-Thematic Promotion**: Requires 3+ parent genres and a 2/3 supermajority vote.
* **Constitutional Veto**: Mandatory written rationale required by database schema.

---

## 3. Frequently Asked Questions (FAQ)

### Q: What if a tag submission is for a book I haven't personally read?
**A:** You do not need to have read every book in the world to be an effective Curator! 
* Review the submitter's one-sentence textual justification.
* Check authoritative bibliographic sources: Library of Congress MARC records, Open Library records, publisher metadata, or excerpt searches.
* If the justification cites a concrete, verifiable plot point (e.g., *"The protagonist's sister dies in chapter 2, driving the narrative arc"* for `grief_and_loss`), and external summaries corroborate the premise, you may approve it.
* If the element cannot be verified without reading the text, pass the proposal to a fellow Curator in your genre channel or leave it for someone who has read the work.

### Q: Can authors tag their own books on OpenShelf?
**A:** Yes, authors are warmly welcomed to submit factual tags for their works! However:
* Authors are held to the exact same **Fact Over Feeling** criteria as any other user.
* Marketing superlatives (e.g., `riveting`, `bestselling`, `gripping`) will be rejected immediately.
* **Conflict of Interest**: Council members who are authors may submit proposals for their own books, but must recuse themselves from approving, disputing, or voting on their own works.

### Q: How do we handle content warnings versus taxonomy tags?
**A:** Factual depictions of sensitive content are valid, objective narrative properties:
* `graphic_violence`, `explicit_sexual_content`, `suicide`, `war_crimes`, `substance_abuse` are acceptable objective tags.
* Vague or emotional trigger evaluations (e.g., `traumatizing`, `triggering`, `disturbing`) are subjective and are rejected.
* Users frequently use Boolean exclusion (`NOT graphic_violence`) to curate their reading safety; maintaining accurate factual content tags is a vital service to readers.

### Q: Can a book have more than one Tier 2 Genre Identity?
**A:** Yes. While books typically live on a primary shelf, hybrid works legitimately belong to multiple genres:
* *The City & The City* by China Miéville: `genre:mystery` AND `genre:science_fiction` AND `genre:weird_fiction`.
* *Gideon the Ninth* by Tamsyn Muir: `genre:science_fiction` AND `genre:fantasy` AND `genre:gothic`.
* As long as the genre classifications represent recognized BISAC/LCGFT conventions and are central to the work, multiple genre identities are encouraged.

### Q: What should I do if two readers or curators disagree on a factual plot point?
**A:** Follow the Quarantine Protocol:
1. Flag the tag as `status = 'disputed'` in `/verify`.
2. The tag is immediately hidden from public Boolean search results.
3. A 3-curator panel reviews specific textual quotes and page citations.
4. If the dispute reveals genuine ambiguity or competing literary interpretations, **reject the tag**. Our rule of thumb: *False negatives are infinitely better than false positives.*

### Q: How do I propose a brand new tag that isn't currently in any dictionary?
**A:** Any Council member can propose a new canonical tag by opening a thread in the Council channel before Friday 00:00 UTC. Include:
1. Tag name in `snake_case`.
2. Proposed Tier (Thematic, Genre Identity, or Genre Trope).
3. Objective definition in one sentence.
4. At least three (3) distinct published works exemplifying the property.
5. If approved in the Saturday plenary vote, the tag will be added to the taxonomy dictionary during Sunday's build.

### Q: How do I take a sabbatical or leave of absence?
**A:** We know life, work, and reading slumps happen! Simply post a note to the Council Leads or in the announcements channel. You may take a leave of absence for up to six (6) months with no formal process. When on leave, you are excluded from quorum calculations, and your seat remains open for your return.

---

## 4. Key Council Resources & Escalations

* **Librarian Verification Queue**: `/verify` on any active OpenShelf deployment ([src/ui/pages/verify.js](../src/ui/pages/verify.js))
* **Database Schema**: [`db/d1_moderation_schema.sql`](../db/d1_moderation_schema.sql)
* **Taxonomy Keyword Files**:
  - Thematic Keywords: `src/taxonomy/tags_thematic_keywords.js`
  - Trope Keywords: `src/taxonomy/tags_trope_keywords.js`
  - Identity Keywords: `src/taxonomy/tags_identity_keywords.js`
* **Council Lead Escalations**: For technical issues, database sync errors, or conduct questions, contact the rotating Council Lead or email `council@openedshelf.org`.

---

*Keep this reference handy during your weekly verification and voting sessions!*
