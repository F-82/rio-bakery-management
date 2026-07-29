import { HeaderSkeleton, TableSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <TableSkeleton rows={8} />
    </>
  );
}
