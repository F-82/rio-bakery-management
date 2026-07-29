import { getMenuCategories, getMenuItemsForPos } from "@/lib/queries/menu";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfile } from "@/lib/queries/profile";
import { PosScreen } from "@/components/pos/PosScreen";
import { AppShell } from "@/components/shared/AppShell";

export default async function NewOrderPage() {
  const [categories, menuItems, counters, profile] = await Promise.all([
    getMenuCategories(),
    getMenuItemsForPos(),
    getActiveCounters(),
    getCurrentProfile(),
  ]);

  return (
    <AppShell pageLabel="Orders" mainClassName="flex flex-1 flex-col overflow-hidden">
      <PosScreen
        categories={categories}
        menuItems={menuItems}
        counters={counters}
        defaultCounterId={profile?.counter_id ?? null}
      />
    </AppShell>
  );
}
