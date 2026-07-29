import { HeaderSkeleton, HeroPanelSkeleton, StatGridSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <HeroPanelSkeleton />
      <StatGridSkeleton count={2} />
      <Skeleton className="h-40 w-full rounded-[24px]" />
    </>
  );
}
