# OpenedShelf Query Service: Sizing, Resilience & Operational Runbook

## 1. Executive Architecture Summary

The OpenedShelf catalog search engine operates as a decoupled, read-only query service (`query-service/server.mjs`) serving the Cloudflare Worker edge over an internal or authenticated network link. 

Because the immutable catalog artifact is approximately **23.3 GiB** containing over **41 million Works** and **197 million Works_Tags** mappings, running SQLite directly in a Worker or memory-constrained container without memory-mapping would cause catastrophic paging or out-of-memory (OOM) failures.

The query service architecture solves this via:
1. **Memory-Mapped File Access (`PRAGMA mmap_size = 2GB–4GB`)**: Bypasses user-space buffer copies, allowing the Linux kernel page cache to directly address SQLite B-tree pages into virtual memory.
2. **Worker Thread Connection Pool (`pool.mjs`)**: Manages isolated read-only `DatabaseSync` connections across dedicated worker threads, ensuring long searches never block the Node.js HTTP event loop or concurrent requests.
3. **In-Memory Precomputed Taxonomy (`GET /tag-counts`)**: Pre-warms all tag frequency counts into RAM on service startup and serves serialized JSON in <2ms.
4. **Search Query LRU Cache (`POST /search`)**: Bounded in-memory LRU cache (1,000 entries, 60s TTL) for hot Boolean queries.
5. **Automatic Restart & Supervision**: Systemd, Docker, and PM2 configurations with strict memory caps, health checks, and sub-3-second restart policies.

---

## 2. Hardware Sizing & Capacity Planning

| Metric | Minimum Required | Recommended Production | Rationale |
| :--- | :--- | :--- | :--- |
| **RAM** | 4 GB | 6 GB – 8 GB | 2 GB mmap virtual window + 64 MB SQLite page cache per worker + Node RSS. Remaining RAM serves as Linux OS page cache for hot database pages. |
| **vCPU** | 2 Cores | 4 Cores | 1 core for Node HTTP/event-loop routing + 2-3 worker threads running SQLite discovery queries in parallel. |
| **Storage** | 40 GB NVMe | 80 GB NVMe SSD | 23.3 GB active catalog + 23.3 GB rollback catalog + OS/logs. NVMe random read IOPS (>50,000) are vital for B-tree index seeks. |
| **Network** | 100 Mbps | 1 Gbps | Average `/search` JSON payload is ~15-25 KB. 100 req/s equates to ~20 Mbps outbound. |

---

## 3. SQLite Performance PRAGMAs

On startup, every reader connection in the pool executes the following pragmas:

```sql
-- Memory-mapped I/O (2 GB default, configurable via SQLITE_MMAP_SIZE_MB)
PRAGMA mmap_size = 2147483648;

-- Page cache allocation (64 MB negative value indicates kibibytes)
PRAGMA cache_size = -65536;

-- Strict read-only enforcement (prevents any locking or mutation overhead)
PRAGMA query_only = ON;

-- Store temporary tables, sorts, and subqueries in RAM
PRAGMA temp_store = MEMORY;

-- Lock wait timeout (milliseconds)
PRAGMA busy_timeout = 5000;
```

---

## 4. Connection Pooling & Fallback Mechanics

The connection pool (`query-service/pool.mjs`) supports two operational modes:

### Mode A: Multi-Threaded Worker Pool (Default)
* Spawns `QUERY_POOL_SIZE` worker threads (`query-service/worker_thread.mjs`), default `Math.min(4, os.availableParallelism())`.
* Each thread maintains its own open `DatabaseSync` handle and an LRU cache of prepared statements.
* Incoming requests are dispatched to idle workers. If all workers are occupied, queries enter a FIFO queue with a strict timeout (`QUERY_TIMEOUT_MS=10000`).
* If a worker thread crashes or times out, the pool terminates it, removes it from rotation, and re-spawns a replacement.

### Mode B: Direct Connection Fallback
* If worker threads are disabled (`ENABLE_WORKER_POOL=false`) or thread spawning fails on constrained systems, the pool falls back to a single synchronous `DatabaseSync` connection on the main thread with all pragmas and prepared statement caching active.

---

## 5. Automatic Restart Policies

### 1. Systemd (`query-service/openedshelf-query.service`)
Configured with:
* `Restart=always`: Re-spawns the service if it crashes, exits unexpectedly, or is terminated by the OOM killer.
* `RestartSec=3s`: Prevents runaway fork loops while recovering in under 3 seconds.
* `MemoryMax=6G` / `MemoryHigh=5G`: Sends warning thresholds before hard killing.
* `LimitNOFILE=65536`: Ensures file descriptor exhaustion never drops connections.

To install and start:
```bash
sudo cp query-service/openedshelf-query.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now openedshelf-query.service
```

### 2. Docker & Docker Compose (`query-service/docker-compose.yml`)
Configured with `restart: unless-stopped`, read-only volume mounts (`:ro`), resource limits (`cpus: 4.0`, `memory: 6G`), and continuous HTTP health checks via `/health`.

```bash
docker compose -f query-service/docker-compose.yml up -d
```

### 3. PM2 (`query-service/ecosystem.config.cjs`)
Configured with `autorestart: true`, `max_memory_restart: '5G'`, and automatic exponential backoff restart delay.

```bash
pm2 start query-service/ecosystem.config.cjs
```

---

## 6. Health Monitoring & Observability

The query service exposes real-time telemetry at `GET /health` and `GET /healthz`:

```json
{
  "status": "ok",
  "service": "openedshelf-query-service",
  "uptime": 3600,
  "memory": {
    "rss": 184549376,
    "heapTotal": 45088768,
    "heapUsed": 28419200,
    "external": 1572864
  },
  "pool": {
    "poolSize": 4,
    "idleWorkers": 4,
    "activeWorkers": 0,
    "queuedRequests": 0,
    "totalQueriesExecuted": 14205,
    "searchCache": {
      "entries": 412,
      "maxEntries": 1000,
      "hits": 6120,
      "misses": 8085,
      "hitRatio": "43.1%"
    },
    "cachedTagsCount": 877,
    "directConnectionActive": false,
    "mmapSizeBytes": 2147483648,
    "cacheSizeKb": 65536
  }
}
```

---

## 7. Zero-Downtime Catalog Promotion & Cache Invalidation

When publishing an updated SQLite catalog from the offline pipeline (`build/v2/scripts/publish_r2_database.sh`):

1. Download the new SQLite artifact to a side-by-side path: `/var/data/openedshelf/catalog_v2.sqlite`.
2. Verify integrity and indexes:
   ```bash
   sqlite3 /var/data/openedshelf/catalog_v2.sqlite "PRAGMA quick_check;"
   sqlite3 /var/data/openedshelf/catalog_v2.sqlite "SELECT count(*) FROM Tags;"
   ```
3. Update symlink or `R2_DATABASE_PATH`:
   ```bash
   ln -sfn /var/data/openedshelf/catalog_v2.sqlite /var/data/openedshelf/current.sqlite
   ```
4. Signal the query service to reload:
   ```bash
   # Option A: SIGHUP reload
   pkill -HUP -f "query-service/server.mjs"

   # Option B: HTTP Admin reload
   curl -X POST -H "Authorization: Bearer $SEARCH_API_TOKEN" http://127.0.0.1:8788/admin/refresh-cache
   ```
