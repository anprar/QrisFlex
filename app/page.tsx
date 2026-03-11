import { Gauge, Globe2, Radio, Sparkles, Zap, ArrowUpRight } from "lucide-react";
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
    title: "Kecepatan & Kemudahan",
    description: "Generate QRIS dinamis dalam hitungan detik. Tidak perlu daftar, tidak perlu konfigurasi rumit.",
    icon: Zap,
  },
  {
    title: "Dashboard analitik",
    description: "Pantau riwayat generate harian, total nominal, dan merchant aktif langsung dari dasbor Anda.",
    icon: Gauge,
  },
  {
    title: "Widget embed siap pakai",
    description: "Tempel generator QR di halaman checkout, microsite event, atau katalog digital dengan mudah.",
    icon: Globe2,
  },
  {
    title: "Bisa dipakai offline",
    description: "Generate QRIS tetap berjalan meski tanpa koneksi internet, dan sinkronisasi otomatis saat online kembali.",
    icon: Radio,
  },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden pb-10">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 overflow-x-hidden px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[42px] border border-white/35 bg-gradient-to-br from-[#fbf6ec]/70 via-[#fff8ef]/40 to-[#d5f6e8]/30 px-6 py-8 shadow-[0_30px_100px_rgba(19,41,33,0.12)] sm:px-10 sm:py-12 dark:from-[#0d1d16]/90 dark:via-[#0e2018]/75 dark:to-[#0c2420]/70">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Badge>Gratis tanpa login</Badge>
              <Badge variant="amber">API & Webhook siap pakai</Badge>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <Button asChild variant="ghost">
                <Link href="/api/docs">Lihat API Docs</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Dashboard
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <QuickConverter />
        </section>

        <section className="grid items-start gap-6 min-w-0 xl:grid-cols-[1fr_1.2fr]">
          <Card className="rounded-[34px] border border-white/30 bg-gradient-to-br from-primary/10 to-secondary/15">
            <CardHeader>
              <CardDescription>Kenapa QrisFlex?</CardDescription>
              <CardTitle className="text-4xl">Lebih cepat, lebih fleksibel.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-base leading-8 text-muted-foreground">
              <div className="space-y-4">
                <p>
                  QrisFlex dirancang agar siapa saja bisa langsung pakai — kasir, UMKM, developer, hingga pemilik toko online — tanpa perlu daftar atau beli lisensi.
                </p>
                <p>
                  Dari satu QR statis, Anda bisa generate dinamis dengan nominal berbeda, tambahkan fee, catatan, dan embed di website lain dalam hitungan detik.
                </p>
              </div>
              <div className="overflow-hidden rounded-[26px] border border-border bg-white/35 py-4 [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] dark:bg-white/5">
                <div className="marquee-inner flex w-max items-center gap-10 px-6 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  <span>Riwayat unlimited</span>
                  <span>Webhook callback</span>
                  <span>Bisa offline</span>
                  <span>Dark mode</span>
                  <span>Widget embed</span>
                  <span>Gratis selamanya</span>
                  <span>Riwayat unlimited</span>
                  <span>Webhook callback</span>
                  <span>Bisa offline</span>
                  <span>Dark mode</span>
                  <span>Widget embed</span>
                  <span>Gratis selamanya</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <HowItWorksCarousel />
        </section>

        <section className="grid gap-5 md:grid-cols-2 min-w-0 xl:grid-cols-4">
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

        <section className="grid gap-6 min-w-0 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-[34px] border-white/10 bg-gradient-to-br from-[#0e1d17] to-[#0c1813] text-white">
            <CardHeader>
              <CardDescription className="text-white/70">Untuk tim & developer</CardDescription>
              <CardTitle className="text-4xl text-white">API, webhook, dan widget dalam satu paket.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white/80">
              <p>
                Hubungkan sistem kasir, toko online, atau aplikasi Anda langsung ke QrisFlex lewat API sederhana. Terima notifikasi otomatis tiap transaksi via webhook.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-semibold text-white">100/menit</p>
                  <p className="text-sm text-white/70">Batas generate gratis per pengguna. Tanpa kredit, tanpa tagihan.</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-semibold text-white">Instan</p>
                  <p className="text-sm text-white/70">Respons API cepat, cocok untuk checkout real-time dan kasir digital.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[34px] border border-border bg-gradient-to-br from-secondary/20 to-secondary/5">
            <CardHeader>
              <CardDescription>Fitur siap pakai</CardDescription>
              <CardTitle className="text-4xl">Lengkap sejak hari pertama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                Generate QRIS dinamis, unduh PNG, embed widget, atau share langsung.
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                Login sekali untuk simpan QR statis, kelola riwayat, dan akses analitik merchant.
              </div>
              <div className="flex items-start gap-3 rounded-[22px] border border-border px-4 py-4">
                <Sparkles className="mt-1 h-4 w-4 text-primary" />
                Tetap bisa generate saat offline. Data tersinkron otomatis ketika koneksi kembali.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
