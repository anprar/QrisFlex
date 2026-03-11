"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ScanSearch, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const slides = [
  {
    title: "Upload sekali, decode instan",
    description: "Tarik file PNG/JPG QRIS statis, QrisFlex akan decode payload secara lokal dan mengekstrak data merchant tanpa menunggu login.",
    icon: ScanSearch,
  },
  {
    title: "Masukkan nominal dan fee",
    description: "Set nominal tetap, fee Rp atau persen, tambahkan catatan singkat, lalu generate payload dinamis yang tetap patuh struktur QRIS.",
    icon: Wallet,
  },
  {
    title: "Bagikan ke pelanggan atau widget",
    description: "Unduh PNG/SVG, share langsung, gunakan widget iframe, atau kirim ke sistem Anda lewat API dan webhook callback manual.",
    icon: BadgeCheck,
  },
];

export function HowItWorksCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[activeIndex];
  const Icon = slide.icon;

  return (
    <Card className="overflow-hidden rounded-[30px] border border-white/35 bg-gradient-to-br from-white/60 to-white/35 dark:from-white/6 dark:to-white/4">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardDescription className="mb-2 uppercase tracking-[0.28em]">How it works</CardDescription>
          <CardTitle className="text-2xl">3 langkah, tanpa ribet</CardTitle>
        </div>
        <div className="flex gap-2">
          {slides.map((item, index) => (
            <button
              aria-label={`Lihat langkah ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-10 bg-primary" : "w-2.5 bg-foreground/15"}`}
              key={item.title}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-[110px_1fr]"
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: 18 }}
            key={slide.title}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="animate-glow flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_20px_50px_rgba(14,159,110,0.24)]">
              <Icon className="h-10 w-10" />
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-semibold tracking-tight">{slide.title}</h3>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">{slide.description}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                Langkah {activeIndex + 1}
                <ArrowRight className="h-4 w-4" />
                QRIS dinamis siap dipakai
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
