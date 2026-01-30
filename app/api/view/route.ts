import { readFile, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ANALYTICS_PATH = path.join(process.cwd(), "data", "analytics.json");

export async function POST(request: Request) {
  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id || typeof id !== "string") {
    return new Response("Invalid id", { status: 400 });
  }

  const now = new Date().toISOString();
  const analytics = await readAnalytics();
  const entry = analytics[id] || { count: 0, lastViewedAt: null };

  analytics[id] = {
    count: entry.count + 1,
    lastViewedAt: now,
  };

  await writeFile(ANALYTICS_PATH, JSON.stringify(analytics, null, 2) + "\n");

  return new Response(JSON.stringify(analytics[id]), {
    headers: { "Content-Type": "application/json" },
  });
}

async function readAnalytics() {
  try {
    const raw = await readFile(ANALYTICS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
