const TAG_RULES = [
  { tag: "agents", keywords: ["agent", "agents", "autonomous"] },
  { tag: "evals", keywords: ["eval", "evaluation", "benchmark", "harness"] },
  { tag: "safety", keywords: ["safety", "alignment", "risk", "guardrail"] },
  { tag: "tooling", keywords: ["tool", "tooling", "cli", "sdk", "library"] },
  { tag: "infra", keywords: ["infra", "pipeline", "deployment", "ops"] },
  { tag: "cost", keywords: ["cost", "pricing", "billing", "credits"] },
  { tag: "data", keywords: ["dataset", "data", "schema", "etl"] },
  { tag: "finance", keywords: ["stock", "trading", "finance", "portfolio"] },
  { tag: "vision", keywords: ["image", "vision", "video", "3d"] },
  { tag: "rag", keywords: ["retrieval", "rag", "search"] },
  { tag: "prompt", keywords: ["prompt", "prompting"] },
  { tag: "agents-tools", keywords: ["tool calling", "function calling"] },
  { tag: "security", keywords: ["security", "privacy", "sandbox"] },
];

function detectTags(title) {
  const lower = title.toLowerCase();
  const tags = new Set();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      tags.add(rule.tag);
    }
  }
  if (tags.size === 0) {
    tags.add("tooling");
  }
  return Array.from(tags);
}

function detectTimeEstimate(title) {
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

export function autoDraft(item) {
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
