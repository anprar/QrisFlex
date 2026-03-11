"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Ganti tema"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary/40",
        isDark
          ? "bg-white/10 text-amber-300 hover:bg-white/15"
          : "bg-black/5 text-slate-700 hover:bg-black/8",
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
