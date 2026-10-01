# Cloudflare Edge Resilience: Caching Rules, WAF Rate Limiting & Low-Bandwidth Protection

## 1. Overview & Architectural Goals

OpenedShelf serves readers worldwide with a focus on readers constrained by low-bandwidth, rural cellular connections, or metered data. The edge resilience architecture must satisfy two seemingly contradictory requirements:
1. **Aggressive Abuse Prevention**: Protect the backend read-only query service (`/api/search`) and Cloudflare D1 moderation database (`/submit-tag`) from automated bot floods, malicious scrapers, and denial-of-service attempts.
2. **Zero Degradation for Low-Bandwidth Readers**: Never penalize mobile readers sharing carrier-grade NAT (CGNAT) IPs, never serve bloated error pages, and preserve sub-millisecond edge response times for static assets and metadata.

---

## 2. Edge Caching Strategy

Edge caching is layered across three Cloudflare mechanisms:
* **Cloudflare Workers Cache API (`caches.default`)**: Programmatic edge PoP caching for dynamic JSON metadata (`/api/tag-counts`).
* **Static Assets Engine (`wrangler.jsonc` + `public/_headers`)**: Instant edge delivery of images, `robots.txt`, and `sitemap.xml`.
* **Origin Cache Control Headers**: Standardized HTTP headers that instruct intermediate proxies and browser caches.

### Cache Matrix

| Asset / Endpoint | Edge TTL (`s-maxage`) | Browser TTL (`max-age`) | Invalidation / Revalidation | Headers / Directives |
| :--- | :--- | :--- | :--- | :--- |
| **Static Images** (`/*.png`, `/*.svg`, `/*.ico`) | 30 days (2,592,000s) | 7 days (604,800s) | Immutable artifact | `Cache-Control: public, max-age=604800, s-maxage=2592000, immutable` |
| **`robots.txt`** | 7 days (604,800s) | 1 day (86,400s) | `stale-while-revalidate=86400` | `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400` |
| **`sitemap.xml`** | 7 days (604,800s) | 1 day (86,400s) | `stale-while-revalidate=86400` | `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400` |
| **Taxonomy Counts** (`/api/tag-counts`) | 1 hour (3,600s) | 5 minutes (300s) | Cached in `caches.default` at edge PoP | `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=300` |
| **Attribution & Credits** (`/api/credits`) | 24 hours (86,400s) | 24 hours (86,400s) | Re-fetched on deploy | `Cache-Control: public, max-age=86400, s-maxage=86400` |
| **Search Queries** (`/api/search`) | No Edge Cache (Origin Query Service handles LRU) | 30 seconds | Dynamic POST | `Cache-Control: public, max-age=30` |

---

## 3. Rate Limiting & Abuse Prevention Specification

Rate limiting is enforced at two distinct security perimeters:
1. **Cloudflare WAF Zone Layer**: Intercepts requests at Cloudflare's Anycast PoPs before Worker execution.
2. **Cloudflare Worker Layer**: Worker rate limit bindings (`RATE_LIMIT_SEARCH`, `RATE_LIMIT_SUBMIT`) with in-memory sliding window fallback.

### Rule 1: Tag Proposal Abuse Prevention (`/submit-tag`, `/propose`)
* **Target Endpoints**: `POST /submit-tag`, `POST /api/submit-tag`, `POST /propose`, `POST /api/propose`
* **Rate Threshold**: **10 requests per 60 seconds per IP**
* **Action**: HTTP 429 Too Many Requests
* **Mitigation Duration**: 60 seconds
* **Rationale**: Proposing a community tag is a deliberate human action. Limiting submissions prevents spam bots from filling the D1 `Pending_Tags` review queue without impacting genuine contributors.

### Rule 2: Search API Query Protection (`/api/search`, `/search`)
* **Target Endpoints**: `POST /api/search`, `POST /search`
* **Rate Threshold**: **60 requests per 60 seconds per IP**
* **Action**: HTTP 429 Too Many Requests
* **Mitigation Duration**: 60 seconds
* **Rationale**: 60 requests/minute (1 req/sec average) allows normal interactive discovery and filter toggling, while blocking high-concurrency scraping scripts that attempt to extract millions of catalog rows.

---

## 4. Low-Bandwidth & Metered Connection Protections

Overly blunt IP rate limits often harm readers on cellular networks where thousands of subscribers share carrier-grade NAT (CGNAT) gateway IPs. OpenedShelf implements specific safeguards:

1. **Lightweight 429 Payload (<120 bytes)**:
   Mainstream websites return bloated 1 MB branded error pages when rate limited. OpenedShelf returns an ultra-compact JSON response:
   ```json
   {"error":"Too many requests. Please wait a moment.","retry_after":60}
   ```
   This ensures mobile users with metered data plans lose virtually zero bytes during rate limit events.

2. **Standardized `Retry-After` Header**:
   Every 429 response includes `Retry-After: 60`, allowing client applications and scripts to pause cleanly without aggressive polling.

3. **Total Rate Limit Exemption for Browsing Assets**:
   Static images, landing HTML, `robots.txt`, `sitemap.xml`, and `/api/tag-counts` are **never** subjected to search rate limits. Even if a user reaches their search rate limit, their browsing UI and page navigation remain fully functional.

4. **Bot Fingerprint Disambiguation**:
   WAF rules inspect user agents (`GPTBot`, `CCBot`, `Bytespider`) and Cloudflare Bot Management scores so that high-risk automated bots are blocked (`403 Forbidden`) without penalizing legitimate human browsers on shared mobile IPs.

---

## 5. Deployment & Verification Runbook

### Deploying via Wrangler
1. Ensure `wrangler.jsonc` contains the `ratelimits` block and assets directory.
2. Deploy to production:
   ```bash
   npx wrangler deploy
   ```

### Deploying WAF Rules via Cloudflare Dashboard or API
Import `cloudflare/waf_rate_limits.json` into the Cloudflare Rulesets API:
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @cloudflare/waf_rate_limits.json
```

Or apply via Terraform:
```bash
cd cloudflare
terraform init
terraform apply -var="zone_id=${CLOUDFLARE_ZONE_ID}"
```
