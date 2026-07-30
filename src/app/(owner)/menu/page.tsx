import {
  getInventoryItemsForRecipe,
  getMenuCategories,
  getMenuItems,
  getSoldTodayByMenuItem,
} from "@/lib/queries/menu";
import { getCurrentProfile } from "@/lib/queries/profile";
import { MenuShell } from "@/components/menu/MenuShell";

export default async function MenuPage() {
  const [items, categories, profile, inventoryOptions, soldToday] = await Promise.all([
    getMenuItems({}),          // no filter — client filters in browser
    getMenuCategories(),
    getCurrentProfile(),
    getInventoryItemsForRecipe(),
    getSoldTodayByMenuItem(),
  ]);

  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <MenuShell
      items={items}
      categories={categories}
      inventoryOptions={inventoryOptions}
      canManage={canManage}
      businessId={profile?.business_id ?? ""}
      soldToday={soldToday}
    />
  );
}
