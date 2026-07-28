import { redirect } from "next/navigation";
import { getCurrentProfileContext } from "@/lib/queries/profile";

/**
 * Minimal layout for the owner dashboard.
 *
 * Handles auth redirect only — no Nav, no Header, no shell padding.
 * The DashboardShell renders its own self-contained full-page rowner chrome.
 *
 * Lives in (owner)/ route group so it never receives the (app) shell.
 */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentProfileContext();
  if (!context) redirect("/login");
  return <>{children}</>;
}
