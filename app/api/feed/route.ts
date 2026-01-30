import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "published.json");
  try {
    const raw = await readFile(filePath, "utf8");
    return new Response(raw, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return new Response("[]", {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
