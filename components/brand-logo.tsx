import { WalletCards } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link className={cn("group inline-flex items-center gap-3", className)} href={href}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_36px_rgba(14,159,110,0.28)] transition-transform group-hover:-translate-y-0.5">
        <WalletCards className="h-5 w-5" />
      </span>
      <span>
        <span className="font-display block text-lg font-bold leading-none tracking-tight">QrisFlex</span>
        <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Static to Dynamic</span>
      </span>
    </Link>
  );
}
