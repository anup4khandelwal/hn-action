import { getPublishedItems } from "../../lib/published";
import { getViewCounts } from "../../lib/analytics";

export const dynamic = "force-dynamic";

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

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const resolved = await params;
  const tag = decodeURIComponent(resolved.tag);
  const items = await getPublishedItems();
  const views = await getViewCounts();
  const filtered = items.filter((item) => item.tags.includes(tag));

  return (
    <main>
      <header>
        <h1>Tag: {tag}</h1>
        <p>{filtered.length} experiments tagged “{tag}”.</p>
      </header>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>No experiments for this tag yet.</p>
        </div>
      ) : (
        <section>
          {filtered.map((item) => (
            <article className="card" key={item.id}>
              <h2>{item.title}</h2>
              <div className="meta">
                <span>
                  <strong>Source:</strong> {item.source.toUpperCase()}
                </span>
                <span>
                  <strong>Time:</strong> {item.timeEstimate}
                </span>
                <span>
                  <strong>Published:</strong> {formatDate(item.publishedAt)}
                </span>
                <span>
                  <strong>Views:</strong> {views[item.id]?.count ?? 0}
                </span>
              </div>
              <div className="actions">
                <a href={item.discussionUrl} target="_blank" rel="noreferrer">
                  Original discussion
                </a>
                <a href={item.canonicalUrl} target="_blank" rel="noreferrer">
                  Source link
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
