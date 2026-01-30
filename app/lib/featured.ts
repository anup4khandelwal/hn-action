import { readFile } from "fs/promises";
import path from "path";

export async function getFeaturedId(): Promise<string | null> {
  const filePath = path.join(process.cwd(), "data", "featured.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data.id === "string" ? data.id : null;
  } catch {
    return null;
  }
}
