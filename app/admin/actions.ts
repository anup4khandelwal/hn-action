"use server";

import { readFile, writeFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PendingItem, PublishedItem } from "../../utils/types";
import { autoDraft } from "../../utils/autoDraft";

const DATA_DIR = path.join(process.cwd(), "data");
const PENDING_PATH = path.join(DATA_DIR, "pending.json");
const PUBLISHED_PATH = path.join(DATA_DIR, "published.json");
const ARCHIVE_PATH = path.join(DATA_DIR, "archived.json");
const FEATURED_PATH = path.join(DATA_DIR, "featured.json");
const execFileAsync = promisify(execFile);

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeJson(filePath: string, data: unknown) {
  const body = JSON.stringify(data, null, 2) + "\n";
  await writeFile(filePath, body, "utf8");
}

function requireAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    redirect("/admin?error=missing");
  }
  return (async () => {
    const store = await getCookieStore();
    const auth = store.get("admin_auth");
    if (!auth || auth.value !== "1") {
      redirect("/admin?error=unauthorized");
    }
  })();
}

export async function loginAction(formData: FormData) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    redirect("/admin?error=missing");
  }
  const provided = String(formData.get("password") || "");
  if (provided !== password) {
    redirect("/admin?error=invalid");
  }

  const store = await getCookieStore();
  store.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin");
}

export async function logoutAction() {
  const store = await getCookieStore();
  store.set("admin_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/admin");
}

export async function approveAction(formData: FormData) {
  await requireAdmin();

  const pendingId = String(formData.get("id") || "");
  const whyThisMatters = String(formData.get("whyThisMatters") || "").trim();
  const tryThis = String(formData.get("tryThis") || "").trim();
  const timeEstimate = String(formData.get("timeEstimate") || "");
  const tagsRaw = String(formData.get("tags") || "");

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!pendingId || !whyThisMatters || !tryThis || !timeEstimate) {
    redirect("/admin?error=missing-fields");
  }
  if (!passesQualityChecks(whyThisMatters, tryThis)) {
    redirect("/admin?error=quality");
  }

  const [pending, published] = await Promise.all([
    readJsonArray<PendingItem>(PENDING_PATH),
    readJsonArray<PublishedItem>(PUBLISHED_PATH),
  ]);

  const pendingItem = pending.find((item) => item.id === pendingId);
  if (!pendingItem) {
    redirect("/admin?error=not-found");
  }

  const updatedPending = pending.filter((item) => item.id !== pendingId);

  const publishedItem: PublishedItem = {
    id: pendingItem.id,
    title: pendingItem.title,
    source: pendingItem.source,
    discussionUrl: pendingItem.discussionUrl,
    canonicalUrl: pendingItem.canonicalUrl,
    whyThisMatters,
    tryThis,
    timeEstimate: timeEstimate as PublishedItem["timeEstimate"],
    tags,
    publishedAt: new Date().toISOString(),
  };

  const updatedPublished = [publishedItem, ...published];

  await Promise.all([
    writeJson(PENDING_PATH, updatedPending),
    writeJson(PUBLISHED_PATH, updatedPublished),
  ]);

  redirect("/admin");
}

export async function rejectAction(formData: FormData) {
  await requireAdmin();

  const pendingId = String(formData.get("id") || "");
  if (!pendingId) {
    redirect("/admin?error=not-found");
  }

  const pending = await readJsonArray<PendingItem>(PENDING_PATH);
  const updatedPending = pending.filter((item) => item.id !== pendingId);
  await writeJson(PENDING_PATH, updatedPending);

  redirect("/admin");
}

export async function updatePendingAction(formData: FormData) {
  await requireAdmin();

  const pendingId = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const canonicalUrl = String(formData.get("canonicalUrl") || "").trim();
  const discussionUrl = String(formData.get("discussionUrl") || "").trim();

  if (!pendingId || !title || !canonicalUrl || !discussionUrl) {
    redirect("/admin?error=missing-fields");
  }

  const pending = await readJsonArray<PendingItem>(PENDING_PATH);
  const updated = pending.map((item) => {
    if (item.id !== pendingId) return item;
    return {
      ...item,
      title,
      canonicalUrl,
      discussionUrl,
    };
  });

  await writeJson(PENDING_PATH, updated);
  redirect("/admin");
}

