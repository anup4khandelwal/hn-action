import { canonicalizeUrl } from "../utils/canonicalizeUrl.js";
import { autoDraft } from "../utils/autoDraft.js";

const HN_ENDPOINT = "https://hn.algolia.com/api/v1/search_by_date";

const DEFAULT_KEYWORDS = [
  "agent",
  "agents",
  "codex",
  "claude",
  "evals",
  "tooling",
  "llm",
  "ai",
  "prompt",
  "function calling",
];

function toTitle(hit) {
  return (
    hit.title ||
    hit.story_title ||
    hit.comment_text ||
    hit.story_text ||
    "Untitled HN Discussion"
  );
}

function toStoryUrl(hit) {
  return hit.url || hit.story_url || null;
}

function toDiscussionUrl(hit) {
  return `https://news.ycombinator.com/item?id=${hit.objectID}`;
}

function toContentItem(hit) {
  const storyUrl = toStoryUrl(hit);
  const canonicalUrl = canonicalizeUrl(storyUrl || toDiscussionUrl(hit));

  if (!canonicalUrl) return null;

  const base = {
    id: `hn-${hit.objectID}`,
    title: toTitle(hit),
    source: "hn",
    discussionUrl: toDiscussionUrl(hit),
    canonicalUrl,
    createdAt: new Date(hit.created_at).toISOString(),
    status: "pending",
  };

  return {
    ...base,
    ...autoDraft(base),
  };
}

export async function fetchHNItems({ keywords = DEFAULT_KEYWORDS, hitsPerPage = 20 } = {}) {
  const queries = keywords.map((keyword) => {
    const url = new URL(HN_ENDPOINT);
    url.searchParams.set("query", keyword);
    url.searchParams.set("tags", "story");
    url.searchParams.set("hitsPerPage", String(hitsPerPage));
    return url.toString();
  });

  const responses = await Promise.all(
    queries.map(async (queryUrl) => {
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error(`HN fetch failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
  );

  const items = responses.flatMap((payload) => payload.hits || []);

  return items
    .map((hit) => toContentItem(hit))
    .filter(Boolean);
}
