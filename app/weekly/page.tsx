import { getPublishedItems } from "../lib/published";
import { getViewCounts } from "../lib/analytics";

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

export default async function WeeklyPage() {
  const items = await getPublishedItems();
  const views = await getViewCounts();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const recent = items.filter(
    (item) => new Date(item.publishedAt).getTime() >= weekAgo.getTime()
  );

  return (
    <main>
      <header>
        <h1>Weekly Digest</h1>
        <p>
          {recent.length} experiments published since {formatDate(weekAgo.toISOString())}.
        </p>
      </header>

      {recent.length === 0 ? (
        <div className="empty">
          <p>No experiments this week yet.</p>
        </div>
      ) : (
        <section>
          {recent.map((item) => (
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
