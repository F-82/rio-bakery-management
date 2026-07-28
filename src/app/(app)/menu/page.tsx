import { PageHeader } from "@/components/patterns/PageHeader";
import { AddMenuItemDrawer } from "@/components/menu/AddMenuItemDrawer";
import { MenuFilters } from "@/components/menu/MenuFilters";
import { MenuList } from "@/components/menu/MenuList";
import {
  getInventoryItemsForRecipe,
  getMenuCategories,
  getMenuItems,
  type MenuItemFilter,
} from "@/lib/queries/menu";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getTranslation } from "@/lib/i18n-server";

type MenuPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
    const { t } = await getTranslation();
  const params = await searchParams;

  const filter: MenuItemFilter = {
    availableOnly: firstValue(params.available) === "1",
    categoryId: firstValue(params.category),
    search: firstValue(params.search),
  };

  const [items, categories, profile, inventoryOptions] = await Promise.all([
    getMenuItems(filter),
    getMenuCategories(),
    getCurrentProfile(),
    getInventoryItemsForRecipe(),
  ]);

  // Mirrors menu_items_write / recipe_items_all RLS: staff get a read-only
  // table, owner/manager get add/edit and the recipe builder.
  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 p-4 pb-0 sm:p-6 sm:pb-0">
        <PageHeader
          title={t("Menu")}
          actions={
            canManage && profile ? (
              <AddMenuItemDrawer businessId={profile.business_id} categories={categories} />
            ) : undefined
          }
        />
      </div>
      <MenuFilters categories={categories} />
      {/* Keyed by the filter so a filter change remounts with fresh rows
          instead of syncing new props into local state via an effect. */}
      <MenuList
        key={JSON.stringify(filter)}
        items={items}
        businessId={profile?.business_id ?? ""}
        categories={categories}
        inventoryOptions={inventoryOptions}
        canManage={canManage}
      />
    </div>
  );
}
