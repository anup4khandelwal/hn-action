import { canonicalizeUrl } from "../utils/canonicalizeUrl.js";
import { autoDraft } from "../utils/autoDraft.js";

const DEFAULT_SUBREDDITS = [
  "MachineLearning",
  "LocalLLaMA",
  "OpenAI",
  "Artificial",
  "LangChain",
  "AutoGPT",
  "datascience",
];

const USER_AGENT = "HN-Action-Bot/1.0 (https://github.com/hn-action)";

function toContentItem(post) {
  const title = post.title || "Untitled Reddit Post";
  const discussionUrl = `https://www.reddit.com${post.permalink}`;
  const outboundUrl = post.url || discussionUrl;
  const canonicalUrl = canonicalizeUrl(outboundUrl) || canonicalizeUrl(discussionUrl);

  if (!canonicalUrl || !discussionUrl) return null;

  const base = {
    id: `reddit-${post.id}`,
    title,
    source: "reddit",
    discussionUrl,
    canonicalUrl,
    createdAt: post.created_utc
      ? new Date(post.created_utc * 1000).toISOString()
      : new Date().toISOString(),
    status: "pending",
  };

  return {
    ...base,
    ...autoDraft(base),
  };
}

export async function fetchRedditItems({ subreddits = DEFAULT_SUBREDDITS } = {}) {
  const responses = await Promise.all(
    subreddits.map(async (subreddit) => {
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!response.ok) {
        console.warn(`Reddit fetch failed: ${url} ${response.status}`);
        return null;
      }
      return response.json();
    })
  );

  const posts = responses
    .filter(Boolean)
    .flatMap((payload) => payload?.data?.children || [])
    .map((child) => child.data)
    .filter(Boolean);

  return posts.map((post) => toContentItem(post)).filter(Boolean);
}
