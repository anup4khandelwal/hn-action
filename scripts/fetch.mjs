import { readFile, writeFile } from "fs/promises";
import { fetchHNItems } from "./fetch-hn.mjs";
import { fetchRedditItems } from "./fetch-reddit.mjs";
import { dedupByCanonicalUrl } from "../utils/dedup.js";

const PENDING_PATH = new URL("../data/pending.json", import.meta.url);
const PUBLISHED_PATH = new URL("../data/published.json", import.meta.url);
const CONFIG_PATH = new URL("../data/ingest-config.json", import.meta.url);

async function readJsonArray(path) {
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeJson(path, data) {
  const body = JSON.stringify(data, null, 2) + "\n";
  await writeFile(path, body, "utf8");
}

async function run() {
  const [pending, published] = await Promise.all([
    readJsonArray(PENDING_PATH),
    readJsonArray(PUBLISHED_PATH),
  ]);

  const config = await readConfig();

  const [hnItems, redditItems] = await Promise.all([
    fetchHNItems(config.hn),
    fetchRedditItems(config.reddit),
  ]);

  const incoming = [...hnItems, ...redditItems];
  const deduped = dedupByCanonicalUrl(incoming, [...pending, ...published]);

  if (deduped.length === 0) {
    console.log("No new items.");
    return;
  }

  const maxPending = config.maxPending ?? 200;
  const updatedPending = [...deduped, ...pending].slice(0, maxPending);
  await writeJson(PENDING_PATH, updatedPending);

  console.log(`Added ${deduped.length} new items to pending.json.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
