import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-strong max-w-xl rounded-[36px] border border-border px-8 py-10 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">404</p>
        <h1 className="font-display mt-4 text-5xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          Mungkin widget atau resource yang Anda cari belum aktif. Kembali ke beranda untuk generate QRIS baru.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
