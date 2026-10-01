import { getAllThematicTags } from './tags_thematic.js';
import { getAllGenreIdentityTags } from './tags_genre_identity.js';
import { getAllGenreTropes } from './tags_genre_tropes.js';

var allKnownTagsCache = null;
export function getAllKnownTags() {
  if (allKnownTagsCache) return allKnownTagsCache;
  allKnownTagsCache = new Set();
  for (const t of getAllGenreIdentityTags()) allKnownTagsCache.add(t.replace(/^genre:/, ""));
  for (const t of getAllGenreTropes()) allKnownTagsCache.add(t.replace(/^genre:/, ""));
  for (const t of getAllThematicTags()) allKnownTagsCache.add(t.replace(/^genre:/, ""));
  return allKnownTagsCache;
}
export function parseSearchTokens(queryString) {
  const includeTags = [];
  const excludeTags = [];
  if (!queryString) return { includeTags, excludeTags };
  const allKnownTags = getAllKnownTags();
  const tokens = queryString.split(/[\s,]+/).filter(Boolean);
  let i = 0;
  let nextIsExclude = false;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === "-") {
      nextIsExclude = true;
      i++;
      continue;
    }
    if (token === "+") {
      nextIsExclude = false;
      i++;
      continue;
    }
    let isExclude = nextIsExclude || token.startsWith("-");
    let raw = token.replace(/^[-+]/, "").replace(/,+$/, "").trim().replace(/^t_/, "");
    let matched = raw;
    let consumed = 1;
    for (let len = Math.min(4, tokens.length - i); len > 1; len--) {
      const candidate = tokens.slice(i, i + len).map((t) => t.replace(/^[-+]/, "").replace(/,+$/, "").trim().replace(/^t_/, "")).join("_");
      if (allKnownTags.has(candidate)) {
        matched = candidate;
        consumed = len;
        break;
      }
    }
    let cleanTag = matched;
    if (cleanTag && !cleanTag.includes(":")) {
      const thematic = getAllThematicTags();
      if (!thematic.includes(cleanTag)) {
        const allIdentities = getAllGenreIdentityTags();
        const allTropes = getAllGenreTropes();
        if (allIdentities.includes("genre:" + cleanTag) || allTropes.includes("genre:" + cleanTag)) {
          cleanTag = "genre:" + cleanTag;
        }
      }
    }
    if (cleanTag) {
      if (isExclude) {
        excludeTags.push(cleanTag);
      } else {
        includeTags.push(cleanTag);
      }
    }
    nextIsExclude = false;
    i += consumed;
  }
  return { includeTags, excludeTags };
}

