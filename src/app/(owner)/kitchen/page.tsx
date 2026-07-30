import { redirect } from "next/navigation";
import { KitchenQueue } from "@/components/kitchen/KitchenQueue";
import { getTodaysKitchenOrders } from "@/lib/queries/kitchen";
import { getCurrentProfileContext } from "@/lib/queries/profile";

export default async function KitchenPage() {
  const context = await getCurrentProfileContext();
  const canUseKitchen =
    context?.profile.role === "owner" ||
    context?.profile.role === "manager" ||
    (context?.profile.role === "staff" && context.counter?.kind === "hot_plate");

  if (!canUseKitchen) redirect("/orders");

  return <KitchenQueue initialOrders={await getTodaysKitchenOrders()} />;
}