async function getCookieStore() {
  const store = cookies();
  return typeof (store as Promise<ReturnType<typeof cookies>>).then === "function"
    ? await store
    : store;
}

export async function editPublishedAction(formData: FormData) {
  await requireAdmin();

  const publishedId = String(formData.get("id") || "");
  const whyThisMatters = String(formData.get("whyThisMatters") || "").trim();
  const tryThis = String(formData.get("tryThis") || "").trim();
  const timeEstimate = String(formData.get("timeEstimate") || "");
  const tagsRaw = String(formData.get("tags") || "");

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!publishedId || !whyThisMatters || !tryThis || !timeEstimate) {
    redirect("/admin?error=missing-fields");
  }
  if (!passesQualityChecks(whyThisMatters, tryThis)) {
    redirect("/admin?error=quality");
  }

  const published = await readJsonArray<PublishedItem>(PUBLISHED_PATH);
  const updated = published.map((item) => {
    if (item.id !== publishedId) return item;
    return {
      ...item,
      whyThisMatters,
      tryThis,
      timeEstimate: timeEstimate as PublishedItem["timeEstimate"],
      tags,
    };
  });

  await writeJson(PUBLISHED_PATH, updated);
  redirect("/admin");
}

export async function unpublishAction(formData: FormData) {
  await requireAdmin();

  const publishedId = String(formData.get("id") || "");
  if (!publishedId) {
    redirect("/admin?error=not-found");
  }

  const [pending, published] = await Promise.all([
    readJsonArray<PendingItem>(PENDING_PATH),
    readJsonArray<PublishedItem>(PUBLISHED_PATH),
  ]);

  const publishedItem = published.find((item) => item.id === publishedId);
  if (!publishedItem) {
    redirect("/admin?error=not-found");
  }

  const updatedPublished = published.filter((item) => item.id !== publishedId);
  const updatedPending = [
    {
      id: publishedItem.id,
      title: publishedItem.title,
      source: publishedItem.source,
      discussionUrl: publishedItem.discussionUrl,
      canonicalUrl: publishedItem.canonicalUrl,
      createdAt: new Date().toISOString(),
      status: "pending",
    } as PendingItem,
    ...pending,
  ];

  await Promise.all([
    writeJson(PENDING_PATH, updatedPending),
    writeJson(PUBLISHED_PATH, updatedPublished),
  ]);

  redirect("/admin");
}

export async function archiveAction(formData: FormData) {
  await requireAdmin();

  const publishedId = String(formData.get("id") || "");
  if (!publishedId) {
    redirect("/admin?error=not-found");
  }

  const [archived, published] = await Promise.all([
    readJsonArray<PublishedItem>(ARCHIVE_PATH),
    readJsonArray<PublishedItem>(PUBLISHED_PATH),
  ]);

  const target = published.find((item) => item.id === publishedId);
  if (!target) {
    redirect("/admin?error=not-found");
  }

  const updatedPublished = published.filter((item) => item.id !== publishedId);
  const updatedArchived = [{ ...target }, ...archived];

  await Promise.all([
    writeJson(PUBLISHED_PATH, updatedPublished),
    writeJson(ARCHIVE_PATH, updatedArchived),
  ]);

  redirect("/admin");
}

export async function setFeaturedAction(formData: FormData) {
  await requireAdmin();
  const featuredId = String(formData.get("id") || "");
  if (!featuredId) {
    redirect("/admin?error=not-found");
  }
  await writeJson(FEATURED_PATH, { id: featuredId });
  redirect("/admin");
}

