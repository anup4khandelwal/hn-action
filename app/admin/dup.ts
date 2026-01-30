import type { PendingItem, PublishedItem } from "../../utils/types";

export type DuplicateHint = {
  title: string;
  discussionUrl: string;
  reason: string;
};

export function detectDuplicates(
  item: PendingItem,
  pending: PendingItem[],
  published: PublishedItem[]
): DuplicateHint[] {
  const hints: DuplicateHint[] = [];
  const title = item.title.toLowerCase();

  for (const existing of published) {
    if (existing.canonicalUrl === item.canonicalUrl) {
      hints.push({
        title: existing.title,
        discussionUrl: existing.discussionUrl,
        reason: "Same canonical URL",
      });
      break;
    }
    if (titleSimilarity(title, existing.title.toLowerCase()) > 0.72) {
      hints.push({
        title: existing.title,
        discussionUrl: existing.discussionUrl,
        reason: "Similar title",
      });
      break;
    }
  }

  const pendingDup = pending.find(
    (other) => other.id !== item.id && other.canonicalUrl === item.canonicalUrl
  );
  if (pendingDup) {
    hints.push({
      title: pendingDup.title,
      discussionUrl: pendingDup.discussionUrl,
      reason: "Pending with same URL",
    });
  }

  return hints;
}

function titleSimilarity(a: string, b: string) {
  const aTokens = new Set(a.split(/\s+/).filter(Boolean));
  const bTokens = new Set(b.split(/\s+/).filter(Boolean));
  const intersection = Array.from(aTokens).filter((t) => bTokens.has(t));
  const union = new Set([...aTokens, ...bTokens]);
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}
