"use client";

import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

export function PwaRegister() {
  const { pendingCount, syncing, syncNow } = useOfflineQueue();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="surface-strong pointer-events-auto flex items-center gap-3 rounded-full border border-border px-4 py-3 text-sm shadow-[0_18px_50px_rgba(12,24,19,0.2)]">
        {online ? <Wifi className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4 text-danger" />}
        <span>{online ? "Online" : "Offline"}</span>
        {pendingCount > 0 ? <span className="rounded-full bg-secondary px-2 py-1 text-xs font-bold">{pendingCount} antrean</span> : null}
      </div>
      {pendingCount > 0 && online ? (
        <Button className="pointer-events-auto" onClick={() => void syncNow()} size="sm" variant="secondary">
          <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sinkronkan sekarang
        </Button>
      ) : null}
    </div>
  );
}
