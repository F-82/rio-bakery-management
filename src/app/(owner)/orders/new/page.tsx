import { getMenuCategories, getMenuItemsForPos } from "@/lib/queries/menu";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfile } from "@/lib/queries/profile";
import { PosScreen } from "@/components/pos/PosScreen";

export default async function NewOrderPage() {
  const [categories, menuItems, counters, profile] = await Promise.all([
    getMenuCategories(),
    getMenuItemsForPos(),
    getActiveCounters(),
    getCurrentProfile(),
  ]);

  return (
    <PosScreen
      categories={categories}
      menuItems={menuItems}
      counters={counters}
      defaultCounterId={profile?.counter_id ?? null}
    />
  );
}
