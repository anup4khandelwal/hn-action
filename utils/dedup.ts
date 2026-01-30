import type { ContentItem } from "./types";

export function dedupByCanonicalUrl<T extends { canonicalUrl: string }>(
  incoming: T[],
  existing: ContentItem[]
): T[] {
  const seen = new Set(existing.map((item) => item.canonicalUrl));
  const unique: T[] = [];

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
