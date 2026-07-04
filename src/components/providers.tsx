"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Button, Dialog } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      {updateReady ? (
        <Dialog title="Update Available" onClose={() => setUpdateReady(false)}>
          <p className="mb-4 text-sm font-semibold text-[var(--muted)]">A newer AGCPOS version is ready.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="light" onClick={() => setUpdateReady(false)}>
              Later
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </Dialog>
      ) : null}
    </ThemeProvider>
  );
}
