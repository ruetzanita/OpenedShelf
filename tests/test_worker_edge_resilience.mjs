import assert from 'node:assert/strict';
import worker from '../src/worker.js';

console.log('Testing Cloudflare Worker Edge Resilience, Caching & Rate Limiting...');

// Mock environment
const env = {
    SEARCH_API_URL: 'http://127.0.0.1:8788',
    SEARCH_API_TOKEN: 'test-token',
    openedshelf_master: {
        prepare(sql) {
            return {
                bind(...params) {
                    return {
                        async run() {
                            return { success: true };
                        }
                    };
                }
            };
        }
    }
};

const ctx = {
    waitUntil(promise) {}
};

// 1. Verify robots.txt route & edge headers
console.log('1. Verifying /robots.txt route and edge cache headers...');
{
    const req = new Request('https://openedshelf.org/robots.txt');
    const res = await worker.fetch(req, env, ctx);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('Content-Type')?.includes('text/plain'));
    const cacheControl = res.headers.get('Cache-Control');
    assert.ok(cacheControl?.includes('public'));
    assert.ok(cacheControl?.includes('s-maxage=604800'));
    const text = await res.text();
    assert.ok(text.includes('User-agent: *'));
    assert.ok(text.includes('Disallow: /api/search'));
    assert.ok(text.includes('Sitemap: https://openedshelf.org/sitemap.xml'));
    console.log('✓ /robots.txt served with valid exclusion rules and 7-day edge cache.');
}

// 2. Verify sitemap.xml route & edge headers
console.log('2. Verifying /sitemap.xml route and edge cache headers...');
{
    const req = new Request('https://openedshelf.org/sitemap.xml');
    const res = await worker.fetch(req, env, ctx);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('Content-Type')?.includes('xml'));
    const cacheControl = res.headers.get('Cache-Control');
    assert.ok(cacheControl?.includes('public'));
    assert.ok(cacheControl?.includes('s-maxage=604800'));
    const text = await res.text();
    assert.ok(text.includes('<urlset'));
    assert.ok(text.includes('https://openedshelf.org/'));
    assert.ok(text.includes('https://openedshelf.org/about'));
    console.log('✓ /sitemap.xml served with valid XML and 7-day edge cache.');
}

// 3. Verify /api/credits route
console.log('3. Verifying /api/credits attribution endpoint...');
{
    const req = new Request('https://openedshelf.org/api/credits');
    const res = await worker.fetch(req, env, ctx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.credits.engine_license, 'AGPL-3.0-or-later');
    assert.equal(data.credits.taxonomy_license, 'CC0-1.0');
    assert.equal(data.credits.sources.length, 4);
    console.log('✓ /api/credits returned open data licensing and attribution metadata.');
}

// 4. Verify Tag Proposal Rate Limiting (10 req/min) & Low-Bandwidth 429
console.log('4. Verifying /submit-tag rate limiting (10 req/min) & low-bandwidth payload...');
{
    const ip = '198.51.100.42'; // Unique test IP
    let triggered429 = false;
    let payloadByteSize = 0;

    for (let i = 0; i < 15; i++) {
        const req = new Request('https://openedshelf.org/submit-tag', {
            method: 'POST',
            headers: {
                'CF-Connecting-IP': ip,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tag_name: `test-tag-${i}`,
                book_ref: 'work-1',
                justification: 'A valid reason'
            })
        });

        const res = await worker.fetch(req, env, ctx);
        if (i < 10) {
            assert.equal(res.status, 201, `Request ${i} within limit should succeed`);
        } else {
            assert.equal(res.status, 429, `Request ${i} beyond limit should return 429`);
            assert.equal(res.headers.get('Retry-After'), '60');
            const body = await res.text();
            payloadByteSize = Buffer.byteLength(body, 'utf8');
            assert.ok(payloadByteSize < 150, `429 payload must be brutally small for low-bandwidth users (was ${payloadByteSize} bytes)`);
            triggered429 = true;
        }
    }
    assert.ok(triggered429, 'Rate limiter must trigger on 11th request');
    console.log(`✓ /submit-tag rate limiter passed! Payload size was ${payloadByteSize} bytes (<150 bytes constraint).`);
}

// 5. Verify Search API Rate Limiting (60 req/min)
console.log('5. Verifying /api/search rate limiting (60 req/min)...');
{
    const ip = '203.0.113.88'; // Unique test IP
    let count429 = 0;

    for (let i = 0; i < 65; i++) {
        const req = new Request('https://openedshelf.org/api/search', {
            method: 'POST',
            headers: {
                'CF-Connecting-IP': ip,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ includeTags: ['genre:fiction'] })
        });

        const res = await worker.fetch(req, env, ctx);
        if (i >= 60) {
            assert.equal(res.status, 429);
            count429++;
        }
    }
    assert.equal(count429, 5, 'Should have received exactly 5 429 responses after 60 allowed queries');
    console.log('✓ /api/search rate limiter passed at 60 req/min threshold.');
}

// 6. Verify Static Assets are never rate-limited
console.log('6. Verifying static assets and robots.txt are exempt from rate limiting...');
{
    const ip = '203.0.113.88'; // Same IP that was rate-limited for search
    const req = new Request('https://openedshelf.org/robots.txt', {
        headers: { 'CF-Connecting-IP': ip }
    });
    const res = await worker.fetch(req, env, ctx);
    assert.equal(res.status, 200, 'Robots.txt must still be served 200 OK');
    console.log('✓ Browsing assets remain completely accessible when search is throttled.');
}

console.log('\nAll Cloudflare Worker edge resilience and rate limiting tests PASSED!');
