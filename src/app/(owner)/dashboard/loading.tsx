import { HeaderSkeleton, HeroPanelSkeleton, StatGridSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <HeaderSkeleton />
      <HeroPanelSkeleton />
      <StatGridSkeleton count={4} />
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 h-40 rounded-[24px] md:col-span-7" />
        <Skeleton className="col-span-12 h-40 rounded-[24px] md:col-span-5" />
      </div>
    </>
  );
}
