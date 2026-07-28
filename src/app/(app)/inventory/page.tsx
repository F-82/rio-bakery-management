import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { Button } from "@/components/ui/button";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryList } from "@/components/inventory/InventoryList";
import { AddItemDrawer } from "@/components/inventory/AddItemDrawer";
import {
  getInventoryCategories,
  getInventoryItems,
  getLowStockCount,
  type InventoryFilter,
} from "@/lib/queries/inventory";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getTranslation } from "@/lib/i18n-server";

type InventoryPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
    const { t } = await getTranslation();
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

  // Mirrors inventory_items_write / stock_movements_read RLS: staff get a
  // read-only table, owner/manager get add/edit and the stock entry forms.
  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 p-4 pb-0 sm:p-6 sm:pb-0">
        <PageHeader title={t("Inventory")} actions={canManage ? <AddItemDrawer categories={categories} /> : undefined} />
        {/* Low-stock summary — the one AccentPanel this screen gets, only when there's something to
            show (DESIGN.md §Structural language). "Low stock" sits outside the panel — the gradient
            is never behind small text (DESIGN.md §Palette). */}
        {lowStockCount > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-micro text-ink-2">{t("Low stock")}</span>
            <AccentPanel className="flex items-center justify-between gap-3">
              <p className="text-h1 text-ink">
                {lowStockCount} {t("item")}{lowStockCount === 1 ? "" : "s"} {t("need restocking")}</p>
              <Button asChild variant="outline">
                <Link href="/inventory?lowStock=1">{t("View")}</Link>
              </Button>
            </AccentPanel>
          </div>
        )}
      </div>
      <InventoryFilters categories={categories} />
      {/* Keyed by the filter so a filter change remounts with fresh rows
          instead of syncing new props into local state via an effect. */}
      <InventoryList key={JSON.stringify(filter)} items={items} categories={categories} canManage={canManage} />
    </div>
  );
}
