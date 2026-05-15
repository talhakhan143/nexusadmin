import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/modules/list-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <ListSkeleton rows={6} withHeader={false} withFilters={false} />
    </div>
  );
}
