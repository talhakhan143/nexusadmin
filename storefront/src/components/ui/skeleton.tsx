import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-secondary via-muted to-secondary bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}
