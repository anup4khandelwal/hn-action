import { readFile } from "fs/promises";
import path from "path";
import type { PublishedItem } from "../../utils/types";

export async function getPublishedItems(): Promise<PublishedItem[]> {
  const filePath = path.join(process.cwd(), "data", "published.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item && item.publishedAt)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  } catch {
    return [];
  }
}
