***

### Document 3: The Reader's Primer
**File Name:** `readers_primer.md` (To be integrated into the front-end UI / "About" page)
**Purpose:** To re-train users on how to search using Boolean facts rather than algorithm-driven natural language.

```markdown
# Welcome to OpenedShelf

Most book platforms try to guess what you want based on what millions of other people bought. They track your clicks and feed you into a loop of bestsellers.

OpenedShelf doesn't guess, and we don't track you. We just map the facts. 

## Move with Your Interests, Don't Get Stuck in a Stack

Goodreads is fine, but you often just get "vibes" and not the next great read with the exact same feel. Play Books works, but when you finish a `genre:biography_memoir` tagged with `wartime`, you can't seamlessly pivot to `genre:cookbooks` and `genre:home_cooking` to try the specific recipes they mentioned, or tumble into `genre:science_fiction` with `alternate_history` and `resistance_movement` to indulge in a scenario where the Axis won and a new rebellion is rising.

OpenedShelf encourages lateral movement. The "Fuzzy Fall" doesn't let the discovery end. You can start in history, pivot into a cookbook based on a historical footnote, and tumble right into a sci-fi thriller that matches the exact emotional tone of the memoir you just finished.

## How to Explore
Think of OpenedShelf like a highly organized, physical archive. Instead of typing "give me a good winter thriller," you build your search by stacking facts.

1. **Start Broad:** Type what you're looking for (e.g., "time travel" or "spicy") to get smart tag suggestions, or pick a genre shelf like `genre:mystery`.
2. **Stack the Facts:** Add elements you specifically want to see. Add thematic tags like `isolated` + `unreliable_narrator`.
3. **Dig Deeper:** Pick the path in your genre identity that speaks to you.
4. **Narrow it Down:** Add verifiable plot devices (tropes) like `locked_room_puzzle`. 
5. **Get Specific:** You can also tell us what you *don't* want. Exclude `violent_content` to keep it gentle.

## And More
1. **Filter by Language:** To restrict results to a specific language, use the `lang:` prefix followed by its 3-letter code (e.g. `lang:spa` for Spanish).
2. **Find an Author:** If you are looking for a specific writer, use the `author:` prefix (e.g. `author:smith` or `author:tolkien`).
3. **Filter by Publication Year:** Filter by a year or date range using the `year:` prefix (e.g. `year:1984` or `year:2010-2020`). *(Note: This data is sourced from Library of Congress metadata and may not be available for all books.)*

**Why stack genres, identities, and tropes?**
- Sub-genres like `genre:mystery` tell the engine which major shelf the book lives on.
- Tropes like `locked_room_puzzle` tell the engine what actually happens inside the book.
- Thematic tags like `isolated` define the setting and tone.
This stack allows you to be incredibly precise!

The system will only show you books that match your exact factual recipe. 

## The Rabbit Hole (When You Run Out of Books)
Because our engine is mathematically precise, you will eventually stack a combination of tags that results in zero books. 

**This is not an error.**

When the screen says, *"We couldn't quite find that one on the shelf,"* it means you've successfully discovered a gap in the literary map. You've imagined a highly specific combination of tropes and facts that the community hasn't logged yet—or maybe that hasn't been written yet.

When you hit the end of the Rabbit Hole, copy the URL. Share it. Let the community know what's missing.

## Saving Your Shelf (The Private Way)
If you find books you want to save for later, you can add them to "My Shelf". 

**Absolute Privacy:** Your shelf is saved directly to your browser's local storage. We do not track what you save, we do not require you to make an account, and we do not ask for your email address. 

**Cross-Device Sync:** If you want to access your shelf on another device, use the "Cloud Sync" feature on the My Shelf page. 
1. Click **Generate a new phrase**. You will receive a random 3-word phrase (e.g. `copper-owl-reading`).
2. Go to your other device, visit My Shelf, and type in that phrase to load your books.

**Warning:** Treat your phrase like a crypto key. Because we don't know who you are, there is no "Forgot My Password" button. If you lose the phrase, we cannot recover the sync connection. Unused sync phrases are automatically purged from our servers after 60 days of inactivity to keep our infrastructure clean and your data private.