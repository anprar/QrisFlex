import { ApiDocsExplorer } from "@/components/api-docs-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiExamples, openApiDocument } from "@/lib/openapi";

export const metadata = {
  title: "API Docs",
};

export default function ApiDocsPage() {
  return (
    <div className="pb-10">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-white/30 bg-gradient-to-br from-white/55 to-white/35 px-6 py-8 dark:from-white/6 dark:to-white/4 sm:px-8">
          <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Developer platform</p>
          <h1 className="font-display mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">OpenAPI style docs untuk generate, decode, webhook, dan widget.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Lengkap dengan contoh cURL, parameter, behavior rate limit, serta endpoint JSON spec yang siap dipakai Postman maupun internal SDK.
          </p>
        </section>

        <ApiDocsExplorer examples={apiExamples} openApiJson={JSON.stringify(openApiDocument, null, 2)} />
      </main>
      <SiteFooter />
    </div>
  );
}
