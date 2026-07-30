import {
  getInventoryItems,
  getInventoryCategories,
  getLowStockCount,
  type InventoryFilter,
} from "@/lib/queries/inventory";
import { getCurrentProfile } from "@/lib/queries/profile";
import { InventoryShell } from "@/components/inventory/InventoryShell";

type InventoryPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;

  const filter: InventoryFilter = {
    lowStockOnly: firstValue(params.lowStock) === "1",
    categoryId: firstValue(params.category),
    search: firstValue(params.search),
  };

  const [items, categories, profile, lowStockCount] = await Promise.all([
    getInventoryItems(filter),
    getInventoryCategories(),
    getCurrentProfile(),
    getLowStockCount(),
  ]);

  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <InventoryShell
      items={items}
      categories={categories}
      canManage={canManage}
      lowStockCount={lowStockCount}
    />
  );
}
