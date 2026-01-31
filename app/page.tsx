import { getPublishedItems } from "./lib/published";
import { getViewCounts } from "./lib/analytics";
import { getFeaturedId } from "./lib/featured";
import { getIngestHealth } from "./lib/ingestHealth";
import Filters from "./ui/filters";

export const dynamic = "force-static";

function formatDate(value: string) {
  const date = new Date(value).toISOString();
  const [ymd] = date.split("T");
  const [year, month, day] = ymd.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[Number(month) - 1]} ${Number(day)}, ${year}`;
}

export default async function HomePage() {
  const items = await getPublishedItems();
  const views = await getViewCounts();
  const ingestHealth = await getIngestHealth();
  const featuredId = await getFeaturedId();
  const featuredItem = featuredId
    ? items.find((item) => item.id === featuredId)
    : null;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const recent = items.filter(
    (item) => new Date(item.publishedAt).getTime() >= weekAgo.getTime()
  );
  const todayKey = new Date().toISOString().split("T")[0];
  const approvedToday = items.filter((item) =>
    item.publishedAt.startsWith(todayKey)
  );
  const counts = recent.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.source] += 1;
      return acc;
    },
    { total: 0, hn: 0, reddit: 0 }
  );
  const changelog = items.slice(0, 5);

  return (
    <main>
      <header>
        <h1>HN → Action</h1>
        <p>
          Curated AI discussions turned into short, actionable Build This
          experiments. Human-written, intentionally small, and ready to try in a
          single sitting.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty">
          <p>No published experiments yet. Check back soon.</p>
        </div>
      ) : (
        <>
          <section className="stats">
            <div>
              <h2>Top sources this week</h2>
              <p>
                {counts.total} experiments published since{" "}
                {formatDate(weekAgo.toISOString())}.
              </p>
            </div>
            <div className="stats-badges">
              <span className="badge">HN: {counts.hn}</span>
              <span className="badge">Reddit: {counts.reddit}</span>
            </div>
          </section>
          <section className="stats">
            <div>
              <h2>Ingest health</h2>
              <p>
                Last run:{" "}
                {ingestHealth.lastRunAt
                  ? formatDate(ingestHealth.lastRunAt)
                  : "Never"}
              </p>
            </div>
            <div className="stats-badges">
              <span className="badge">
                HN: {ingestHealth.counts.hn}
              </span>
              <span className="badge">
                Reddit: {ingestHealth.counts.reddit}
              </span>
              <span className="badge">
                Total: {ingestHealth.counts.total}
              </span>
            </div>
          </section>
          <section className="changelog">
            <h2>Changelog</h2>
            {changelog.length === 0 ? (
              <p>No publishes yet.</p>
            ) : (
              <ul>
                {changelog.map((item) => (
                  <li key={item.id}>
                    <span className="badge">{formatDate(item.publishedAt)}</span>
                    <strong>{item.title}</strong>
                    <span className="muted">({item.source.toUpperCase()})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="changelog">
            <h2>Approved today</h2>
            {approvedToday.length === 0 ? (
              <p>No approvals yet today.</p>
            ) : (
              <ul>
                {approvedToday.map((item) => (
                  <li key={item.id}>
                    <span className="badge">{formatDate(item.publishedAt)}</span>
                    <strong>{item.title}</strong>
                    <span className="muted">({item.source.toUpperCase()})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {featuredItem && (
            <section className="featured">
              <div>
                <span className="badge">Featured</span>
                <h2>{featuredItem.title}</h2>
                <p>{featuredItem.whyThisMatters}</p>
                <div className="meta">
                  <span>
                    <strong>Source:</strong> {featuredItem.source.toUpperCase()}
                  </span>
                  <span>
                    <strong>Time:</strong> {featuredItem.timeEstimate}
                  </span>
                  <span>
                    <strong>Published:</strong>{" "}
                    {formatDate(featuredItem.publishedAt)}
                  </span>
                </div>
                <div className="actions">
                  <a
                    href={featuredItem.discussionUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Original discussion
                  </a>
                  <a
                    href={featuredItem.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source link
                  </a>
                </div>
              </div>
            </section>
          )}
          <Filters items={items} views={views} />
        </>
      )}
    </main>
  );
}
