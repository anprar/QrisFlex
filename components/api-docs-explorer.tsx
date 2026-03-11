"use client";

import { motion } from "framer-motion";
import { Code2, FileJson2, Globe2, Webhook } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EndpointItem = {
  method: string;
  path: string;
  title: string;
  description: string;
  params: string;
};

const endpointItems: EndpointItem[] = [
  {
    method: "POST",
    path: "/api/qris/generate",
    title: "Generate payload/image dinamis",
    description: "Menerima QRIS base64 atau payload, menambahkan nominal, fee, dan menghasilkan PNG/SVG berkoreksi tinggi.",
    params: "{ qrisBase64?: string, payload?: string, amount: number, fee?: { type: 'rp' | 'percent', value: number }, notes?: string }",
  },
  {
    method: "POST",
    path: "/api/qris/decode",
    title: "Decode QR statis",
    description: "Decode PNG/JPG base64 menjadi payload QRIS, validasi CRC, dan ekstrak merchant metadata.",
    params: "{ imageBase64: string }",
  },
  {
    method: "POST",
    path: "/api/qris/webhook",
    title: "Auto-callback konfirmasi pembayaran",
    description: "Verifikasi HMAC signature dan catat event pembayaran ke analytics serta history callback.",
    params: "Signature header + { event, referenceId, amount, payload }",
  },
  {
    method: "GET",
    path: "/api/widget/[id]",
    title: "Embed iframe widget",
    description: "Ambil konfigurasi widget atau HTML snippet iframe siap tempel dengan CORS terbuka.",
    params: "theme, logo, callbackUrl, format=iframe",
  },
];

export function ApiDocsExplorer({ examples, openApiJson }: { examples: Record<string, string>; openApiJson: string }) {
  const [activeTab, setActiveTab] = useState<keyof typeof examples>("curlGenerate");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>OpenAPI style docs</CardDescription>
          <CardTitle className="text-3xl">Endpoint inti QrisFlex</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpointItems.map((endpoint, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-border p-5"
              initial={{ opacity: 0, y: 18 }}
              key={endpoint.path}
              transition={{ delay: index * 0.06 }}
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge variant={endpoint.method === "GET" ? "amber" : "default"}>{endpoint.method}</Badge>
                <code className="rounded-full bg-white/50 px-3 py-1 text-sm dark:bg-white/5">{endpoint.path}</code>
              </div>
              <h3 className="font-display text-xl font-semibold">{endpoint.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{endpoint.description}</p>
              <pre className="mt-4 overflow-x-auto rounded-[24px] border border-border bg-[#0d1714] p-4 text-xs leading-6 text-[#daf9e9]">
                <code>{endpoint.params}</code>
              </pre>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[32px]">
          <CardHeader>
            <CardDescription>Examples</CardDescription>
            <CardTitle className="text-3xl">cURL dan payload contoh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.keys(examples).map((key) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                  key={key}
                  onClick={() => setActiveTab(key as keyof typeof examples)}
                  type="button"
                >
                  {key.replace("curl", "").replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </div>
            <pre className="scrollbar-thin overflow-x-auto rounded-[26px] border border-border bg-[#0d1714] p-5 text-xs leading-6 text-[#daf9e9]">
              <code>{examples[activeTab]}</code>
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-[32px]">
          <CardHeader>
            <CardDescription>Rate limit</CardDescription>
            <CardTitle className="text-2xl">100 request/menit untuk free</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <div className="flex items-center gap-3 rounded-[24px] border border-border px-4 py-4">
              <Globe2 className="h-5 w-5 text-primary" />
              Widget route mengizinkan semua origin untuk iframe embed.
            </div>
            <div className="flex items-center gap-3 rounded-[24px] border border-border px-4 py-4">
              <Webhook className="h-5 w-5 text-primary" />
              Header `X-QrisFlex-Signature` memakai HMAC SHA-256 untuk verifikasi callback.
            </div>
            <div className="flex items-center gap-3 rounded-[24px] border border-border px-4 py-4">
              <FileJson2 className="h-5 w-5 text-primary" />
              OpenAPI JSON tersedia di `/api/docs/openapi` untuk Postman dan tooling internal.
            </div>
            <div className="flex items-center gap-3 rounded-[24px] border border-border px-4 py-4">
              <Code2 className="h-5 w-5 text-primary" />
              Free plan dibatasi 100/min, pro plan dilewati otomatis lewat session plan.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px]">
          <CardHeader>
            <CardDescription>OpenAPI JSON</CardDescription>
            <CardTitle className="text-2xl">Spec siap pakai</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="scrollbar-thin max-h-[380px] overflow-auto rounded-[24px] border border-border bg-[#0d1714] p-5 text-xs leading-6 text-[#daf9e9]">
              <code>{openApiJson}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
