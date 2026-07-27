import { PageHeader } from "@/components/patterns/PageHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryList } from "@/components/inventory/InventoryList";
import { AddItemDrawer } from "@/components/inventory/AddItemDrawer";
import { getInventoryCategories, getInventoryItems, type InventoryFilter } from "@/lib/queries/inventory";
import { getCurrentProfile } from "@/lib/queries/profile";

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

  const [items, categories, profile] = await Promise.all([
    getInventoryItems(filter),
    getInventoryCategories(),
    getCurrentProfile(),
  ]);

  // Mirrors inventory_items_write / stock_movements_read RLS: staff get a
  // read-only table, owner/manager get add/edit and the stock entry forms.
  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 pb-0 sm:p-6 sm:pb-0">
        <PageHeader title="Inventory" actions={canManage ? <AddItemDrawer categories={categories} /> : undefined} />
      </div>
      <InventoryFilters categories={categories} />
      {/* Keyed by the filter so a filter change remounts with fresh rows
          instead of syncing new props into local state via an effect. */}
      <InventoryList key={JSON.stringify(filter)} items={items} categories={categories} canManage={canManage} />
    </div>
  );
}
