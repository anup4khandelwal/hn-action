import type { PendingItem, PublishedItem } from "./types";
import tagsConfig from "../data/tags.json";

export type DraftFields = {
  whyThisMatters: string;
  tryThis: string;
  timeEstimate: PublishedItem["timeEstimate"];
  tags: string[];
};

const TAG_RULES: Array<{ tag: string; keywords: string[] }> =
  (tagsConfig?.rules as Array<{ tag: string; keywords: string[] }>) || [];

function detectTags(title: string) {
  const lower = title.toLowerCase();
  const tags = new Set<string>();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      tags.add(rule.tag);
    }
  }
  if (tags.size === 0) {
    const fallback = tagsConfig?.tags?.[0] || "tooling";
    tags.add(fallback);
  }
  return Array.from(tags);
}

function detectTimeEstimate(title: string): PublishedItem["timeEstimate"] {
  const lower = title.toLowerCase();
  if (
    lower.includes("benchmark") ||
    lower.includes("evaluation") ||
    lower.includes("eval") ||
    lower.includes("dataset") ||
    lower.includes("safety")
  ) {
    return "2h";
  }
  if (lower.includes("demo") || lower.includes("tutorial")) {
    return "30m";
  }
  return "30m";
}

export function autoDraft(item: PendingItem): DraftFields {
  const title = item.title.replace(/\s+/g, " ").trim();
  const tags = detectTags(title);
  const timeEstimate = detectTimeEstimate(title);

  const whyThisMatters =
    `Builders are discussing "${title}," which signals a real need in AI tooling or workflows. ` +
    `If this approach works, teams can reduce manual effort and ship experiments faster. ` +
    `That matters now because iteration speed is the main advantage in AI product work.`;

  const tryThis =
    `Skim the original discussion and extract one concrete idea or workflow change. ` +
    `Implement the smallest possible prototype (script, repo fork, or config change), then measure time saved or failure points. ` +
    `Write down what breaks first and whether the idea is worth keeping.`;

  return { whyThisMatters, tryThis, timeEstimate, tags };
}
