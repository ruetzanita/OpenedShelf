# OpenShelf Veto Writing Guide & Transparency Templates

---

## 1. The Philosophy of the Public Veto

On most platforms, user submissions and community proposals disappear into an algorithmic black box. When a submission is rejected, users are met with silence, silent downranking, or generic "does not meet guidelines" automated notices.

**OpenedShelf rejects this model entirely.**

> [!IMPORTANT]
> In the OpenShelf Library Council, **every single veto must be accompanied by a public, written rationale**. 
> 
> This is enforced not merely by convention, but by our database architecture:
> ```sql
> -- db/d1_moderation_schema.sql
> rationale TEXT, -- Strictly required if vote = 'veto' per Library Council transparency charter
> ```

### Why We Mandate Written Rationales:
1. **Respect for Reader Labor**: A reader who took the time to submit an ISBN and tag cares about literature. They deserve an honest, human explanation.
2. **Community Education**: A well-crafted veto teaches the user how our Boolean set theory operates, turning them into a more effective contributor.
3. **Anti-Gatekeeping Accountability**: Requiring a written rationale prevents curators from rejecting tags based on personal dislike, elitism, or ideological bias. If you cannot explain the rejection in terms of objective taxonomy principles, you should not be casting a veto.

---

## 2. Anatomy of a Constructive Veto

A great Council veto rationale consists of four concise parts:

```text
[Acknowledgment] + [Taxonomy Principle] + [Specific Reason] + [Actionable Alternative]
```

1. **Acknowledgment**: Acknowledge the work and the submitter's intent with respect.
2. **Taxonomy Principle**: Cite the specific OpenShelf standard (e.g., *Fact Over Feeling*, *The Essay Rule*, *Single Canonical Term*).
3. **Specific Reason**: State clearly why the proposed tag violates this principle.
4. **Actionable Alternative**: Suggest how the reader can achieve this discovery using existing canonical tags or recommend submitting a properly decomposed Boolean stack.

---

## 3. Ready-to-Use Veto Templates

Council members are encouraged to use and adapt these standardized templates when casting a `veto` in the moderation system:

---

### Template 1: Subjective Emotion / Reading Mood Tag
* **Applicable For**: Tags describing how a book makes a reader feel (`heartwarming`, `creepy`, `spooky`, `page_turner`, `depressing`, `tearjerker`, `boring`).
* **Boilerplate**:
  > Thank you for this submission for *[Book Title]*. Under the OpenShelf *Fact Over Feeling* doctrine, our database strictly maps verifiable textual properties (such as settings, points of view, and plot devices) rather than subjective emotional reactions. Because emotional experiences vary significantly between readers, accepting `[Proposed Tag]` would degrade the precision of our Boolean set intersections. To find or map this narrative atmosphere, we recommend stacking factual tags such as `[Alternative Tag 1]` and `[Alternative Tag 2]`.
* **Filled Example (for tag `heartbreaking` on *A Little Life*):**
  > Thank you for this submission for *A Little Life*. Under the OpenShelf *Fact Over Feeling* doctrine, our database strictly maps verifiable textual properties (such as settings, points of view, and plot devices) rather than subjective emotional reactions. Because emotional experiences vary significantly between readers, accepting `heartbreaking` would degrade the precision of our Boolean set intersections. To find or map this narrative atmosphere, we recommend stacking factual tags such as `grief_and_loss` and `chronic_illness`.

---

### Template 2: Aesthetic Subculture Tag (Decomposition Required)
* **Applicable For**: Internet subculture aesthetics that combine multiple disparate elements (`dark_academia`, `cottagecore`, `goblincore`, `weirdcore`).
* **Boilerplate**:
  > Thank you for proposing `[Proposed Tag]` for *[Book Title]*. In OpenShelf taxonomy, aesthetic subcultures bundle multiple distinct literary variables into a single umbrella term, which obscures granular discovery. To keep our Boolean search mathematically precise, our policy is to deconstruct aesthetics into their factual components. We encourage exploring and tagging this work with `[Constituent Tag 1]` + `[Constituent Tag 2]`, which our search engine can intersect cleanly.
* **Filled Example (for tag `dark_academia` on *The Secret History*):**
  > Thank you for proposing `dark_academia` for *The Secret History*. In OpenShelf taxonomy, aesthetic subcultures bundle multiple distinct literary variables into a single umbrella term, which obscures granular discovery. To keep our Boolean search mathematically precise, our policy is to deconstruct aesthetics into their factual components. We encourage exploring and tagging this work with `academic_setting` + `genre:mystery` + `dark_themes`, which our search engine can intersect cleanly.

---

