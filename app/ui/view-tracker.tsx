"use client";

import { useEffect } from "react";

export default function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [id]);

  return null;
}
