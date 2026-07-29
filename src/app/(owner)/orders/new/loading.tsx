import { Skeleton } from "@/components/ui/skeleton";

export default function NewOrderLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 pb-2 md:px-5 md:pt-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-1 h-8 w-32" />
      </div>

      <div className="pos-layout min-h-0 flex-1">
        <div className="pos-grid">
          <div className="flex gap-1.5 overflow-hidden border-b border-line bg-bg px-3 py-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-full" />
            ))}
          </div>
          <div className="px-3 py-2">
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="min-h-14 rounded-tile" />
            ))}
          </div>
        </div>
        <div className="hidden border-l border-line p-4 md:block landscape:block">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-4 h-24 w-full rounded-tile" />
        </div>
      </div>
    </div>
  );
}
