import { HeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <>
      <HeaderSkeleton />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={8} />
    </>
  );
}
