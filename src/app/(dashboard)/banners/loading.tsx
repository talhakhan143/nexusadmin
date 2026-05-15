import { ListSkeleton } from "@/components/modules/list-skeleton";

export default function Loading() {
  return <ListSkeleton rows={4} withFilters={false} />;
}
