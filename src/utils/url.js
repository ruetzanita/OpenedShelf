import { parseSearchTokens } from '../search_utils.js';

export function buildToggleUrl(currentQuery, tag) {
  if (!currentQuery) {
    return "/?q=" + encodeURIComponent(tag);
  }
  const { includeTags, excludeTags } = parseSearchTokens(currentQuery);
  let newParts = [];
  let removed = false;
  for (const t of includeTags) {
    if (t === tag) {
      removed = true;
    } else {
      newParts.push(t);
    }
  }
  for (const t of excludeTags) {
    if (t === tag) {
      removed = true;
    } else {
      newParts.push("-" + t);
    }
  }
  if (!removed) {
    newParts.push(tag);
  }
  const newQuery = newParts.join(" ");
  if (!newQuery) return "/";
  return "/?q=" + encodeURIComponent(newQuery);
}

