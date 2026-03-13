import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center text-xs font-semibold uppercase tracking-[0.16em] whitespace-normal break-words sm:whitespace-nowrap sm:tracking-[0.24em]",
  {
    variants: {
      variant: {
        default: "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
        amber: "border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-200",
        muted: "border-border bg-white/45 text-muted-foreground dark:bg-white/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
