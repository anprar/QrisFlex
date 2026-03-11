import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-border bg-white/55 px-4 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/80 focus:border-primary focus:shadow-[0_0_0_4px_var(--ring)] dark:bg-white/5",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
