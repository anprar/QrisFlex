"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateDynamicQris } from "@/lib/qris/generator";
import { formatCurrency } from "@/lib/utils";

const widgetSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().max(25).optional(),
});

type WidgetValues = z.output<typeof widgetSchema>;

export function WidgetGenerator({
  source,
  widget,
}: {
  source: { id: string; label: string; payload: string; merchantName: string };
  widget: { id: string; label: string; theme: "emerald" | "amber" | "ocean"; callbackUrl?: string };
}) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [generated, setGenerated] = useState<ReturnType<typeof generateDynamicQris> | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? widget.callbackUrl;
  const theme = searchParams.get("theme") ?? widget.theme;
  const form = useForm<z.input<typeof widgetSchema>, undefined, WidgetValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      amount: 25000,
      notes: "Widget order",
    },
  });

  const toneClass = useMemo(() => {
    if (theme === "amber") {
      return "from-amber-300/40 to-orange-300/15";
    }

    if (theme === "ocean") {
      return "from-cyan-400/30 to-sky-400/10";
    }

    return "from-emerald-300/30 to-teal-300/10";
  }, [theme]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = generateDynamicQris({
      payload: source.payload,
      amount: values.amount,
      notes: values.notes,
    });

    setGenerated(result);

    const message = {
      type: "qrisflex.generated",
      widgetId: widget.id,
      amount: values.amount,
      payload: result.payload,
      merchantName: result.parsed.merchant.name,
    };

    window.parent.postMessage(message, "*");

    if (callbackUrl) {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      }).catch(() => null);
    }
  });

  return (
    <Card className={`surface-strong rounded-[30px] border border-white/20 bg-gradient-to-br ${toneClass}`}>
      <CardHeader>
        <CardDescription>Iframe-ready widget</CardDescription>
        <CardTitle className="text-2xl">{widget.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[26px] border border-border bg-white/45 p-4 dark:bg-white/5">
          <p className="text-sm text-muted-foreground">Merchant</p>
          <p className="font-semibold">{source.merchantName}</p>
          <p className="text-sm text-muted-foreground">Source ID: {source.id}</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nominal pembayaran</label>
            <Input inputMode="numeric" placeholder="25000" {...form.register("amount")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Catatan</label>
            <Input placeholder="Order website" {...form.register("notes")} />
          </div>
          <Button className="w-full" type="submit">
            <QrCode className="h-4 w-4" />
            Generate QR widget
          </Button>
        </form>

        {generated ? (
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 14 }}>
            <div className="rounded-[28px] border border-border bg-white/70 p-5 text-center dark:bg-white/5">
              <QRCodeCanvas
                fgColor="#10211b"
                id="widget-qris-canvas"
                includeMargin
                level="H"
                ref={qrCanvasRef}
                size={220}
                style={{ maxWidth: "100%", height: "auto" }}
                value={generated.payload}
              />
              <div className="mt-4 space-y-1">
                <p className="font-display text-2xl font-semibold">{formatCurrency(generated.total)}</p>
                <p className="text-sm text-muted-foreground">Payload dinamis siap ditampilkan di iframe.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(generated.payload);
                  toast.success("Payload widget berhasil disalin.");
                }}
                type="button"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
                Copy payload
              </Button>
              <a className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground shadow-[0_18px_36px_rgba(244,183,94,0.22)]" href="/api/docs" target="_blank">
                Buka docs
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border px-4 py-5 text-sm leading-7 text-muted-foreground">
            Widget ini bisa ditempel lewat iframe. Setelah generate, parent page menerima `postMessage` bertipe `qrisflex.generated`.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
