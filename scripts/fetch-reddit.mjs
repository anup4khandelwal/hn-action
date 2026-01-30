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

function decodeEntities(input) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractLinkHref(block) {
  const match = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
  return match ? match[1] : "";
}

function extractOutboundUrl(content) {
  const match = content.match(/href="([^"]+)"/i);
  return match ? decodeEntities(match[1]) : "";
}

function splitEntries(xml) {
  return xml
    .split(/<entry>/i)
    .slice(1)
    .map((chunk) => chunk.split(/<\/entry>/i)[0]);
}

function toContentItem(entryXml) {
  const title = decodeEntities(extractTagValue(entryXml, "title")) || "Untitled Reddit Post";
  const discussionUrl = extractLinkHref(entryXml);
  const content = extractTagValue(entryXml, "content");
  const outboundUrl = extractOutboundUrl(content);
  const canonicalUrl = canonicalizeUrl(outboundUrl || discussionUrl);
  const idRaw = extractTagValue(entryXml, "id");
  const updated = extractTagValue(entryXml, "updated");

  if (!canonicalUrl || !discussionUrl) return null;

  const base = {
    id: `reddit-${idRaw || discussionUrl}`,
    title,
    source: "reddit",
    discussionUrl,
    canonicalUrl,
    createdAt: updated ? new Date(updated).toISOString() : new Date().toISOString(),
    status: "pending",
  };

  return {
    ...base,
    ...autoDraft(base),
  };
}

export async function fetchRedditItems({ subreddits = DEFAULT_SUBREDDITS } = {}) {
  const feeds = subreddits.map((subreddit) =>
    `https://www.reddit.com/r/${subreddit}/.rss?limit=25`
  );

  const responses = await Promise.all(
    feeds.map(async (feedUrl) => {
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!response.ok) {
        throw new Error(`Reddit fetch failed: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
  );

  const entries = responses.flatMap((xml) => splitEntries(xml));

  return entries
    .map((entryXml) => toContentItem(entryXml))
    .filter(Boolean);
}
