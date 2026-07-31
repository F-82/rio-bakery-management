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
          <div className="flex gap-2 overflow-hidden px-3 pb-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 min-w-32 flex-1 rounded-full" />
            ))}
          </div>
          <div className="bg-bg px-3 py-2">
            <div className="bg-surface-2 flex gap-1 overflow-hidden rounded-full p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20 shrink-0 rounded-full" />
              ))}
            </div>
          </div>
          <div className="px-3 py-2">
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <div className="pos-menu-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="rounded-tile min-h-28" />
            ))}
          </div>
        </div>
        <div className="border-line hidden border-l p-4 md:block landscape:block">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="rounded-tile mt-4 h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
