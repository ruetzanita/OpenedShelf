#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/../../.."

BUCKET="${1:-openedshelf-search-database}"
SOURCE_DB="${2:-db/openedshelf_db_08_2026.sqlite}"
VERSION="${3:-$(date +%Y%m%d_%H%M%S)}"

if [[ ! -f "$SOURCE_DB" ]]; then
    echo "Database file not found: $SOURCE_DB" >&2
    exit 1
fi

for required_variable in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY; do
    if [[ -z "${!required_variable:-}" ]]; then
        echo "$required_variable is required for R2 multipart upload." >&2
        exit 1
    fi
done

PREFIX="catalog/$VERSION"
MANIFEST="$(mktemp)"
trap 'rm -f "$MANIFEST"' EXIT

node -e "const fs=require('node:fs'); const p=process.argv[1]; const s=fs.statSync(p); fs.writeFileSync(process.argv[2], JSON.stringify({version: process.argv[3], databaseObject: process.argv[4] + '/database.sqlite', sizeBytes:s.size, createdAt:new Date().toISOString()}, null, 2) + '\\n');" \
    "$SOURCE_DB" "$MANIFEST" "$VERSION" "$PREFIX"

echo "Uploading $SOURCE_DB to R2 bucket $BUCKET at $PREFIX..."
node scripts/r2_publish/upload_r2.mjs "$BUCKET" "$PREFIX/database.sqlite" "$SOURCE_DB" application/vnd.sqlite3
node scripts/r2_publish/upload_r2.mjs "$BUCKET" "$PREFIX/manifest.json" "$MANIFEST" application/json

echo "Published version $VERSION. Promote manifest explicitly after verification."