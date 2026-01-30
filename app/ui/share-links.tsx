"use client";

import { useState } from "react";

export default function ShareLinks({
  title,
  url,
  discussionUrl,
}: {
  title: string;
  url: string;
  discussionUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  const hnShare = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
    url
  )}&t=${encodeURIComponent(title)}`;
  const redditShare = `https://www.reddit.com/submit?url=${encodeURIComponent(
    url
  )}&title=${encodeURIComponent(title)}`;

  return (
    <div className="share">
      <button type="button" className="ghost" onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </button>
      <a href={hnShare} target="_blank" rel="noreferrer">
        Share to HN
      </a>
      <a href={redditShare} target="_blank" rel="noreferrer">
        Share to Reddit
      </a>
      <a href={discussionUrl} target="_blank" rel="noreferrer">
        View discussion
      </a>
    </div>
  );
}
