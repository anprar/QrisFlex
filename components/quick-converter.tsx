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
import * as ReactDOMServer from "react-dom/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { enqueueOfflineItem } from "@/hooks/use-offline-queue";
import { generateDynamicQris } from "@/lib/qris/generator";
import { parseQrisPayload, type MerchantInfo } from "@/lib/qris/parser";
import { formatCurrency } from "@/lib/utils";

const converterSchema = z
  .object({
    amount: z.coerce.number().positive("Nominal wajib lebih dari 0."),
    feeType: z.enum(["none", "rp", "percent"]),
    feeValue: z.coerce.number().optional(),
    expiry: z.enum(["6h", "24h", "3d", "1m", "1y"]),
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
  expiryLabel: string;
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
  
  const [downloadSize, setDownloadSize] = useState<"256" | "512" | "1024" | "2048">("512");
  const [downloadFormat, setDownloadFormat] = useState<"png" | "svg">("png");

  const form = useForm<z.input<typeof converterSchema>, undefined, ConverterValues>({
    resolver: zodResolver(converterSchema),
    defaultValues: {
      amount: 25000,
      feeType: "none",
      feeValue: 0,
      expiry: "6h",
      notes: "",
    },
  });

  useEffect(() => {
    // Keep empty by default as requested by user
  }, []);

  const feeType = form.watch("feeType");
  const feeValue = form.watch("feeValue");

  // Auto-reset fee value when fee type changes
  useEffect(() => {
    if (feeType === "none") {
      form.setValue("feeValue", 0);
    } else {
      // Set to 0 initially when switched to rp or percent so user doesn't have to delete the old value
      form.setValue("feeValue", 0);
    }
    // Only run on feeType change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeType]);
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
      
      const expiryMap: Record<string, string> = {
        "6h": "6 Jam",
        "24h": "24 Jam",
        "3d": "3 Hari",
        "1m": "1 Bulan",
        "1y": "1 Tahun",
      };
      const expiryLabel = expiryMap[values.expiry] ?? "6 Jam";

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
          expiryLabel,
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
        expiryLabel,
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

          <form className="grid gap-4 sm:grid-cols-2 mt-2" onSubmit={generate}>
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
                <Input
                  disabled={feeType === "none"}
                  placeholder={feeType === "percent" ? "0.5" : "500"}
                  step={feeType === "percent" ? "0.1" : "1"}
                  type={feeType === "none" ? "text" : "number"}
                  {...form.register("feeValue")}
                />
              </div>
              {form.formState.errors.feeValue ? <p className="text-sm text-danger">{form.formState.errors.feeValue.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-sm font-semibold">Masa Aktif</label>
              <select
                className="h-12 w-full rounded-2xl border border-border bg-white/55 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)] dark:bg-white/8"
                {...form.register("expiry")}
              >
                <option value="6h">6 Jam (Free)</option>
                <option value="24h">24 Jam (Pro)</option>
                <option value="3d">3 Hari (Pro)</option>
                <option value="1m">1 Bulan (Pro)</option>
                <option value="1y">1 Tahun (Pro)</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-sm font-semibold">Catatan transaksi</label>
              <Input placeholder="Opsional (Mis: INV-001)" {...form.register("notes")} />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 mt-2">
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
              <div className="grid gap-3 rounded-[28px] border border-border bg-white/40 px-5 py-4 text-sm md:grid-cols-3 dark:bg-white/5">
                <div>
                  <p className="text-muted-foreground">Nominal dasar</p>
                  <p className="font-semibold">{formatCurrency(generated.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-semibold">{generated.feeLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Masa Aktif</p>
                  <p className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    {generated.expiryLabel}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-[28px] border border-border p-5">
                <p className="font-semibold">Format Download &amp; Share</p>
                
                <div className="grid gap-3 sm:grid-cols-2 mb-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Ukuran (px)</label>
                    <select
                      className="h-10 w-full rounded-xl border border-border bg-white/55 px-3 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--ring)] dark:bg-white/8"
                      value={downloadSize}
                      onChange={(e) => setDownloadSize(e.target.value as "256" | "512" | "1024" | "2048")}
                    >
                      <option value="256">256 x 256 (Kecil)</option>
                      <option value="512">512 x 512 (Standar)</option>
                      <option value="1024">1024 x 1024 (Besar)</option>
                      <option value="2048">2048 x 2048 (HD)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Format Render</label>
                    <select
                      className="h-10 w-full rounded-xl border border-border bg-white/55 px-3 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_var(--ring)] dark:bg-white/8"
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value as "png" | "svg")}
                    >
                      <option value="png">Gambar PNG</option>
                      <option value="svg">Vector SVG</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="w-full text-base font-semibold"
                    size="lg"
                    type="button"
                    onClick={() => {
                      try {
                        const sizeNum = parseInt(downloadSize, 10);
                        const fileName = `QRIS-${generated.merchant.name.replace(/[^a-zA-Z0-9]+/g, "-")}-${Date.now()}.${downloadFormat}`;
                        
                        // Buat elemen <a> untuk trigger download
                        const link = document.createElement("a");
                        link.download = fileName;

                        if (downloadFormat === "png") {
                          const tempCanvas = document.createElement("canvas");
                          tempCanvas.width = sizeNum;
                          tempCanvas.height = sizeNum;
                          const ctx = tempCanvas.getContext("2d");
                          
                          const originalCanvas = document.getElementById("qrisflex-generated-canvas") as HTMLCanvasElement | null;
                          if (!originalCanvas || !ctx) throw new Error("Gagal mengambil gambar referensi");
                          
                          ctx.imageSmoothingEnabled = false;
                          ctx.drawImage(originalCanvas, 0, 0, sizeNum, sizeNum);
                          
                          link.href = tempCanvas.toDataURL("image/png");
                        } else {
                          const svgHtml = ReactDOMServer.renderToString(
                            <QRCodeSVG fgColor="#10211b" id="qrisflex-download-svg" includeMargin level="H" size={sizeNum} value={generated.payload} />
                          );
                          const svgBlob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
                          link.href = URL.createObjectURL(svgBlob);
                        }

                        link.click();
                        toast.success(`Berhasil mengunduh ${downloadFormat.toUpperCase()} (${downloadSize}px).`);
                      } catch {
                        toast.error("Gagal mengunduh gambar.");
                      }
                    }}
                  >
                    <Download className="h-5 w-5" />
                    Unduh {downloadFormat.toUpperCase()}
                  </Button>
                  <Button
                    className="w-full text-base font-semibold"
                    onClick={async () => {
                      try {
                        if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
                          await navigator.share({
                            title: "QRIS Dinamis QrisFlex",
                            text: "Berikut link payload QRIS:",
                            url: generated.payload,
                          });
                        } else {
                          await navigator.clipboard.writeText(generated.payload);
                          toast.success("Payload teks berhasil disalin ke clipboard.");
                        }
                      } catch {
                        await navigator.clipboard.writeText(generated.payload);
                        toast.success("Payload teks berhasil disalin ke clipboard.");
                      }
                    }}
                    type="button"
                    variant="secondary"
                    size="lg"
                  >
                    <Share2 className="h-5 w-5" />
                    Salin Payload
                  </Button>
                </div>
                <div className="mt-2 text-center text-sm text-muted-foreground">
                  Gagal klik tombol? <button 
                    className="underline hover:text-foreground"
                    onClick={() => {
                      const canvas = document.getElementById("qrisflex-generated-canvas") as HTMLCanvasElement | null;
                      if (canvas) {
                        const win = window.open("");
                        if (win) {
                          win.document.write(`<img src="${canvas.toDataURL("image/png")}" alt="QRIS"/>`);
                        }
                      }
                    }}
                    type="button"
                  >Buka gambar di tab baru</button>
                </div>
              </div>
            </div>
          ) : null}

          {status !== "authenticated" ? (
            <div className="rounded-[28px] border border-dashed border-border px-5 py-5 text-sm leading-7 text-muted-foreground">
              Quick generate tetap bisa dipakai tanpa login. Ingin menyimpan history dan setting durasi lebih lama?
              <Link className="ml-2 font-semibold text-foreground underline hover:text-primary transition-colors" href="/sign-in">
                Masuk / Daftar sekarang
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
