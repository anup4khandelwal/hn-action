"use client";

import { useEffect } from "react";

export default function AdminShortcuts() {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const isSubmitCombo =
        (event.ctrlKey || event.metaKey) && event.key === "Enter";
      if (!isSubmitCombo) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const form = target.closest("form");
      if (!form) return;
      event.preventDefault();
      (form as HTMLFormElement).requestSubmit();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return null;
}
