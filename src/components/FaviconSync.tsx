"use client";

import { useEffect } from "react";

export function FaviconSync({ logoUrl }: { logoUrl?: string | null }) {
  useEffect(() => {
    const href = logoUrl || "/icon.svg";
    const selectors = ["icon", "shortcut icon", "apple-touch-icon"];

    for (const rel of selectors) {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      link.type = href.endsWith(".svg") ? "image/svg+xml" : "";
    }
  }, [logoUrl]);

  return null;
}
