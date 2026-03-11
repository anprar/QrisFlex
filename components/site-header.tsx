"use client";

import { LayoutDashboard, LogOut, Menu, Sparkles } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/api/docs", label: "API Docs" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="surface-strong rounded-[28px] border border-white/30 px-4 py-3 shadow-[0_18px_60px_rgba(19,41,33,0.15)] sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo />
          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {status === "authenticated" ? (
              <>
                <Link className={cn("inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/35 hover:text-foreground dark:hover:bg-white/5")} href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Button onClick={() => signOut({ redirectTo: "/" })} variant="outline">
                  <LogOut className="h-4 w-4" />
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Link className={cn("inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/35 hover:text-foreground dark:hover:bg-white/5")} href="/api/docs">
                  <Sparkles className="h-4 w-4" />
                  API Ready
                </Link>
                <Link className={cn("inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(14,159,110,0.28)]")} href="/sign-in">
                  Masuk Dashboard
                </Link>
              </>
            )}
          </div>
          <button
            aria-label="Buka menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className={cn("overflow-hidden transition-[max-height] duration-300 lg:hidden", open ? "max-h-80 pt-4" : "max-h-0")}>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {navItems.map((item) => (
              <Link className="rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-white/25 dark:hover:bg-white/5" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 px-2 pt-2">
              <ThemeToggle />
              {session ? (
                <Button className="flex-1" onClick={() => signOut({ redirectTo: "/" })} variant="outline">
                  Keluar
                </Button>
              ) : (
                <Link className={cn("inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground")} href="/sign-in">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
