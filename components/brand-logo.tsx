import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link className={cn("group inline-flex items-center gap-3", className)} href={href}>
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_16px_36px_rgba(14,159,110,0.28)] transition-transform group-hover:-translate-y-0.5">
        <Image alt="QrisFlex icon" height={44} priority src="/icon.svg" width={44} />
      </span>
      <span>
        <span className="font-display block text-lg font-bold leading-none tracking-tight">QrisFlex</span>
        <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Static to Dynamic</span>
      </span>
    </Link>
  );
}
