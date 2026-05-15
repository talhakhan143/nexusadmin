import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
