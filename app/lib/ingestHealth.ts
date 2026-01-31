import { readFile } from "fs/promises";
import path from "path";

export type IngestHealth = {
  lastRunAt: string | null;
  counts: {
    total: number;
    hn: number;
    reddit: number;
  };
};

export async function getIngestHealth(): Promise<IngestHealth> {
  const filePath = path.join(process.cwd(), "data", "ingest-health.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid ingest health");
    }
    return data as IngestHealth;
  } catch {
    return { lastRunAt: null, counts: { total: 0, hn: 0, reddit: 0 } };
  }
}
