"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, ImageUp, LoaderCircle, QrCode, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { enqueueOfflineItem } from "@/hooks/use-offline-queue";
import { generateDynamicQris } from "@/lib/qris/generator";
import { parseQrisPayload, type MerchantInfo } from "@/lib/qris/parser";
import { sampleQrCatalog } from "@/lib/qris/samples";
import { formatCurrency } from "@/lib/utils";

const converterSchema = z
  .object({
    amount: z.coerce.number().positive("Nominal wajib lebih dari 0."),
    feeType: z.enum(["none", "rp", "percent"]),
    feeValue: z.coerce.number().optional(),
    notes: z.string().max(25, "Catatan maksimal 25 karakter.").optional(),
  })
  .superRefine((values, context) => {
    if (values.feeType !== "none" && (!values.feeValue || values.feeValue <= 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Isi nominal fee yang valid.",
        path: ["feeValue"],
      });
    }
  });

type ConverterValues = z.output<typeof converterSchema>;

interface GeneratedState {
  payload: string;
  total: number;
  amount: number;
  merchant: MerchantInfo;
  feeLabel: string;
}

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function QuickConverter() {
  const { status } = useSession();
  const [sourcePayload, setSourcePayload] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedState | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.input<typeof converterSchema>, undefined, ConverterValues>({
    resolver: zodResolver(converterSchema),
    defaultValues: {
      amount: 25000,
      feeType: "rp",
      feeValue: 500,
      notes: "Order cepat",
    },
  });

  useEffect(() => {
    const initialPayload = sampleQrCatalog[0]?.payload ?? null;
    if (initialPayload) {
      const parsed = parseQrisPayload(initialPayload);
      setSourcePayload(initialPayload);
      setMerchant(parsed.merchant);
    }
  }, []);

  const feeType = form.watch("feeType");
  const feeValue = form.watch("feeValue");
  const feePreview = useMemo(() => {
    if (feeType === "none") {
      return "Tanpa fee";
    }

    return feeType === "rp" ? `Fee Rp ${feeValue ?? 0}` : `Fee ${feeValue ?? 0}%`;
  }, [feeType, feeValue]);

  const applyPayload = useCallback((payload: string) => {
    const parsed = parseQrisPayload(payload);

    if (!parsed.valid) {
      throw new Error("QRIS tidak valid. Gunakan QR statis resmi.");
    }

    setSourcePayload(payload);
    setMerchant(parsed.merchant);
    setGenerated(null);
    toast.success(`QRIS ${parsed.merchant.name} siap digenerate.`);
  }, []);

  const decodeFile = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimum 5MB.");
        return;
      }

      setIsDecoding(true);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const { BrowserQRCodeReader } = await import("@zxing/library");
        const reader = new BrowserQRCodeReader();
        const result = await reader.decodeFromImageUrl(objectUrl);
        applyPayload(result.getText());
        reader.reset();
      } catch {
        if (!navigator.onLine) {
          toast.error("Decode offline gagal. Coba gambar yang lebih jelas atau sambungkan internet untuk fallback server.");
          setIsDecoding(false);
          return;
        }

        try {
          const imageBase64 = await toDataUrl(file);
          const response = await fetch("/api/qris/decode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 }),
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.message ?? "Decode server gagal.");
          }

          applyPayload(payload.payload);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Gagal decode QRIS.");
        }
      } finally {
        setIsDecoding(false);
      }
    },
    [applyPayload],
  );

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file) {
        void decodeFile(file);
      }
    },
    [decodeFile],
  );

  const dropzone = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
  });

  const generate = form.handleSubmit(async (values) => {
    if (!sourcePayload || !merchant) {
      toast.error("Upload atau pilih QRIS statis terlebih dahulu.");
      return;
    }

    setIsGenerating(true);

    try {
      const fee = values.feeType === "none" ? undefined : { type: values.feeType, value: values.feeValue ?? 0 };

      if (!navigator.onLine) {
        const offlineResult = generateDynamicQris({
          payload: sourcePayload,
          amount: values.amount,
          fee,
          notes: values.notes,
        });

        setGenerated({
          payload: offlineResult.payload,
          total: offlineResult.total,
          amount: values.amount,
          merchant: offlineResult.parsed.merchant,
          feeLabel: feePreview,
        });

        await enqueueOfflineItem({
          payload: offlineResult.payload,
          amount: values.amount,
          total: offlineResult.total,
          merchantName: offlineResult.parsed.merchant.name,
          channel: "offline",
          notes: values.notes,
          createdAt: new Date().toISOString(),
        });
        toast.success("QRIS dinamis berhasil dibuat secara offline dan masuk antrean sinkronisasi.");
        return;
      }

      const response = await fetch("/api/qris/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: sourcePayload,
          amount: values.amount,
          fee,
          notes: values.notes,
          persist: status === "authenticated",
          label: merchant.name,
          channel: "web",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Gagal generate QRIS dinamis.");
      }

      setGenerated({
        payload: payload.payload,
        total: payload.total,
        amount: payload.amount,
        merchant: payload.merchant,
        feeLabel: feePreview,
      });

      toast.success("QRIS dinamis siap diunduh.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat generate.");
    } finally {
      setIsGenerating(false);
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] min-w-0">
      <Card className="hero-shell overflow-hidden rounded-[36px] border border-white/35 bg-gradient-to-br from-white/70 via-white/50 to-white/35 dark:from-white/6 dark:via-white/5 dark:to-white/4">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Guest mode aktif</Badge>
            <Badge variant="amber">Offline-capable PWA</Badge>
          </div>
          <CardTitle className="max-w-3xl text-4xl leading-tight sm:text-5xl">
            Ubah QRIS Statis -&gt; Dinamis dalam 3 detik. Gratis, unlimited, API ready.
          </CardTitle>
          <CardDescription className="max-w-3xl text-base leading-8">
            Upload PNG/JPG, isi nominal, lalu hasilkan QRIS dinamis dengan fee dan catatan. Cocok untuk kasir, UMKM, landing checkout, sampai widget iframe untuk website lain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`rounded-[32px] border border-dashed border-border px-6 py-8 transition ${dropzone.isDragActive ? "bg-primary/8" : "bg-white/30 dark:bg-white/4"}`}
            {...dropzone.getRootProps()}
          >
            <input {...dropzone.getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="animate-float flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
                {isDecoding ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <ImageUp className="h-7 w-7" />}
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">Drag & drop QRIS PNG/JPG</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Maks. 5MB, decode lokal dulu. Kalau gagal, otomatis fallback ke server decode saat online.
                </p>
              </div>
              <Button type="button" variant="outline">
                Pilih file QRIS
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {sampleQrCatalog.map((sample) => (
              <button
                className="rounded-[24px] border border-border bg-white/35 px-4 py-4 text-left transition hover:-translate-y-1 hover:border-primary/30 hover:bg-white/60 dark:bg-white/5"
                key={sample.id}
                onClick={() => applyPayload(sample.payload)}
                type="button"
              >
                <p className="font-semibold">{sample.label}</p>
                <p className="text-sm text-muted-foreground">Demo QRIS {sample.city}</p>
              </button>
            ))}
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={generate}>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-sm font-semibold">Nominal (Rp)</label>
              <Input inputMode="numeric" placeholder="25000" {...form.register("amount")} />
              {form.formState.errors.amount ? <p className="text-sm text-danger">{form.formState.errors.amount.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-sm font-semibold">Fee</label>
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <select
                  className="h-12 rounded-2xl border border-border bg-white/55 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)] dark:bg-white/8"
                  {...form.register("feeType")}
                >
                  <option value="none">Tanpa fee</option>
                  <option value="rp">Fee Rp</option>
                  <option value="percent">Fee %</option>
                </select>
                <Input inputMode="numeric" placeholder="500" {...form.register("feeValue")} />
              </div>
              {form.formState.errors.feeValue ? <p className="text-sm text-danger">{form.formState.errors.feeValue.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold">Catatan transaksi</label>
              <Textarea placeholder="Contoh: INV-2026-001" rows={4} {...form.register("notes")} />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button className="w-full sm:w-auto" disabled={isGenerating} size="lg" type="submit">
                {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate QR Dinamis
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Payload tervalidasi CRC dan fee: {feePreview}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="surface-strong rounded-[36px] border border-white/30">
        <CardHeader>
          <CardDescription>Preview QR hasil generate</CardDescription>
          <CardTitle className="text-3xl">Siap unduh, share, atau embed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[28px] border border-border bg-white/70 p-5 text-center dark:bg-white/5">
            {generated ? (
              <>
                <div className="flex justify-center">
                  <QRCodeCanvas fgColor="#10211b" id="qrisflex-generated-canvas" includeMargin level="H" size={220} style={{ maxWidth: "100%", height: "auto" }} value={generated.payload} />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-display text-3xl font-semibold">{formatCurrency(generated.total)}</p>
                  <p className="text-sm text-muted-foreground">{generated.merchant.name}</p>
                </div>
              </>
            ) : sourcePayload ? (
              <>
                <div className="flex justify-center">
                  <QRCodeSVG includeMargin level="H" size={220} style={{ maxWidth: "100%", height: "auto" }} value={sourcePayload} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">QR statis terdeteksi. Isi nominal lalu generate.</p>
              </>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-muted-foreground">
                <QrCode className="h-12 w-12" />
                Preview QR akan muncul di sini.
              </div>
            )}
          </div>

          {merchant ? (
            <div className="rounded-[28px] border border-border px-5 py-4 text-sm leading-7">
              <p className="font-semibold">Merchant</p>
              <p>{merchant.name}</p>
              <p className="text-muted-foreground">
                {merchant.bank} - {merchant.city}
              </p>
              {previewUrl ? <p className="pt-2 text-xs text-muted-foreground">Preview image siap ditinjau ulang dari browser.</p> : null}
            </div>
          ) : null}

          {generated ? (
            <div className="space-y-3">
              <div className="grid gap-3 rounded-[28px] border border-border px-5 py-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Nominal dasar</p>
                  <p className="font-semibold">{formatCurrency(generated.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-semibold">{generated.feeLabel}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    const canvas = document.getElementById("qrisflex-generated-canvas") as HTMLCanvasElement | null;
                    if (!canvas) {
                      return;
                    }

                    const link = document.createElement("a");
                    link.download = `qrisflex-${Date.now()}.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                  }}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({
                        title: "QRIS Dinamis QrisFlex",
                        text: generated.payload,
                      });
                    } else {
                      await navigator.clipboard.writeText(generated.payload);
                      toast.success("Payload berhasil disalin.");
                    }
                  }}
                  type="button"
                  variant="secondary"
                >
                  <Share2 className="h-4 w-4" />
                  Share / Copy
                </Button>
              </div>
            </div>
          ) : null}

          {status !== "authenticated" ? (
            <div className="rounded-[28px] border border-dashed border-border px-5 py-5 text-sm leading-7 text-muted-foreground">
              Quick generate tetap bisa dipakai tanpa login. Ingin menyimpan QR statis ke dashboard selamanya?
              <Link className="ml-2 font-semibold text-foreground underline" href="/sign-in">
                Masuk sekarang
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
