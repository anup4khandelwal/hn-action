import assert from "node:assert/strict";
import { canonicalizeUrl } from "../utils/canonicalizeUrl.js";
import { dedupByCanonicalUrl } from "../utils/dedup.js";

const canonicalCases = [
  {
    input: "https://example.com/?utm_source=hn&utm_medium=social",
    expected: "https://example.com",
  },
  {
    input: "https://example.com/path/?ref=reddit&utm_campaign=ai",
    expected: "https://example.com/path/",
  },
  {
    input: "https://Example.com/#section",
    expected: "https://example.com",
  },
];

for (const test of canonicalCases) {
  assert.equal(canonicalizeUrl(test.input), test.expected);
}

const deduped = dedupByCanonicalUrl(
  [
    { canonicalUrl: "https://a.com" },
    { canonicalUrl: "https://b.com" },
    { canonicalUrl: "https://a.com" },
  ],
  [{ canonicalUrl: "https://c.com" }, { canonicalUrl: "https://b.com" }]
);

assert.deepEqual(deduped, [{ canonicalUrl: "https://a.com" }]);

console.log("Sample tests passed.");
