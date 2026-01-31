import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import {
  approveAction,
  editPublishedAction,
  bulkApproveAction,
  bulkRejectAction,
  archiveAction,
  quickApproveAction,
  loginAction,
  logoutAction,
  rejectAction,
  runIngestAction,
  seedPendingAction,
  updatePendingAction,
  unpublishAction,
  setFeaturedAction,
} from "./actions";
import AdminShortcuts from "./shortcuts";
import { findSimilarItems } from "./similar";
import { autoDraft } from "../../utils/autoDraft";
import { detectDuplicates } from "./dup";
import type { PendingItem, PublishedItem } from "../../utils/types";
import { getViewCounts } from "../lib/analytics";
import { getIngestHealth } from "../lib/ingestHealth";

export const dynamic = "force-dynamic";

async function getPendingItems(): Promise<PendingItem[]> {
  const filePath = path.join(process.cwd(), "data", "pending.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getPublishedItems(): Promise<PublishedItem[]> {
  const filePath = path.join(process.cwd(), "data", "published.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    pendingPage?: string;
    publishedPage?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const passwordSet = Boolean(process.env.ADMIN_PASSWORD);
  const store = await getCookieStore();
  const isAuthed = store.get("admin_auth")?.value === "1";
  const pending = isAuthed ? await getPendingItems() : [];
  const published = isAuthed ? await getPublishedItems() : [];
  const viewCounts = isAuthed ? await getViewCounts() : {};
  const ingestHealth = isAuthed ? await getIngestHealth() : null;
  const formatDateTime = (value: string) =>
    new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const pendingPage = Math.max(1, Number(resolvedSearchParams.pendingPage || 1));
  const publishedPage = Math.max(
    1,
    Number(resolvedSearchParams.publishedPage || 1)
  );
  const PAGE_SIZE = 10;
  const pendingPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const publishedPages = Math.max(1, Math.ceil(published.length / PAGE_SIZE));
  const pendingSlice = pending.slice(
    (pendingPage - 1) * PAGE_SIZE,
    pendingPage * PAGE_SIZE
  );
  const publishedSlice = published.slice(
    (publishedPage - 1) * PAGE_SIZE,
    publishedPage * PAGE_SIZE
  );
  const renderPagination = (type: "pending" | "published", page: number, total: number) => {
    if (total <= 1) return null;
    return (
      <div className="pagination">
        <span className="badge">
          Page {page} of {total}
        </span>
        <div className="pagination-actions">
          <a
            className="chip"
            href={buildPageLink(type, Math.max(1, page - 1))}
          >
            Prev
          </a>
          <a
            className="chip"
            href={buildPageLink(type, Math.min(total, page + 1))}
          >
            Next
          </a>
        </div>
      </div>
    );
  };
  const buildPageLink = (type: "pending" | "published", page: number) => {
    const params = new URLSearchParams();
    if (resolvedSearchParams.error) {
      params.set("error", resolvedSearchParams.error);
    }
    params.set("pendingPage", String(type === "pending" ? page : pendingPage));
    params.set(
      "publishedPage",
      String(type === "published" ? page : publishedPage)
    );
    return `/admin?${params.toString()}`;
  };

  return (
    <main suppressHydrationWarning>
      <AdminShortcuts />
      <header>
        <h1>HN → Action Admin</h1>
        <p>Approve or reject incoming discussions before they hit the site.</p>
      </header>

      {!passwordSet ? (
        <div className="empty">
          <p>
            ADMIN_PASSWORD is not set. Add it to your environment before using
            the admin panel.
          </p>
        </div>
      ) : !isAuthed ? (
        <section className="card">
          <h2>Sign in</h2>
          <p>Enter the admin password to manage pending items.</p>
          {resolvedSearchParams.error === "invalid" && (
            <p className="error">Password incorrect. Try again.</p>
          )}
          {resolvedSearchParams.error === "unauthorized" && (
            <p className="error">Session expired. Please sign in again.</p>
          )}
          <form action={loginAction} className="form">
            <label>
              <span>Password</span>
              <input name="password" type="password" required />
            </label>
            <button type="submit">Unlock admin</button>
          </form>
        </section>
      ) : (
        <section suppressHydrationWarning>
          <div className="admin-actions">
            <form action={logoutAction}>
              <button type="submit" className="ghost">
                Log out
              </button>
            </form>
            <div className="admin-meta">
              <span className="badge">Pending: {pending.length}</span>
              <span className="badge">Published: {published.length}</span>
              {ingestHealth && (
                <span className="badge">
                  Ingest: {ingestHealth.counts.hn} HN / {ingestHealth.counts.reddit} Reddit
                </span>
              )}
              {ingestHealth?.lastRunAt && (
                <span className="badge">
                  Last run: {formatDateTime(ingestHealth.lastRunAt)}
                </span>
              )}
              <form action={runIngestAction}>
                <button type="submit" className="ghost">
                  Run ingest now
                </button>
              </form>
              <form action={seedPendingAction}>
                <button type="submit" className="ghost">
                  Seed 3 demo items
                </button>
              </form>
              <a className="chip" href="/admin/export" target="_blank" rel="noreferrer">
                Export JSON
              </a>
              <a
                className="chip"
                href="/admin/export?format=csv"
                target="_blank"
                rel="noreferrer"
              >
                Export CSV
              </a>
            </div>
          </div>

          <details className="card">
            <summary>Bulk actions</summary>
            <form action={bulkApproveAction} className="form">
              <p>
                Approve all pending items with the same metadata. Useful for
                quick batches.
              </p>
              <label>
                <span>Why this matters</span>
                <textarea
                  name="whyThisMatters"
                  rows={3}
                  placeholder="2–3 lines on why the discussion matters."
                  required
                />
              </label>
              <label>
                <span>Try this</span>
                <textarea
                  name="tryThis"
                  rows={3}
                  placeholder="Actionable steps or repo link."
                  required
                />
              </label>
              <label>
                <span>Time estimate</span>
                <select name="timeEstimate" required>
                  <option value="">Select one</option>
                  <option value="15m">15m</option>
                  <option value="30m">30m</option>
                  <option value="2h">2h</option>
                </select>
              </label>
              <label>
                <span>Tags (comma-separated)</span>
                <input name="tags" placeholder="agents, evals, tooling" />
              </label>
              <div className="form-actions">
                <button type="submit">Approve all pending</button>
              </div>
            </form>
            <form action={bulkRejectAction}>
              <button type="submit" className="ghost">
                Clear pending queue
              </button>
            </form>
            <form action={quickApproveAction} className="form">
              <label>
                <span>Quick approve top N</span>
                <input name="count" type="number" min="1" max="25" defaultValue="5" />
              </label>
              <button type="submit">Approve top N</button>
            </form>
          </details>

          {resolvedSearchParams.error === "missing-fields" && (
            <p className="error">
              Fill in Why this matters, Try this, and a time estimate to approve.
            </p>
          )}
          {resolvedSearchParams.error === "quality" && (
            <p className="error">
              Add more detail. The combined text must be at least 120 characters, avoid promo phrases, and include at least 2 tags.
            </p>
          )}
          {resolvedSearchParams.error === "not-found" && (
            <p className="error">Item not found. Refresh the page.</p>
          )}
          {resolvedSearchParams.error === "ingest-failed" && (
            <p className="error">
              Ingestion failed. Check server logs for details.
            </p>
          )}

          <section className="stack">
            <h2>Pending queue</h2>
            {renderPagination("pending", pendingPage, pendingPages)}
            {pending.length === 0 ? (
              <div className="empty">
                <p>No pending items right now.</p>
              </div>
            ) : (
              pendingSlice.map((item) => (
                <article className="card" key={item.id}>
                  <h2>{item.title}</h2>
                  {(() => {
                    const dups = detectDuplicates(item, pending, published);
                    if (dups.length === 0) return null;
                    return (
                      <div className="card-sub">
                        <strong>Possible duplicate</strong>
                        <ul className="similar-list">
                          {dups.map((dup) => (
                            <li key={dup.discussionUrl}>
                              <a
                                href={dup.discussionUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {dup.title}
                              </a>
                              <span className="badge">{dup.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  <div className="meta">
                    <span>
                      <strong>Source:</strong> {item.source.toUpperCase()}
                    </span>
                    <span>
                      <strong>Submitted:</strong>{" "}
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="actions">
                    <a href={item.discussionUrl} target="_blank" rel="noreferrer">
                      Discussion
                    </a>
                    <a href={item.canonicalUrl} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  </div>

                  <details className="card-sub">
                    <summary>Edit pending metadata</summary>
                    <form action={updatePendingAction} className="form">
                      <input type="hidden" name="id" value={item.id} />
                      <label>
                        <span>Title</span>
                        <input
                          name="title"
                          defaultValue={item.title}
                          required
                        />
                      </label>
                      <label>
                        <span>Canonical URL</span>
                        <input
                          name="canonicalUrl"
                          defaultValue={item.canonicalUrl}
                          required
                        />
                      </label>
                      <label>
                        <span>Discussion URL</span>
                        <input
                          name="discussionUrl"
                          defaultValue={item.discussionUrl}
                          required
                        />
                      </label>
                      <div className="form-actions">
                        <button type="submit">Save pending edits</button>
                      </div>
                    </form>
                  </details>

                  {published.length > 0 && (() => {
                    const matches = findSimilarItems(item, published);
                    if (matches.length === 0) return null;
                    return (
                      <div className="card-sub">
                        <strong>Similar published</strong>
                        <ul className="similar-list">
                          {matches.map((match) => (
                            <li key={match.item.id}>
                              <a
                                href={match.item.discussionUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {match.item.title}
                              </a>
                              <span className="badge">
                                score {match.score.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  <form action={approveAction} className="form">
                    <input type="hidden" name="id" value={item.id} />
                    <label>
                      <span>Why this matters</span>
                      <textarea
                        name="whyThisMatters"
                        rows={3}
                        defaultValue={
                          item.whyThisMatters ?? autoDraft(item).whyThisMatters
                        }
                        required
                      />
                    </label>
                    <label>
                      <span>Try this</span>
                      <textarea
                        name="tryThis"
                        rows={3}
                        defaultValue={item.tryThis ?? autoDraft(item).tryThis}
                        required
                      />
                    </label>
                    <label>
                      <span>Time estimate</span>
                      <select
                        name="timeEstimate"
                        defaultValue={
                          item.timeEstimate ?? autoDraft(item).timeEstimate
                        }
                        required
                      >
                        <option value="">Select one</option>
                        <option value="15m">15m</option>
                        <option value="30m">30m</option>
                        <option value="2h">2h</option>
                      </select>
                    </label>
                    <label>
                      <span>Tags (comma-separated)</span>
                      <input
                        name="tags"
                        defaultValue={
                          item.tags?.join(", ") ??
                          autoDraft(item).tags.join(", ")
                        }
                      />
                    </label>
                    <div className="form-actions">
                      <button type="submit">Approve & publish</button>
                    </div>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="ghost">
                      Reject
                    </button>
                  </form>
                </article>
              ))
            )}
            {renderPagination("pending", pendingPage, pendingPages)}
          </section>

          <section className="stack">
            <h2>Published items</h2>
            {renderPagination("published", publishedPage, publishedPages)}
            {published.length === 0 ? (
              <div className="empty">
                <p>No published items yet.</p>
              </div>
            ) : (
              publishedSlice.map((item) => (
                <article className="card" key={item.id}>
                  <h2>{item.title}</h2>
                  <div className="meta">
                    <span>
                      <strong>Source:</strong> {item.source.toUpperCase()}
                    </span>
                    <span>
                      <strong>Published:</strong>{" "}
                      {formatDateTime(item.publishedAt)}
                    </span>
                    <span>
                      <strong>Views:</strong> {viewCounts[item.id]?.count ?? 0}
                    </span>
                  </div>

                  <div className="actions">
                    <a href={item.discussionUrl} target="_blank" rel="noreferrer">
                      Discussion
                    </a>
                    <a href={item.canonicalUrl} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  </div>

                  <form action={editPublishedAction} className="form">
                    <input type="hidden" name="id" value={item.id} />
                    <label>
                      <span>Why this matters</span>
                      <textarea
                        name="whyThisMatters"
                        rows={3}
                        defaultValue={item.whyThisMatters}
                        required
                      />
                    </label>
                    <label>
                      <span>Try this</span>
                      <textarea
                        name="tryThis"
                        rows={3}
                        defaultValue={item.tryThis}
                        required
                      />
                    </label>
                    <label>
                      <span>Time estimate</span>
                      <select name="timeEstimate" defaultValue={item.timeEstimate} required>
                        <option value="15m">15m</option>
                        <option value="30m">30m</option>
                        <option value="2h">2h</option>
                      </select>
                    </label>
                    <label>
                      <span>Tags (comma-separated)</span>
                      <input
                        name="tags"
                        defaultValue={item.tags.join(", ")}
                      />
                    </label>
                    <div className="form-actions">
                      <button type="submit">Save edits</button>
                    </div>
                  </form>

                  <form action={setFeaturedAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="ghost">
                      Set as featured
                    </button>
                  </form>

                  <form action={unpublishAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="ghost">
                      Unpublish
                    </button>
                  </form>

                  <form action={archiveAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="ghost">
                      Archive
                    </button>
                  </form>
                </article>
              ))
            )}
            {renderPagination("published", publishedPage, publishedPages)}
          </section>
        </section>
      )}
    </main>
  );
}

async function getCookieStore() {
  return await cookies();
}
