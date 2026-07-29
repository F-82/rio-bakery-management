import { Skeleton } from "@/components/ui/skeleton";

/** Breadcrumb + h1 shape every rowner page header uses. */
export function HeaderSkeleton() {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  );
}

/** The 2/4-column tinted stat-pill row (Dashboard, Menu, Inventory, Customers, Finance). */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[20px] bg-neutral-50 p-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Table/card-list rows (Orders, Inventory, Menu, Customers lists). */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-black/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-black/5 px-5 py-4 first:border-t-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** One tall accent-tinted hero panel (Dashboard's "Today's sales", Finance's "Total income"). */
export function HeroPanelSkeleton() {
  return (
    <div className="rounded-[20px] bg-neutral-50 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-12 w-48" />
    </div>
  );
}

/** Generic centered stub-page placeholder (Bookings, Employees, Reports, Tax). */
export function StubPageSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-black/5 py-20">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-5 w-56" />
      </div>
    </>
  );
}
