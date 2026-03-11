import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignInCard } from "@/components/sign-in-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { featureFlags } from "@/lib/env";

export const metadata = {
  title: "Masuk Dashboard",
};

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="pb-10">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="grid min-h-[calc(100vh-220px)] items-center gap-8 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Dashboard access</p>
            <h1 className="font-display max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Simpan QR statis, buka analytics real-time, dan kelola widget embed.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Login dipakai untuk mengikat riwayat generate, multi QRIS storage, serta analytics dashboard Anda. Untuk demo, satu form credentials sudah cukup.
            </p>
          </div>
          <SignInCard googleEnabled={featureFlags.googleAuth} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
