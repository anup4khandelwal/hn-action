export type Source = "hn" | "reddit";

export type PendingItem = {
  id: string;
  title: string;
  source: Source;
  discussionUrl: string;
  canonicalUrl: string;
  createdAt: string;
  status: "pending";
  whyThisMatters?: string;
  tryThis?: string;
  timeEstimate?: "15m" | "30m" | "2h";
  tags?: string[];
};

export type PublishedItem = {
  id: string;
  title: string;
  source: Source;
  discussionUrl: string;
  canonicalUrl: string;
  whyThisMatters: string;
  tryThis: string;
  timeEstimate: "15m" | "30m" | "2h";
  tags: string[];
  publishedAt: string;
};

export type ContentItem = PendingItem | PublishedItem;
