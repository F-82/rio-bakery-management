import { HeaderSkeleton, TableSkeleton } from "@/components/patterns/PageSkeleton";

export default function KitchenLoading() {
  return (
    <>
      <HeaderSkeleton />
      <TableSkeleton rows={6} />
    </>
  );
}
