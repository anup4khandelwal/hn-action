import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import type { PublishedItem } from "../../../utils/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new Response("ADMIN_PASSWORD is not set.", { status: 500 });
  }

  const store = await getCookieStore();
  const authed = store.get("admin_auth")?.value === "1";
  if (!authed) {
    return new Response("Unauthorized", { status: 401 });
  }

  const filePath = path.join(process.cwd(), "data", "published.json");
  const raw = await readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const items: PublishedItem[] = Array.isArray(data) ? data : [];

  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  if (format === "csv") {
    const csv = toCsv(items);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=published.csv",
      },
    });
  }

  return new Response(JSON.stringify(items, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function toCsv(items: PublishedItem[]) {
  const headers = [
    "id",
    "title",
    "source",
    "discussionUrl",
    "canonicalUrl",
    "whyThisMatters",
    "tryThis",
    "timeEstimate",
    "tags",
    "publishedAt",
  ];

  const rows = items.map((item) => [
    item.id,
    item.title,
    item.source,
    item.discussionUrl,
    item.canonicalUrl,
    item.whyThisMatters,
    item.tryThis,
    item.timeEstimate,
    item.tags.join("|"),
    item.publishedAt,
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

function escapeCsv(value: string) {
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

async function getCookieStore() {
  const store = cookies();
  return typeof (store as Promise<ReturnType<typeof cookies>>).then === "function"
    ? await store
    : store;
}
