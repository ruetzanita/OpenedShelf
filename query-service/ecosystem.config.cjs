module.exports = {
  apps: [
    {
      name: 'openedshelf-query-service',
      script: 'query-service/server.mjs',
      instances: 1, // Concurrency is handled internally via Worker thread connection pool
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '5G',
      env: {
        NODE_ENV: 'production',
        PORT: 8788,
        SQLITE_MMAP_SIZE_MB: 2048,
        SQLITE_CACHE_SIZE_KB: 65536,
        QUERY_POOL_SIZE: 4,
        SEARCH_CACHE_TTL_MS: 60000,
        SEARCH_CACHE_MAX: 1000,
        QUERY_TIMEOUT_MS: 10000
      }
    }
  ]
};
