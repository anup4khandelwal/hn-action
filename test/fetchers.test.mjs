import assert from "node:assert/strict";
import { readFile } from "fs/promises";
import { fetchHNItems } from "../scripts/fetch-hn.mjs";
import { fetchRedditItems } from "../scripts/fetch-reddit.mjs";
import { canonicalizeUrl } from "../utils/canonicalizeUrl.js";

const hnFixture = new URL("./fixtures/hn.json", import.meta.url);
const redditFixture = new URL("./fixtures/reddit.rss", import.meta.url);

const originalFetch = global.fetch;

function mockFetchOnce(jsonPath, asText = false) {
  global.fetch = async () => {
    const data = await readFile(jsonPath, "utf8");
    return {
      ok: true,
      json: async () => JSON.parse(data),
      text: async () => data,
    };
  };
}

async function run() {
  mockFetchOnce(hnFixture);
  const hnItems = await fetchHNItems({ keywords: ["agent"], hitsPerPage: 2 });
  assert.equal(hnItems.length, 2);
  assert.equal(hnItems[0].canonicalUrl, "https://example.com/agent-eval");

  mockFetchOnce(redditFixture, true);
  const redditItems = await fetchRedditItems({ subreddits: ["LocalLLaMA"] });
  assert.equal(redditItems.length, 2);
  assert.equal(
    redditItems[0].canonicalUrl,
    "https://example.com/router"
  );
  assert.equal(
    redditItems[1].canonicalUrl,
    "https://www.reddit.com/r/OpenAI/comments/def456/eval_harness"
  );

  assert.equal(
    canonicalizeUrl("https://example.com/path/?utm_source=hn"),
    "https://example.com/path"
  );

  console.log("Fetcher tests passed.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    global.fetch = originalFetch;
  });
