# OpenedShelf Query Service Production Dockerfile
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8788
ENV SQLITE_MMAP_SIZE_MB=2048
ENV SQLITE_CACHE_SIZE_KB=65536
ENV QUERY_POOL_SIZE=4
ENV SEARCH_CACHE_TTL_MS=60000

# Copy application files needed for query service
COPY package.json ./
COPY query-service/ ./query-service/
COPY src/engine.js ./src/engine.js

# Run as non-root user
USER node

EXPOSE 8788

# Built-in healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8788/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "query-service/server.mjs"]
