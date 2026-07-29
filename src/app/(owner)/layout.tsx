import { redirect } from "next/navigation";
import { getCurrentProfileContext } from "@/lib/queries/profile";
import { getLowStockCount } from "@/lib/queries/inventory";
import { AppShell } from "@/components/shared/AppShell";

/**
 * Owner shell layout: auth redirect, then one persistent AppShell (topbar +
 * sidebar) wrapping every route in this group. Previously each screen
 * (DashboardShell, MenuShell, ...) hand-rolled its own copy of the chrome,
 * so every navigation tore the whole thing down and rebuilt it from
 * scratch — the tap-then-wait-then-pop symptom. Now only `children` swaps.
 *
 * Lives in (owner)/ route group so it never receives the (app) shell.
 */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentProfileContext();
  if (!context) redirect("/login");

  const lowStockCount = await getLowStockCount();

  return <AppShell lowStockCount={lowStockCount}>{children}</AppShell>;
}
