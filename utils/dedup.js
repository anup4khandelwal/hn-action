export function dedupByCanonicalUrl(incoming, existing) {
  const seen = new Set(existing.map((item) => item.canonicalUrl));
  const unique = [];

  for (const item of incoming) {
    const normalized = item.canonicalUrl?.trim().toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    if (unique.some((candidate) => candidate.canonicalUrl === normalized)) {
      continue;
    }
    unique.push({ ...item, canonicalUrl: normalized });
  }

  return unique;
}
