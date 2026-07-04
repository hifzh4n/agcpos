"use client";

import { useSyncExternalStore } from "react";

export function useOnline() {
  return useSyncExternalStore(
    (callback) => {
    const update = () => callback();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
    },
    () => navigator.onLine,
    () => true,
  );
}
