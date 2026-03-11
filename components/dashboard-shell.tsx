"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, BarChart3, Clock3, QrCode, Wallet } from "lucide-react";

import { AnalyticsChart, type AnalyticsPoint } from "@/components/analytics-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface DashboardData {
  overview: {
    dailyGenerates: number;
    totalNominalProcessed: number;
    totalSources: number;
    totalHistory: number;
    totalScans: number;
    webhookDeliveries: number;
    topMerchants: Array<{ name: string; total: number }>;
  };
  history: Array<{
    id: string;
    merchantName: string;
    amount: number;
    total: number;
    channel: string;
    webhookStatus: string;
    createdAt: string;
  }>;
  sources: Array<{
    id: string;
    label: string;
    merchantName: string;
    bank: string;
    usageCount: number;
    updatedAt: string;
  }>;
  timeseries: AnalyticsPoint[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Gagal memuat data dashboard.");
  }

  return response.json() as Promise<T>;
}

export function DashboardShell({ initialData }: { initialData: DashboardData }) {
  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => fetchJson<DashboardData["overview"]>("/api/analytics/overview"),
    initialData: initialData.overview,
    refetchInterval: 15_000,
  });
  const historyQuery = useQuery({
    queryKey: ["dashboard-history"],
    queryFn: () => fetchJson<DashboardData["history"]>("/api/history"),
    initialData: initialData.history,
    refetchInterval: 15_000,
  });
  const timeseriesQuery = useQuery({
    queryKey: ["dashboard-timeseries"],
    queryFn: () => fetchJson<DashboardData["timeseries"]>("/api/analytics/timeseries"),
    initialData: initialData.timeseries,
    refetchInterval: 15_000,
  });

  const overview = overviewQuery.data;
  const history = historyQuery.data;
  const timeseries = timeseriesQuery.data;
  const sources = initialData.sources;

  return (
    <div className="space-y-8">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {[
          { label: "Generate hari ini", value: overview.dailyGenerates, icon: Activity },
          { label: "Nominal diproses", value: formatCurrency(overview.totalNominalProcessed), icon: Wallet },
          { label: "QR tersimpan", value: overview.totalSources, icon: QrCode },
          { label: "Webhook terkirim", value: overview.webhookDeliveries, icon: ArrowUpRight },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card className="rounded-[28px]" key={item.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold">{item.value}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardDescription>Realtime analytics</CardDescription>
            <CardTitle className="text-2xl">Generate QRIS 7 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={timeseries} />
          </CardContent>
        </Card>
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardDescription>Top merchants</CardDescription>
            <CardTitle className="text-2xl">Merchant paling aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.topMerchants.map((merchant, index) => (
              <div className="flex items-center justify-between rounded-3xl border border-border px-4 py-4" key={merchant.name}>
                <div>
                  <p className="text-sm text-muted-foreground">#{index + 1}</p>
                  <p className="font-semibold">{merchant.name}</p>
                </div>
                <Badge variant={index === 0 ? "default" : "amber"}>{formatCurrency(merchant.total)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardDescription>Generate history</CardDescription>
            <CardTitle className="text-2xl">Riwayat terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((item) => (
              <div className="grid gap-3 rounded-[28px] border border-border px-4 py-4 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]" key={item.id}>
                <div>
                  <p className="font-semibold">{item.merchantName}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Nominal</p>
                  <p className="font-medium">{formatCurrency(item.amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Kanal</p>
                  <p className="font-medium capitalize">{item.channel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Webhook</p>
                  <Badge variant={item.webhookStatus === "delivered" ? "default" : "muted"}>{item.webhookStatus}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[30px]">
          <CardHeader>
            <CardDescription>Multi QRIS storage</CardDescription>
            <CardTitle className="text-2xl">QR statis tersimpan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source) => (
              <div className="rounded-[28px] border border-border px-4 py-4" key={source.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{source.label}</p>
                    <p className="text-sm text-muted-foreground">{source.merchantName}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary-foreground">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium">{source.bank}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dipakai</p>
                    <p className="font-medium">{source.usageCount}x</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    Update {formatDateTime(source.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
