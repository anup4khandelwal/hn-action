"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublishedItem } from "../../utils/types";
import type { ViewCounts } from "../lib/analytics";
import { renderMarkdown } from "./markdown";
import ViewTracker from "./view-tracker";
import ShareLinks from "./share-links";

const ALL_TAG = "all";
const ALL_TIME = "all";
const PAGE_SIZE = 8;

export default function Filters({
  items,
  views,
}: {
  items: PublishedItem[];
  views: ViewCounts;
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(ALL_TAG);
  const [time, setTime] = useState(ALL_TIME);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, tag, time]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((t) => set.add(t)));
    return [ALL_TAG, ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTag = tag === ALL_TAG || item.tags.includes(tag);
      const matchesTime = time === ALL_TIME || item.timeEstimate === time;
      const matchesQuery =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.whyThisMatters.toLowerCase().includes(q) ||
        item.tryThis.toLowerCase().includes(q);
      return matchesTag && matchesTime && matchesQuery;
    });
  }, [items, query, tag, time]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section>
      <div className="filters">
        <input
          id="search-input"
          type="search"
          placeholder="Search experiments"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={tag} onChange={(event) => setTag(event.target.value)}>
          {tags.map((tagValue) => (
            <option key={tagValue} value={tagValue}>
              {tagValue === ALL_TAG ? "All tags" : tagValue}
            </option>
          ))}
        </select>
        <span className="badge">Showing {filtered.length}</span>
      </div>
      <div className="chip-row">
        {tags.slice(0, 10).map((tagValue) => (
          <button
            key={tagValue}
            type="button"
            className={`chip ${tag === tagValue ? "active" : ""}`}
            onClick={() => setTag(tagValue)}
          >
            {tagValue === ALL_TAG ? "All" : tagValue}
          </button>
        ))}
        {["15m", "30m", "2h"].map((timeValue) => (
          <button
            key={timeValue}
            type="button"
            className={`chip ${time === timeValue ? "active" : ""}`}
            onClick={() => setTime(timeValue)}
          >
            {timeValue}
          </button>
        ))}
        <button
          type="button"
          className={`chip ${time === ALL_TIME ? "active" : ""}`}
          onClick={() => setTime(ALL_TIME)}
        >
          All time
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>No matches. Try a different search or tag.</p>
        </div>
      ) : (
        <section>
          {visible.map((item) => (
            <article className="card" key={item.id}>
              <ViewTracker id={item.id} />
              <div>
                <h2>{item.title}</h2>
              </div>

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

              <div>
                <strong>Why this matters:</strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(item.whyThisMatters),
                  }}
                />
              </div>

              <div>
                <strong>Try this:</strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(item.tryThis),
                  }}
                />
              </div>

              <div className="tags">
                {item.tags.map((tagValue) => (
                  <span className="badge" key={tagValue}>
                    {tagValue}
                  </span>
                ))}
              </div>

              <div className="actions">
                <a href={item.discussionUrl} target="_blank" rel="noreferrer">
                  Original discussion
                </a>
                <a href={item.canonicalUrl} target="_blank" rel="noreferrer">
                  Source link
                </a>
              </div>
              <ShareLinks
                title={item.title}
                url={item.canonicalUrl}
                discussionUrl={item.discussionUrl}
              />
            </article>
          ))}
          {visible.length < filtered.length && (
            <button
              type="button"
              className="load-more"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load more
            </button>
          )}
        </section>
      )}
    </section>
  );
}

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
