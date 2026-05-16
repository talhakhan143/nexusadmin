import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center text-[10px] font-medium uppercase tracking-wider px-2 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        gold: "bg-accent text-accent-foreground",
        sale: "bg-destructive text-destructive-foreground",
        new: "bg-emerald-700 text-white",
        soft: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
