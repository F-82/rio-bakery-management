import { HeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <>
      <HeaderSkeleton />
      <Skeleton className="h-11 w-full rounded-full" />
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={8} />
    </>
  );
}
