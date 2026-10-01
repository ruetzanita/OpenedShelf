export const STYLES = `
:root {
    --bg-color: #f6f5f1;
    --text-color: #3c3932;
    --border-color: #3c3932;
    --pill-bg: #e8e6df;
    --pill-bg-hover: #d2cfc4;
    --card-bg: #ffffff;
    --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
    --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-sans);
    margin: 0;
    padding: 0;
    line-height: 1.4;
    font-size: 13px;
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-serif);
    font-weight: 600;
    margin-top: 0;
}

a {
    color: var(--text-color);
    text-decoration: underline;
    text-underline-offset: 4px;
}
a:hover {
    opacity: 0.8;
}

header {
    border-bottom: 1px solid var(--border-color);
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1000px;
    margin: 0 auto;
}

.logo {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    font-weight: bold;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

nav {
    display: flex;
    gap: 1rem;
    font-family: var(--font-sans);
    font-size: 13px;
}

nav a {
    text-decoration: none;
    font-weight: 500;
}

nav a.active {
    border-bottom: 2px solid var(--border-color);
}

main {
    max-width: 800px;
    margin: 1.5rem auto;
    padding: 0 1rem;
}


/* Dashboard Layout */
.dashboard-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-top: 1rem;
}
@media (max-width: 800px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }
}
.dashboard-main {
    min-width: 0;
}
.dashboard-sidebar {
    border-left: 1px dashed var(--border-color);
    padding-left: 1.5rem;
}
.horizontal-headings {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

/* Search Bar & Tag Stacking */
.search-container {
    margin-bottom: 1rem;
}

.search-box-wrapper {
    display: flex;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    padding: 0.5rem;
    align-items: center;
    position: relative;
}

.stacked-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-right: 0.5rem;
}

.tag-pill {
    font-family: var(--font-sans);
    font-size: 12px;
    background-color: var(--pill-bg);
    color: var(--text-color);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    border: 1px solid var(--border-color);
}

.tag-pill a {
    text-decoration: none;
    font-weight: bold;
    font-size: 14px;
    line-height: 1;
    color: var(--text-color);
}

.search-input {
    flex-grow: 1;
    border: none;
    outline: none;
    font-family: var(--font-sans);
    font-size: 16px;
    padding: 0.5rem;
    background: transparent;
    color: var(--text-color);
}

.search-submit {
    background-color: var(--border-color);
    color: var(--bg-color);
    border: none;
    padding: 0.5rem 1.5rem;
    font-family: var(--font-sans);
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
}

.search-submit:hover {
    opacity: 0.9;
}

.clear-search-btn {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
    padding: 0.4rem 1rem;
    font-family: var(--font-sans);
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    text-decoration: none;
    margin-left: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.clear-search-btn:hover {
    background-color: var(--pill-bg);
}

/* Suggestion Box */
.suggestions-box {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 13px;
}

.suggested-tag {
    text-decoration: none;
    color: var(--text-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
}

.suggested-tag:hover {
    background-color: var(--pill-bg);
}

/* Results Section */
.results-header {
    font-family: var(--font-serif);
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Counter Animation */
@keyframes counter-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
}
.counter-animate {
    display: inline-block;
    animation: counter-pop 0.3s ease-out;
}

/* Book Card Horizontal */
.book-card {
    display: flex;
    gap: 1rem;
    background: transparent;
    border: none;
    padding: 0;
    margin-bottom: 1.5rem;
    box-shadow: none;
}

.book-cover-placeholder {
    width: 80px;
    height: 120px;
    background-color: var(--border-color);
    color: var(--bg-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px;
    box-sizing: border-box;
    font-family: var(--font-serif);
    font-size: 9px;
    text-align: center;
    border-radius: 2px;
    box-shadow: none;
    border: 1px solid var(--border-color);
    flex-shrink: 0;
}
.book-cover-placeholder .title {
    font-weight: bold;
    font-size: 10px;
    margin-top: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.book-cover-placeholder .author {
    font-style: italic;
    font-size: 8px;
    margin-bottom: 6px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.book-details {
    flex-grow: 1;
}

.book-title {
    font-family: var(--font-serif);
    font-size: 1.2rem;
    margin-bottom: 0.1rem;
    color: var(--text-color);
}

.book-author {
    font-size: 13px;
    font-style: italic;
    margin-bottom: 0.25rem;
}

.book-isbn {
    font-size: 11px;
    opacity: 0.7;
    margin-bottom: 0.5rem;
}

.book-description {
    font-family: var(--font-serif);
    font-size: 13px;
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

.book-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.book-tags .tag {
    font-size: 10px;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 0.1rem 0.3rem;
    border-radius: 2px;
    text-decoration: none;
    color: var(--text-color);
}

.book-tags .tag:hover {
    background-color: var(--pill-bg);
}

/* Rabbit Hole Zero State */
.rabbithole-container {
    text-align: center;
    padding: 3rem 1.5rem;
    border: 1px dashed var(--border-color);
    border-radius: 8px;
    background: rgba(255,255,255,0.5);
}

.rabbithole-graphic {
    max-width: 250px;
    height: auto;
    margin: 1.5rem auto;
    display: block;
}

.rabbithole-steps {
    text-align: left;
    max-width: 440px;
    margin: 1.5rem auto;
    font-family: var(--font-serif);
}

.rabbithole-step {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0;
    border-bottom: 1px dotted var(--border-color);
}

.share-btn {
    background: transparent;
    border: 2px solid var(--border-color);
    color: var(--text-color);
    padding: 0.6rem 1.5rem;
    font-family: var(--font-sans);
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.2s ease;
}

.share-btn:hover {
    background: var(--border-color);
    color: var(--bg-color);
}

/* Browse Page Grid & Lists */
.browse-section {
    margin-bottom: 3rem;
}

.genre-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.genre-header {
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.25rem;
    margin-top: 1rem;
    margin-bottom: 0.75rem;
}

.tag-tier-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tag-group {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.75rem 1rem;
}

.tag-group-title {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.tag-cloud-item {
    font-size: 11px;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    text-decoration: none;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.tag-cloud-item:hover {
    background-color: var(--pill-bg);
}

.tag-cloud-item.active {
    background-color: var(--border-color);
    color: var(--bg-color);
    font-weight: bold;
}

.tag-count {
    font-size: 9px;
    opacity: 0.6;
}

/* MyShelf List */
.remove-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.remove-btn:hover {
    background: #e8e6df;
}

.add-shelf-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    margin-top: 0;
    white-space: nowrap;
}

.add-shelf-btn:hover {
    background: var(--pill-bg);
}

.book-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.book-title-group {
    flex-grow: 1;
}

.book-synopsis-accordion {
    margin: 0.5rem 0;
}

.book-synopsis-accordion summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--text-color);
    font-size: 12px;
    margin-bottom: 0.25rem;
    outline: none;
}

.book-synopsis-accordion .book-description {
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.4;
    margin: 0.5rem 0;
}

.external-library-link {
    display: inline-block;
    font-size: 11px;
    color: var(--text-color);
    text-decoration: underline;
    margin-bottom: 0.5rem;
}

.primary-btn {
    background-color: var(--border-color);
    color: var(--bg-color);
    border: none;
    padding: 0.5rem 1.2rem;
    font-family: var(--font-sans);
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
}

.primary-btn:hover {
    opacity: 0.9;
}

.secondary-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.4rem 1rem;
    font-family: var(--font-sans);
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
}

.secondary-btn:hover {
    background: var(--pill-bg);
}

.sidebar-select {
    width: 100%;
    padding: 0.4rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: var(--font-sans);
    background: #fff;
    color: var(--text-color);
}

.fuzzyfall-graphic {
    width: 150px;
    max-width: 100%;
    height: auto;
    margin: 1.5rem auto;
    display: block;
}

footer {
    text-align: center;
    padding: 3rem 0;
    font-size: 12px;
    opacity: 0.7;
    border-top: 1px solid var(--border-color);
    max-width: 1000px;
    margin: 0 auto;
}
`;
