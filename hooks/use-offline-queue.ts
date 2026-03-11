"use client";

import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const OFFLINE_QUEUE_KEY = "qrisflex-offline-queue";

export interface OfflineQueueItem {
  payload: string;
  amount: number;
  total: number;
  merchantName: string;
  channel: "offline" | "web" | "widget";
  notes?: string;
  createdAt: string;
}

export async function enqueueOfflineItem(item: OfflineQueueItem) {
  const existing = (await get<OfflineQueueItem[]>(OFFLINE_QUEUE_KEY)) ?? [];
  existing.unshift(item);
  await set(OFFLINE_QUEUE_KEY, existing);
  return existing.length;
}

async function readQueue() {
  return (await get<OfflineQueueItem[]>(OFFLINE_QUEUE_KEY)) ?? [];
}

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const items = await readQueue();
    setPendingCount(items.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      return false;
    }

    const items = await readQueue();

    if (items.length === 0) {
      setPendingCount(0);
      return true;
    }

    setSyncing(true);

    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error("Gagal sinkronisasi antrean offline.");
      }

      await del(OFFLINE_QUEUE_KEY);
      setPendingCount(0);
      toast.success(`${items.length} riwayat offline berhasil disinkronkan.`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sinkronisasi offline gagal.");
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleOnline = () => {
      void syncNow();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [refresh, syncNow]);

  return {
    pendingCount,
    syncing,
    refresh,
    syncNow,
  };
}
