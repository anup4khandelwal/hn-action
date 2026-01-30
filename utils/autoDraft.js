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

  const lower = title.toLowerCase();
  const isShow = lower.startsWith("show hn") || lower.includes("show hn");
  const isAsk = lower.startsWith("ask hn") || lower.includes("ask hn");

  let whyThisMatters =
    `Builders are discussing "${title}," which signals a real need in AI tooling or workflows. ` +
    `If this approach works, teams can reduce manual effort and ship experiments faster. ` +
    `That matters now because iteration speed is the main advantage in AI product work.`;

  let tryThis =
    `Skim the original discussion and extract one concrete idea or workflow change. ` +
    `Implement the smallest possible prototype (script, repo fork, or config change), then measure time saved or failure points. ` +
    `Write down what breaks first and whether the idea is worth keeping.`;

  if (isShow) {
    whyThisMatters =
      `Show HN threads like "${title}" often surface new tools before they become mainstream. ` +
      `A quick hands-on test can reveal whether the tool is production-ready or just a demo. ` +
      `That matters because small teams need reliable shortcuts, not prototypes that collapse in real workflows.`;
    tryThis =
      `Run the demo or repo, then replicate a single real workflow you already do today. ` +
      `Measure setup time, rough edges, and the first point of failure. ` +
      `If it saves time twice in a row, consider adopting it or contributing a fix.`;
  } else if (isAsk) {
    whyThisMatters =
      `Ask HN posts like "${title}" reveal pain points that many builders share. ` +
      `The answers often point to which tools are usable versus hype. ` +
      `That matters because picking the wrong stack can cost weeks of iteration.`;
    tryThis =
      `Pick two suggested tools, run a 30-minute bake-off, and compare output quality and setup friction. ` +
      `Document the winner and the reason, then share the result back in the thread.`;
  } else if (item.source === "reddit") {
    whyThisMatters =
      `Reddit discussions around "${title}" usually represent hands-on builder feedback. ` +
      `If a pattern shows up repeatedly, it likely reflects a real gap in tooling. ` +
      `That matters because practical feedback often beats vendor marketing.`;
    tryThis =
      `Prototype the smallest possible version of the idea discussed, even if it’s a script or notebook. ` +
      `Test it against one real input, log the failure points, and decide whether to keep iterating.`;
  }

  return { whyThisMatters, tryThis, timeEstimate, tags };
}
