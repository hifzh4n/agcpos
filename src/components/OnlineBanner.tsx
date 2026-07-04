"use client";

import { Wifi, WifiOff } from "lucide-react";

export function OnlineBanner({ isOnline }: { isOnline: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 px-3 py-2 text-center text-xs font-bold ${
        isOnline ? "bg-[var(--success)] text-white" : "bg-[var(--danger)] text-white"
      }`}
    >
      {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      {isOnline ? "Online: Ready to accept orders" : "Offline: You are offline. Orders cannot be submitted."}
    </div>
  );
}
