import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAnalyticsOverview, getTimeseries, listGenerateEvents, listSources } from "@/lib/store";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session?.user.id ?? null;
  const [overview, history, timeseries, sources] = await Promise.all([
    getAnalyticsOverview(ownerId),
    listGenerateEvents(ownerId),
    getTimeseries(ownerId),
    listSources(ownerId),
  ]);

  return (
    <div className="overflow-x-hidden pb-10">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-[36px] border border-white/30 bg-gradient-to-br from-white/55 to-white/35 px-6 py-8 dark:from-white/6 dark:to-white/4 sm:px-8">
          <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Analytics dashboard</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Halo, {session?.user.name ?? "Merchant"}.</h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground">
            Pantau QR statis tersimpan, riwayat generate, callback webhook, dan performa merchant Anda dalam satu layar.
          </p>
        </section>

        <DashboardShell
          initialData={{
            overview,
            history: history.slice(0, 8),
            timeseries,
            sources: sources.slice(0, 4),
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
