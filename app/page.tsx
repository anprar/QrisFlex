import { ArrowUpRight, Gauge, Globe2, Radio, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { HowItWorksCarousel } from "@/components/how-it-works-carousel";
import { QuickConverter } from "@/components/quick-converter";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const featureHighlights = [
  {
    title: "Deploy edge-ready di Vercel",
    description: "App Router, React Server Components, dan API endpoints siap dibagi antara Edge dan Node runtime.",
    icon: Zap,
  },
  {
    title: "Dashboard analytics real-time",
    description: "Pantau generate harian, nominal diproses, merchant teratas, dan webhook delivery tanpa refresh manual.",
    icon: Gauge,
  },
  {
    title: "Widget iframe untuk website lain",
    description: "Tempel generator QR di landing checkout, microsite event, atau katalog digital dengan callback opsional.",
    icon: Globe2,
  },
  {
    title: "Offline decode + sync",
    description: "PWA tetap bisa decode dan generate saat sinyal hilang, lalu menyinkronkan riwayat ketika koneksi kembali.",
    icon: Radio,
  },
];

export default function Home() {
  return (
    <div className="pb-10">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[42px] border border-white/35 bg-gradient-to-br from-[#fbf6ec]/70 via-[#fff8ef]/40 to-[#d5f6e8]/30 px-6 py-8 shadow-[0_30px_100px_rgba(19,41,33,0.12)] sm:px-10 sm:py-12 dark:from-[#0c1714]/80 dark:via-[#0d1b15]/60 dark:to-[#0a1e1a]/60">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Badge>Biaya gratis mulai sekarang</Badge>
              <Badge variant="amber">API + webhook siap integrasi</Badge>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <Button asChild variant="ghost">
                <Link href="/api/docs">Lihat endpoint</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Dashboard demo
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <QuickConverter />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card className="rounded-[34px] border border-white/30 bg-gradient-to-br from-primary/10 to-secondary/15">
            <CardHeader>
              <CardDescription>Why QrisFlex wins</CardDescription>
              <CardTitle className="text-4xl">Lebih cepat, lebih fleksibel, lebih siap scale.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base leading-8 text-muted-foreground">
              <p>
                Dibuat untuk performa Vercel: landing terasa instan, API bisa dibagi per runtime, dan widget tetap ringan walau penuh animasi.
              </p>
              <p>
                QrisFlex fokus pada pengalaman merchant modern: generate tanpa login, simpan QR statis untuk reuse forever, dan tracking hasil generate secara real-time.
              </p>
              <div className="marquee overflow-hidden rounded-[26px] border border-border bg-white/35 py-4 dark:bg-white/5">
                <div className="flex min-w-max items-center gap-10 px-6 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  <span>Unlimited history</span>
                  <span>Webhook callback</span>
                  <span>PWA installable</span>
                  <span>Dark mode</span>
                  <span>Embed widget</span>
                  <span>Vitest covered</span>
                  <span>Unlimited history</span>
                  <span>Webhook callback</span>
                  <span>PWA installable</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <HowItWorksCarousel />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card className="rounded-[30px]" key={item.title}>
                <CardContent className="p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0d1714] to-[#10211b] text-white">
            <CardHeader>
              <CardDescription className="text-white/70">For growth teams</CardDescription>
              <CardTitle className="text-4xl">API docs, webhook, dan widget dalam satu workflow.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white/75">
              <p>
                Tim engineering bisa mulai dari landing generator, lalu naik ke widget iframe, webhook callback, dan analytics dashboard tanpa memisahkan repo lain.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                  <p className="font-display text-2xl font-semibold">100/min</p>
                  <p className="text-sm text-white/70">Rate limit free plan, pro bypass via session.</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                  <p className="font-display text-2xl font-semibold">TTFB &lt; 100ms</p>
                  <p className="text-sm text-white/70">Target untuk endpoint cacheable dan widget config di edge.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[34px] border border-white/30 bg-gradient-to-br from-secondary/15 to-white/25">
            <CardHeader>
              <CardDescription>Launch ready checklist</CardDescription>
              <CardTitle className="text-4xl">Sudah disiapkan untuk produksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                App Router + SEO metadata + robots + sitemap + dark mode toggle.
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                NextAuth beta credentials flow dengan Google opsional via env.
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                Vercel Blob auto-expire hook, KV rate limit, dan Postgres analytics fallback memory-safe.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