export async function seedPendingAction() {
  await requireAdmin();

  const pending = await readJsonArray<PendingItem>(PENDING_PATH);
  const now = new Date();
  const seed = [
    {
      id: `seed-hn-${now.getTime()}`,
      title: "Local eval loop for coding agents",
      source: "hn",
      discussionUrl: "https://news.ycombinator.com/item?id=123456",
      canonicalUrl: "https://example.com/local-eval-loop",
      createdAt: now.toISOString(),
      status: "pending",
    },
    {
      id: `seed-reddit-${now.getTime()}-a`,
      title: "Agent tool logging template you can reuse",
      source: "reddit",
      discussionUrl: "https://www.reddit.com/r/LocalLLaMA/comments/abcdef/tool_logging_template/",
      canonicalUrl: "https://example.com/agent-tool-logging",
      createdAt: now.toISOString(),
      status: "pending",
    },
    {
      id: `seed-hn-${now.getTime()}-b`,
      title: "Prompt router for multi-model triage",
      source: "hn",
      discussionUrl: "https://news.ycombinator.com/item?id=654321",
      canonicalUrl: "https://example.com/prompt-router",
      createdAt: now.toISOString(),
      status: "pending",
    },
  ] as PendingItem[];

  await writeJson(PENDING_PATH, [...seed, ...pending]);
  redirect("/admin");
}

export async function runIngestAction() {
  await requireAdmin();

  try {
    await execFileAsync("node", ["scripts/fetch.mjs"], {
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error(error);
    redirect("/admin?error=ingest-failed");
  }

  redirect("/admin");
}

export async function bulkRejectAction() {
  await requireAdmin();

  await writeJson(PENDING_PATH, []);
  redirect("/admin");
}

export async function bulkApproveAction(formData: FormData) {
  await requireAdmin();

  const whyThisMatters = String(formData.get("whyThisMatters") || "").trim();
  const tryThis = String(formData.get("tryThis") || "").trim();
  const timeEstimate = String(formData.get("timeEstimate") || "");
  const tagsRaw = String(formData.get("tags") || "");

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!whyThisMatters || !tryThis || !timeEstimate) {
    redirect("/admin?error=missing-fields");
  }
  if (!passesQualityChecks(whyThisMatters, tryThis)) {
    redirect("/admin?error=quality");
  }

  const [pending, published] = await Promise.all([
    readJsonArray<PendingItem>(PENDING_PATH),
    readJsonArray<PublishedItem>(PUBLISHED_PATH),
  ]);

  if (pending.length === 0) {
    redirect("/admin");
  }

  const now = new Date().toISOString();
  const approved = pending.map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    discussionUrl: item.discussionUrl,
    canonicalUrl: item.canonicalUrl,
    whyThisMatters,
    tryThis,
    timeEstimate: timeEstimate as PublishedItem["timeEstimate"],
    tags,
    publishedAt: now,
  }));

  await Promise.all([
    writeJson(PENDING_PATH, []),
    writeJson(PUBLISHED_PATH, [...approved, ...published]),
  ]);

  redirect("/admin");
}

export async function quickApproveAction(formData: FormData) {
  await requireAdmin();

  const count = Number(formData.get("count") || 5);
  const pending = await readJsonArray<PendingItem>(PENDING_PATH);
  const published = await readJsonArray<PublishedItem>(PUBLISHED_PATH);
  const slice = pending.slice(0, Math.max(1, count));

  if (slice.length === 0) {
    redirect("/admin");
  }

  const approved = slice.map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    discussionUrl: item.discussionUrl,
    canonicalUrl: item.canonicalUrl,
    whyThisMatters: item.whyThisMatters || autoDraft(item).whyThisMatters,
    tryThis: item.tryThis || autoDraft(item).tryThis,
    timeEstimate: (item.timeEstimate ||
      autoDraft(item).timeEstimate) as PublishedItem["timeEstimate"],
    tags: item.tags || autoDraft(item).tags,
    publishedAt: new Date().toISOString(),
  }));

  const updatedPending = pending.slice(slice.length);
  await Promise.all([
    writeJson(PENDING_PATH, updatedPending),
    writeJson(PUBLISHED_PATH, [...approved, ...published]),
  ]);

  redirect("/admin");
}

function passesQualityChecks(whyThisMatters: string, tryThis: string) {
  const minLength = 120;
  const combined = `${whyThisMatters} ${tryThis}`.trim();
  const banned = ["click here", "subscribe", "buy now", "limited time"];
  const hasBanned = banned.some((phrase) =>
    combined.toLowerCase().includes(phrase)
  );
  return combined.length >= minLength && !hasBanned;
}