### Template 3: Semantic Redundancy / Duplicate Tag
* **Applicable For**: Plural variations, spelling discrepancies, or synonyms of existing canonical tags (`spaceships` vs `spaceship`, `time-travel` vs `time_travel`, `unreliable_narrating` vs `unreliable_narrator`).
* **Boilerplate**:
  > Thank you for suggesting `[Proposed Tag]` for *[Book Title]*. This concept is already canonically mapped in our taxonomy under the active tag `[Canonical Tag]`. To prevent split junction tables and fragmented search results, OpenShelf enforces a single canonical term per concept. We have marked this submission as a synonym; please use `[Canonical Tag]` for your future searches and curations.
* **Filled Example (for tag `enemies2lovers` on *A Court of Mist and Fury*):**
  > Thank you for suggesting `enemies2lovers` for *A Court of Mist and Fury*. This concept is already canonically mapped in our taxonomy under the active tag `genre:enemies_to_lovers`. To prevent split junction tables and fragmented search results, OpenShelf enforces a single canonical term per concept. We have marked this submission as a synonym; please use `genre:enemies_to_lovers` for your future searches and curations.

---

### Template 4: Narrative Ambiguity / Fails the Essay Rule
* **Applicable For**: Minor passing references or highly interpretive metaphors that do not form a substantive part of the work.
* **Boilerplate**:
  > Thank you for your proposal of `[Proposed Tag]` for *[Book Title]*. Under our *Essay Rule*, if an element requires extensive subjective interpretation or only appears as an incidental passing mention, it does not qualify as an indexable Boolean property of the work. For a tag to be indexed, the element must be a central premise, persistent setting, or recurring structural device within the text.
* **Filled Example (for tag `isolated_setting` on *Dune* based on a single scene in a tent):**
  > Thank you for your proposal of `isolated_setting` for *Dune*. Under our *Essay Rule*, if an element requires extensive subjective interpretation or only appears as an incidental passing mention, it does not qualify as an indexable Boolean property of the work. While Paul and Jessica shelter in a tent in one chapter, the broader narrative spans planetary empires, cities, and vast troop movements. For a tag to be indexed, the element must be a central premise, persistent setting, or recurring structural device within the text.

---

### Template 5: Late-Stage Narrative Spoiler
* **Applicable For**: Secret identity reveals, surprise twist culprits, or climax plot details that are withheld until the final pages.
* **Boilerplate**:
  > Thank you for your submission for *[Book Title]*. While `[Proposed Tag]` is an accurate description of the climax, OpenShelf policy reserves tags for the premise, structural setup, recurring narrative conventions, and openly stated jacket tropes. Indexing late-stage plot twists degrades the reading experience without improving initial discovery. We have vetoed this tag to protect readers while preserving discovery through premise-level tags like `[Alternative Premise Tag]`.
* **Filled Example (for tag `robot_culprit` on *The Caves of Steel*):**
  > Thank you for your submission for *The Caves of Steel*. While `robot_culprit` is an accurate description of the climax, OpenShelf policy reserves tags for the premise, structural setup, recurring narrative conventions, and openly stated jacket tropes. Indexing late-stage plot twists degrades the reading experience without improving initial discovery. We have vetoed this tag to protect readers while preserving discovery through premise-level tags like `genre:locked_room` and `human_ai_partnership`.

---

### Template 6: Improper Taxonomy Tier
* **Applicable For**: Proposing a genre-specific trope as a global Tier 1 thematic tag without evidence of cross-genre usage.
* **Boilerplate**:
  > Thank you for proposing `[Proposed Tag]`. This tag was submitted as a Tier 1 Thematic Tag, but our taxonomy records indicate this narrative mechanic currently exists exclusively within `[Specific Genre]`. Under Section 4 of our Taxonomy Protocol, genre-specific devices must remain Tier 3 Genre Tropes prefixed with `genre:` until they demonstrate consistent usage across 3 or more distinct parent genres. We have rejected the Tier 1 proposal and invited resubmission under the proper `genre:[Tag Name]` tier.
* **Filled Example (for tag `litrpg` proposed as a top-level theme):**
  > Thank you for proposing `litrpg`. This tag was submitted as a Tier 1 Thematic Tag, but our taxonomy records indicate this narrative mechanic currently exists exclusively within speculative and science fiction genres. Under Section 4 of our Taxonomy Protocol, genre-specific devices must remain Tier 3 Genre Tropes prefixed with `genre:` until they demonstrate consistent usage across 3 or more distinct parent genres. We have rejected the Tier 1 proposal and invited resubmission under the proper `genre:litrpg` tier.

---

## 4. The Sunday Transparency Digest

Every Sunday at 12:00 UTC, all veto rationales recorded during the week are compiled into the public **Weekly Council Transparency Digest** published on our documentation portal and GitHub repository. 

By treating every veto as a public, educational artifact, the Library Council ensures that OpenShelf remains the most transparent, trusted, and rigorous book discovery database on the internet.
