export async function fetchBookData(query, type = 'q') {
    const searchUrl = `https://openlibrary.org/search.json?${type}=${encodeURIComponent(query)}&limit=1`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error(`OpenLibrary Search API status: ${response.status}`);
        
        const data = await response.json();
        if (!data.docs || data.docs.length === 0) return null;
        
        const book = data.docs[0];
        let short_synopsis = book.first_sentence ? book.first_sentence[0] : 'No synopsis available.';

        // The Second Hop: Fetch the actual work description
        if (book.key) {
            try {
                const workResponse = await fetch(`https://openlibrary.org${book.key}.json`);
                if (workResponse.ok) {
                    const workData = await workResponse.json();
                    // Open Library descriptions can be a string or an object with a 'value' key
                    if (workData.description) {
                        short_synopsis = typeof workData.description === 'string' 
                            ? workData.description 
                            : workData.description.value || short_synopsis;
                    }
                }
            } catch (workError) {
                console.warn("Failed to fetch full synopsis, falling back to basic data.");
            }
        }
        
        return {
            title: book.title || 'Unknown Title',
            author: book.author_name ? book.author_name[0] : 'Unknown Author',
            isbn: book.isbn ? book.isbn[0] : null,
            short_synopsis: short_synopsis
        };
    } catch (error) {
        console.error("Adapter Error:", error);
        return null;
    }
}
