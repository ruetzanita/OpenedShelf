/*
 * OpenedShelf - A brutally efficient edge architecture for readers at the margins.
 * Copyright (C) 2026 Anita Ruetz
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { renderHome } from './ui/pages/home.js';
import { renderAbout } from './ui/pages/about.js';
import { renderPropose } from './ui/pages/propose.js';
import { renderVerify } from './ui/pages/verify.js';
import { renderMyShelf } from './ui/pages/myshelf.js';
import { parseSearchTokens } from './search_utils.js';
import { getSuggestions } from './dictionary.js';

const CREDITS_METADATA = {
    credits: {
        engine_license: "AGPL-3.0-or-later",
        engine_url: "https://www.gnu.org/licenses/agpl-3.0.html",
        taxonomy_license: "CC0-1.0",
        taxonomy_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        sources: [
            {
                name: "Open Library",
                organization: "Internet Archive",
                url: "https://openlibrary.org",
                license: "CC0-1.0",
                description: "Catalog records, editions, and author mappings"
            },
            {
                name: "Library of Congress",
                organization: "United States Library of Congress",
                url: "https://data.labs.loc.gov",
                license: "Public Domain (17 U.S.C. § 105)",
                description: "Bibliographic metadata, summaries (MARC 520), and BIBFRAME Hubs data"
            },
            {
                name: "Wikidata",
                organization: "Wikimedia Foundation",
                url: "https://www.wikidata.org",
                license: "CC0-1.0",
                description: "Structured conceptual entities and cross-language descriptions"
            },
            {
                name: "Project Gutenberg",
                organization: "Project Gutenberg Literary Archive Foundation",
                url: "https://www.gutenberg.org",
                license: "Public Domain Metadata",
                notice: "Project Gutenberg is a registered trademark of the Project Gutenberg Literary Archive Foundation and does not endorse or promote OpenedShelf."
            }
        ]
    }
};

const ROBOTS_TXT = `# OpenedShelf - Robots Exclusion Policy
# https://openedshelf.org

User-agent: *
Allow: /
Allow: /about
Allow: /credits
Allow: /api/credits
Allow: /rabbithole.png
Allow: /rabbit_reading.png
Allow: /rabbit_scribbling.png
Allow: /rabbit_surrounded.png
Allow: /fuzzy_fall_quizzical.png

# Prevent automated scraping of compute-heavy search and ingestion endpoints
Disallow: /api/search
Disallow: /search
Disallow: /api/submit-tag
Disallow: /submit-tag
Disallow: /api/propose
Disallow: /propose
Disallow: /verify

# Block aggressive AI / commercial scraping bots from hammering the raw JSON API
User-agent: GPTBot
Disallow: /api/
Disallow: /search

User-agent: CCBot
Disallow: /api/
Disallow: /search

User-agent: anthropic-ai
Disallow: /api/
Disallow: /search

User-agent: Claude-Web
Disallow: /api/
Disallow: /search

User-agent: Bytespider
Disallow: /

Sitemap: https://openedshelf.org/sitemap.xml
`;

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://openedshelf.org/</loc>
    <lastmod>2026-09-30</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://openedshelf.org/about</loc>
    <lastmod>2026-09-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://openedshelf.org/credits</loc>
    <lastmod>2026-09-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://openedshelf.org/propose</loc>
    <lastmod>2026-09-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://openedshelf.org/verify</loc>
    <lastmod>2026-09-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

// In-Worker sliding-window rate limiter fallback
const rateLimitBuckets = new Map();

function checkRateLimit(key, limit, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    let bucket = rateLimitBuckets.get(key);

    if (!bucket || now - bucket.startTime > windowMs) {
        bucket = { startTime: now, count: 1 };
        rateLimitBuckets.set(key, bucket);
        if (rateLimitBuckets.size > 5000) {
            for (const [k, v] of rateLimitBuckets.entries()) {
                if (now - v.startTime > windowMs) rateLimitBuckets.delete(k);
            }
        }
        return { success: true, remaining: limit - 1, reset: windowSeconds };
    }

    bucket.count++;
    if (bucket.count > limit) {
        const resetSeconds = Math.ceil((bucket.startTime + windowMs - now) / 1000);
        return { success: false, remaining: 0, reset: Math.max(1, resetSeconds) };
    }

    return { success: true, remaining: limit - bucket.count, reset: Math.ceil((bucket.startTime + windowMs - now) / 1000) };
}

function getClientIp(request) {
    return request.headers.get('CF-Connecting-IP') ||
           request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
           '127.0.0.1';
}

function rateLimitExceededResponse(retryAfterSeconds) {
    return new Response(JSON.stringify({
        error: "Too many requests. Please wait a moment.",
        retry_after: retryAfterSeconds
    }), {
        status: 429,
        headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
            'Cache-Control': 'no-store, no-cache'
        }
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const clientIp = getClientIp(request);
        const method = request.method;
        const pathname = url.pathname;

        // 1. Static Assets & Edge Caching: robots.txt
        if (pathname === '/robots.txt') {
            if (env.ASSETS) {
                try {
                    const assetRes = await env.ASSETS.fetch(request);
                    if (assetRes.ok) return assetRes;
                } catch {}
            }
            return new Response(ROBOTS_TXT, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        // 2. Static Assets & Edge Caching: sitemap.xml
        if (pathname === '/sitemap.xml') {
            if (env.ASSETS) {
                try {
                    const assetRes = await env.ASSETS.fetch(request);
                    if (assetRes.ok) return assetRes;
                } catch {}
            }
            return new Response(SITEMAP_XML, {
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        // 3. Static Images Pass-Through via env.ASSETS with Edge Headers
        if (pathname.endsWith('.png') || pathname.endsWith('.ico') || pathname.endsWith('.svg')) {
            if (env.ASSETS) {
                try {
                    const assetRes = await env.ASSETS.fetch(request);
                    if (assetRes.ok) {
                        const newHeaders = new Headers(assetRes.headers);
                        newHeaders.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
                        return new Response(assetRes.body, {
                            status: assetRes.status,
                            statusText: assetRes.statusText,
                            headers: newHeaders
                        });
                    }
                } catch {}
            }
        }

        // 4. Credits & Attribution Endpoint
        if (pathname === '/api/credits' || pathname === '/credits' || pathname === '/api/meta' || pathname === '/meta') {
            return new Response(JSON.stringify(CREDITS_METADATA, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        // 5. Rate Limiting on Search API (/api/search and /search)
        if (pathname === '/api/search' || (pathname === '/search' && method === 'POST')) {
            if (env.RATE_LIMIT_SEARCH) {
                const { success } = await env.RATE_LIMIT_SEARCH.limit({ key: clientIp });
                if (!success) {
                    return rateLimitExceededResponse(60);
                }
            } else {
                const limitCheck = checkRateLimit(`search:${clientIp}`, 60, 60);
                if (!limitCheck.success) {
                    return rateLimitExceededResponse(limitCheck.reset);
                }
            }

            return proxySearchRequest(request, env, '/search');
        }

        // 6. Tag Counts (/api/tag-counts and /tag-counts)
        if (pathname === '/api/tag-counts' || pathname === '/tag-counts') {
            const cacheKey = new Request(url.toString(), { method: 'GET' });
            let cache = null;
            try {
                cache = typeof caches !== 'undefined' ? caches.default : null;
            } catch {}

            if (cache) {
                const cachedRes = await cache.match(cacheKey);
                if (cachedRes) {
                    const response = new Response(cachedRes.body, cachedRes);
                    response.headers.set('X-Edge-Cache', 'HIT');
                    return response;
                }
            }

            const originRes = await proxySearchRequest(request, env, '/tag-counts');
            if (originRes.status === 200 && cache) {
                const toCache = new Response(originRes.clone().body, originRes);
                toCache.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=300');
                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(cache.put(cacheKey, toCache));
                }
            }

            const finalRes = new Response(originRes.body, originRes);
            finalRes.headers.set('X-Edge-Cache', 'MISS');
            return finalRes;
        }

        // 7. Community Tag Proposals (/submit-tag, /api/submit-tag, /propose, /api/propose)
        if ((pathname === '/submit-tag' || pathname === '/api/submit-tag' || pathname === '/api/propose') && method === 'POST') {
            if (env.RATE_LIMIT_SUBMIT) {
                const { success } = await env.RATE_LIMIT_SUBMIT.limit({ key: clientIp });
                if (!success) {
                    return rateLimitExceededResponse(60);
                }
            } else {
                const limitCheck = checkRateLimit(`submit:${clientIp}`, 10, 60);
                if (!limitCheck.success) {
                    return rateLimitExceededResponse(limitCheck.reset);
                }
            }

            const db = env.openedshelf_master || env.DB;
            if (db) {
                try {
                    let bookRef = '';
                    let tagName = '';
                    let tier = 'genre_identity';
                    let justification = '';

                    const contentType = request.headers.get('Content-Type') || '';
                    if (contentType.includes('application/json')) {
                        const body = await request.json();
                        bookRef = body.book_ref || body.work_id || body.title || '';
                        tagName = body.tag_name || body.tag || '';
                        tier = body.tier || 'genre_identity';
                        justification = body.justification || '';
                    } else if (contentType.includes('form')) {
                        const formData = await request.formData();
                        bookRef = formData.get('book_ref') || formData.get('work_id') || formData.get('title') || '';
                        tagName = formData.get('tag_name') || formData.get('tag') || '';
                        tier = formData.get('tier') || 'genre_identity';
                        justification = formData.get('justification') || '';
                    }

                    if (!tagName) {
                        return new Response(JSON.stringify({ error: 'tag_name is required' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    const stmt = db.prepare(
                        "INSERT INTO Pending_Tags (work_id, proposed_tag_name, tier, justification, status) VALUES (?, ?, ?, ?, 'pending')"
                    );
                    await stmt.bind(bookRef, tagName, tier, justification).run();

                    // If form POST from the UI, show confirmation page
                    if (contentType.includes('form') && !contentType.includes('json')) {
                        const successHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; text-align: center; padding: 4rem; background: #f6f5f1; color: #3c3932;">
    <h2 style="color: #D03D29;">Tag Proposed!</h2>
    <p>It has been sent to the Library Council for verification.</p>
    <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.8rem 1.5rem; background: #1C1C1A; color: white; text-decoration: none; border-radius: 8px;">Back to OpenedShelf</a>
</body>
</html>`;
                        return new Response(successHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        message: "Tag proposed! It will be reviewed by the Library Council.",
                        tag: tagName
                    }), {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (dbErr) {
                    console.error('D1 Pending_Tags error:', dbErr);
                    return new Response(JSON.stringify({ error: 'Failed to record proposed tag' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            return new Response(JSON.stringify({
                success: true,
                message: "Tag proposal accepted for review by the Library Council."
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 8. Verification Actions
        if (pathname === '/api/verify/approve' && method === 'POST') {
            return await handleApproveApi(request, env);
        }
        if (pathname === '/api/verify/reject' && method === 'POST') {
            return await handleRejectApi(request, env);
        }

        // 8b. Anonymous Cloud Sync (/api/shelf/sync and /api/shelf/load)
        if (pathname === '/api/shelf/sync' && method === 'POST') {
            try {
                const body = await request.json();
                const phrase = (body.phrase || '').trim().toLowerCase();
                const shelf = body.shelf || [];
                if (!phrase || !Array.isArray(shelf)) {
                    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                if (env.SHELVES) {
                    await env.SHELVES.put(`shelf:${phrase}`, JSON.stringify(shelf), { expirationTtl: 60 * 86400 });
                }
                return new Response(JSON.stringify({ success: true, phrase }), { headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Sync failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }
        if (pathname === '/api/shelf/load' && method === 'POST') {
            try {
                const body = await request.json();
                const phrase = (body.phrase || '').trim().toLowerCase();
                if (!phrase) {
                    return new Response(JSON.stringify({ error: 'Phrase required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                let shelf = null;
                if (env.SHELVES) {
                    const raw = await env.SHELVES.get(`shelf:${phrase}`);
                    if (raw) {
                        try { shelf = JSON.parse(raw); } catch {}
                    }
                }
                if (!shelf) {
                    return new Response(JSON.stringify({ error: 'Shelf not found or expired' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ success: true, shelf }), { headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Load failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // 9. Full Website Frontend Pages
        if (method === 'GET' || method === 'HEAD') {
            if (pathname === '/' || pathname === '/search') {
                return await handleHomeRoute(url, env);
            }
            if (pathname === '/about') {
                return new Response(renderAbout(), {
                    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=3600' }
                });
            }
            if (pathname === '/propose') {
                return new Response(renderPropose(), {
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
                });
            }
            if (pathname === '/verify') {
                return await handleVerifyRoute(env);
            }
            if (pathname === '/myshelf') {
                return new Response(renderMyShelf(), {
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    }
};

async function handleHomeRoute(url, env) {
    const q = url.searchParams.get('q') || '';
    const { includeTags, excludeTags } = parseSearchTokens(q);
    let results = [];
    let count = null;
    let rabbitHoleData = null;
    let tagCounts = {};
    let fuzzyResults = [];

    // 1. Fetch tag distribution counts from query service
    const searchApiUrl = env.SEARCH_API_URL || 'http://127.0.0.1:8788';
    try {
        const tcRes = await fetch(`${searchApiUrl}/tag-counts`);
        if (tcRes.ok) {
            const data = await tcRes.json();
            tagCounts = data.tagCounts || {};
        }
    } catch {}

    // 2. Execute Boolean search if query specified
    if (q) {
        try {
            const searchRes = await fetch(`${searchApiUrl}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    includeTags,
                    excludeTags,
                    tagCounts,
                    limit: 50,
                    offset: 0
                })
            });
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                results = searchData.results || [];
                count = searchData.count !== undefined ? searchData.count : results.length;
            }
        } catch (err) {
            console.error('Search query error:', err);
        }

        // 3. Zero-Result "Rabbit Hole" Discovery breakdown & Fuzzy Fall
        if (results.length === 0) {
            rabbitHoleData = [];
            const tokens = q.split(/[\s,]+/).filter(Boolean);
            let currentQueryString = '';
            let nextIsExclude = false;
            let lastSuccessfulStep = null;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token === '-') { nextIsExclude = true; continue; }
                if (token === '+') { nextIsExclude = false; continue; }
                const prefix = nextIsExclude ? '-' : currentQueryString ? '+' : '';
                currentQueryString += (currentQueryString ? ' ' : '') + prefix + token;
                const addedTag = (nextIsExclude ? '-' : '') + token;
                nextIsExclude = false;

                const stepParse = parseSearchTokens(currentQueryString);
                if (stepParse.includeTags.length > 0 || stepParse.excludeTags.length > 0) {
                    let stepCount = 0;
                    try {
                        const stepRes = await fetch(`${searchApiUrl}/search`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                includeTags: stepParse.includeTags,
                                excludeTags: stepParse.excludeTags,
                                tagCounts,
                                limit: 1,
                                offset: 0
                            })
                        });
                        if (stepRes.ok) {
                            const stepData = await stepRes.json();
                            stepCount = stepData.count || 0;
                        }
                    } catch {}
                    rabbitHoleData.push({
                        query: currentQueryString,
                        addedTag,
                        count: stepCount
                    });
                    if (stepCount > 0) {
                        lastSuccessfulStep = stepParse;
                    }
                }
            }

            // Fuzzy Fall: One Step Back (fetch up to 5 books from last non-zero step)
            if (lastSuccessfulStep) {
                try {
                    const fuzzyRes = await fetch(`${searchApiUrl}/search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            includeTags: lastSuccessfulStep.includeTags,
                            excludeTags: lastSuccessfulStep.excludeTags,
                            tagCounts,
                            limit: 5,
                            offset: 0
                        })
                    });
                    if (fuzzyRes.ok) {
                        const fuzzyData = await fuzzyRes.json();
                        fuzzyResults = fuzzyData.results || [];
                    }
                } catch {}
            }
        }
    }

    const suggestions = getSuggestions(q);
    const html = renderHome(results, count, q, suggestions, rabbitHoleData, tagCounts, fuzzyResults);
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=60'
        }
    });
}

async function handleVerifyRoute(env) {
    let pendingTags = [];
    const db = env.openedshelf_master || env.DB;
    if (db) {
        try {
            const res = await db.prepare(
                "SELECT * FROM Pending_Tags WHERE status = 'pending' ORDER BY created_at DESC"
            ).all();
            pendingTags = res?.results || [];
        } catch (err) {
            console.error('D1 Database Error (Verify):', err);
        }
    }
    const html = renderVerify(pendingTags);
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleApproveApi(request, env) {
    const formData = await request.formData();
    const id = formData.get('id');
    const db = env.openedshelf_master || env.DB;
    if (db && id) {
        try {
            const pendingTag = await db.prepare("SELECT * FROM Pending_Tags WHERE id = ?").bind(id).first();
            if (pendingTag) {
                const tagId = pendingTag.proposed_tag_name;
                const tier = pendingTag.tier || 'genre_identity';
                const scope = 'all';
                const workId = pendingTag.work_id;
                try {
                    await db.prepare("INSERT OR IGNORE INTO Tags (id, name, tier, scope) VALUES (?, ?, ?, ?)").bind(tagId, tagId, tier, scope).run();
                    await db.prepare("INSERT OR IGNORE INTO Works_Tags (work_id, tag_id) VALUES (?, ?)").bind(workId, tagId).run();
                } catch {}
                await db.prepare("UPDATE Pending_Tags SET status = 'approved' WHERE id = ?").bind(id).run();
            }
        } catch (err) {
            console.error('D1 Database Error (Approve):', err);
        }
    }
    return new Response(null, { status: 302, headers: { 'Location': '/verify' } });
}

async function handleRejectApi(request, env) {
    const formData = await request.formData();
    const id = formData.get('id');
    const db = env.openedshelf_master || env.DB;
    if (db && id) {
        try {
            await db.prepare("UPDATE Pending_Tags SET status = 'rejected' WHERE id = ?").bind(id).run();
        } catch (err) {
            console.error('D1 Database Error (Reject):', err);
        }
    }
    return new Response(null, { status: 302, headers: { 'Location': '/verify' } });
}

async function proxySearchRequest(request, env, targetPath) {
    const apiBase = env.SEARCH_API_URL;
    if (!apiBase) {
        return new Response(JSON.stringify({ error: 'SEARCH_API_URL is not configured.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }

    const apiUrl = new URL(targetPath, new URL(apiBase));
    const headers = new Headers();
    const auth = env.SEARCH_API_TOKEN;

    if (auth) headers.set('Authorization', `Bearer ${auth}`);
    const contentType = request.headers.get('Content-Type');
    if (contentType) headers.set('Content-Type', contentType);

    const init = { method: request.method, headers };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
    }

    try {
        const upstream = await fetch(apiUrl, init);
        return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: upstream.headers,
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Upstream search service unavailable' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }
}
