import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getInventoryItemsForRecipe,
  getMenuCategories,
  getMenuItems,
} from "@/lib/queries/menu";
import { getCurrentProfile } from "@/lib/queries/profile";
import { MenuShell } from "@/components/menu/MenuShell";

export default async function MenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [items, categories, profile, inventoryOptions] = await Promise.all([
    getMenuItems({}),          // no filter — client filters in browser
    getMenuCategories(),
    getCurrentProfile(),
    getInventoryItemsForRecipe(),
  ]);

  const canManage = profile?.role === "owner" || profile?.role === "manager";

  return (
    <MenuShell
      items={items}
      categories={categories}
      inventoryOptions={inventoryOptions}
      canManage={canManage}
      businessId={profile?.business_id ?? ""}
    />
  );
}
