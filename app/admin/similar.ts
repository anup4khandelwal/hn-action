import type { PendingItem, PublishedItem } from "../../utils/types";

export function findSimilarItems(
  target: PendingItem,
  published: PublishedItem[]
) {
  const normalizedTarget = normalizeText(target.title);

  return published
    .map((item) => {
      const score = similarityScore(normalizedTarget, normalizeText(item.title));
      const urlMatch = target.canonicalUrl === item.canonicalUrl;
      return { item, score: urlMatch ? 1 : score };
    })
    .filter((entry) => entry.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function similarityScore(aTokens: string[], bTokens: string[]) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  const intersection = Array.from(a).filter((token) => b.has(token));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}
