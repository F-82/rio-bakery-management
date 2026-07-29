import { HeaderSkeleton } from "@/components/patterns/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="rounded-[24px] border border-black/5 p-5">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-10 w-full rounded-tile" />
          <Skeleton className="h-10 w-full rounded-tile" />
          <Skeleton className="h-10 w-2/3 rounded-tile" />
        </div>
      </div>
    </>
  );
}
