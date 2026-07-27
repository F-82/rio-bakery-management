import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

export type NavLinkItem = { kind: "link"; label: string; href: string; icon: LucideIcon };
export type NavMoreItem = { kind: "more"; label: string; icon: LucideIcon };
export type NavItem = NavLinkItem | NavMoreItem;

const dashboard: NavLinkItem = { kind: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard };
const orders: NavLinkItem = { kind: "link", label: "Orders", href: "/orders", icon: Receipt };
const menu: NavLinkItem = { kind: "link", label: "Menu", href: "/menu", icon: BookOpen };
const inventory: NavLinkItem = { kind: "link", label: "Inventory", href: "/inventory", icon: Package };
const finance: NavLinkItem = { kind: "link", label: "Finance", href: "/finance", icon: Wallet };
const more: NavMoreItem = { kind: "more", label: "More", icon: MoreHorizontal };

/** Menu, Bookings, Employees, Reports, Tax, Settings (DESIGN.md §Navigation). */
export const MORE_SHEET_ITEMS: NavLinkItem[] = [
  menu,
  { kind: "link", label: "Bookings", href: "/bookings", icon: CalendarDays },
  { kind: "link", label: "Employees", href: "/employees", icon: Users },
  { kind: "link", label: "Reports", href: "/reports", icon: BarChart3 },
  { kind: "link", label: "Tax", href: "/tax", icon: FileText },
  { kind: "link", label: "Settings", href: "/settings", icon: Settings },
];

/**
 * Staff get 3 tabs, owner/manager get 5 — this mirrors the RLS boundary
 * (staff can't load Finance, so it isn't in their nav). Never hide a tab at
 * a breakpoint; only these two role-driven sets exist.
 */
export function getPrimaryNavItems(role: UserRole): NavItem[] {
  if (role === "staff") return [orders, menu, inventory];
  return [dashboard, orders, inventory, finance, more];
}

/** Default landing tab per role, used for "/" and post-login redirects. */
export function getHomeHref(role: UserRole): string {
  return role === "staff" ? "/orders" : "/dashboard";
}

const ALL_LINK_ITEMS: NavLinkItem[] = [dashboard, orders, menu, inventory, finance, ...MORE_SHEET_ITEMS];

/** Page title for the header, derived from the current pathname. */
export function getPageTitle(pathname: string): string {
  const match = ALL_LINK_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  return match?.label ?? "Rio Bakers Hut";
}
