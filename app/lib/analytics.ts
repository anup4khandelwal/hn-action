import { readFile } from "fs/promises";
import path from "path";

export type ViewCounts = Record<string, { count: number; lastViewedAt: string | null }>;

export async function getViewCounts(): Promise<ViewCounts> {
  const filePath = path.join(process.cwd(), "data", "analytics.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}
