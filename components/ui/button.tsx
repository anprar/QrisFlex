import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-transform duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary px-5 py-3 text-primary-foreground shadow-[0_18px_40px_rgba(14,159,110,0.28)] hover:-translate-y-0.5",
        secondary: "bg-secondary px-5 py-3 text-secondary-foreground shadow-[0_18px_36px_rgba(244,183,94,0.22)] hover:-translate-y-0.5",
        outline:
          "border border-border bg-transparent px-5 py-3 text-foreground hover:bg-white/20 dark:hover:bg-white/5",
        ghost: "px-4 py-2 text-muted-foreground hover:bg-white/25 hover:text-foreground dark:hover:bg-white/5",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, className, variant, size, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(buttonVariants({ variant, size, className }), (children.props as { className?: string }).className),
      });
    }

    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";

export { buttonVariants };
