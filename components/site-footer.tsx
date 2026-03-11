import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="surface rounded-[32px] border border-border px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <BrandLogo />
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              QrisFlex adalah utility tool untuk mengubah QRIS statis menjadi QRIS dinamis, lengkap dengan API, widget embed,
              dashboard analytics, dan mode offline-ready untuk operasional harian yang cepat.
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/api/docs">API Docs</Link>
              <Link href="/dashboard">Dashboard</Link>
              <a href="https://vercel.com" rel="noreferrer" target="_blank">
                Deploy on Vercel
              </a>
            </div>
            <p>Utility tool, bukan payment gateway resmi BI.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
