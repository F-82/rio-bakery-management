"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  Utensils,
  Users,
  Calendar,
  UserCog,
  BarChart3,
  Receipt,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Boxes,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reprintJob } from "@/lib/actions/print";
import { signOut } from "@/lib/actions/auth";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import {
  colomboToday,
  countLowStock,
  getUnresolvedPrintFailures,
  sumCompletedRevenue,
  summariseOrders,
  type DashboardOrder,
  type DashboardPrintJob,
  type StockLevel,
} from "@/lib/dashboard";
import { Decimal } from "decimal.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardShellProps = {
  initialOrders: DashboardOrder[];
  initialPrintJobs: DashboardPrintJob[];
  initialStockLevels: StockLevel[];
  expensesToday: number;
};

const PRINT_TARGET_LABELS: Record<string, string> = {
  customer_receipt: "Customer receipt",
  kitchen_ticket: "Kitchen ticket",
};

// ---------------------------------------------------------------------------
// Local primitive helpers
// ---------------------------------------------------------------------------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[24px] bg-white p-5 ${className}`}>{children}</div>;
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "black";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-[var(--accent-green)] text-white",
    yellow: "bg-[var(--accent-yellow)] text-black",
    black: "bg-black text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function IconBubble({
  children,
  tone = "black",
}: {
  children: React.ReactNode;
  tone?: "black" | "yellow" | "green" | "white";
}) {
  const tones: Record<string, string> = {
    black: "bg-black text-white",
    yellow: "bg-[var(--accent-yellow)] text-black",
    green: "bg-[var(--accent-green)] text-white",
    white: "bg-white text-black shadow",
  };
  return (
    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav — all 11 items, wired to real routes
// ---------------------------------------------------------------------------

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard"  },
  { icon: ShoppingBag,     label: "Orders",     href: "/orders"     },
  { icon: Package,         label: "Inventory",  href: "/inventory"  },
  { icon: Wallet,          label: "Finance",    href: "/finance"    },
  { icon: Utensils,        label: "Menu",       href: "/menu"       },
  { icon: Users,           label: "Customers",  href: "/customers"  },
  { icon: Calendar,        label: "Bookings",   href: "/bookings"   },
  { icon: UserCog,         label: "Employees",  href: "/employees"  },
  { icon: BarChart3,       label: "Reports",    href: "/reports"    },
  { icon: Receipt,         label: "Tax",        href: "/tax"        },
  { icon: Settings,        label: "Settings",   href: "/settings"   },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Rowner — full-page warm-minimal dashboard shell.
 *
 * Renders in the (owner) route group which has no shared Nav or Header chrome,
 * so this component occupies the entire viewport. All 11 sidebar links go to
 * real routes. Data is seeded from the server and patched live via Supabase
 * Realtime (same channel/logic as the previous DashboardClient).
 */
export function DashboardShell({
  initialOrders,
  initialPrintJobs,
  initialStockLevels,
  expensesToday,
}: DashboardShellProps) {
  const pathname = usePathname();

  // -------------------------------------------------------------------------
  // Live state — seeded from server, patched via Realtime
  // -------------------------------------------------------------------------
  const [orders, setOrders] = useState(
    () => new Map(initialOrders.map((o) => [o.id, o])),
  );
  const [printJobs, setPrintJobs] = useState(
    () => new Map(initialPrintJobs.map((j) => [j.id, j])),
  );
  const [stockLevels, setStockLevels] = useState(
    () => new Map(initialStockLevels.map((s) => [s.id, s])),
  );

  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  useEffect(() => {
    const supabase = createClient();
    const today = colomboToday();

    const channel = supabase
      .channel("dashboard-shell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        const r = p.new as { id: string; status: DashboardOrder["status"]; total: number; order_number: string; order_day: string };
        if (r.order_day !== today) return;
        setOrders((cur) => new Map(cur).set(r.id, { id: r.id, status: r.status, total: r.total, orderNumber: r.order_number, orderDay: r.order_day }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (p) => {
        const r = p.new as { id: string; status: DashboardOrder["status"]; total: number; order_number: string; order_day: string };
        setOrders((cur) => {
          if (!cur.has(r.id) && r.order_day !== today) return cur;
          return new Map(cur).set(r.id, { id: r.id, status: r.status, total: r.total, orderNumber: r.order_number, orderDay: r.order_day });
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "print_jobs" }, (p) => {
        const r = p.new as { id: string; order_id: string; target: DashboardPrintJob["target"]; status: DashboardPrintJob["status"]; last_error: string | null; created_at: string };
        if (!ordersRef.current.has(r.order_id)) return;
        setPrintJobs((cur) => new Map(cur).set(r.id, { id: r.id, orderId: r.order_id, target: r.target, status: r.status, lastError: r.last_error, createdAt: r.created_at }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "print_jobs" }, (p) => {
        const r = p.new as { id: string; order_id: string; target: DashboardPrintJob["target"]; status: DashboardPrintJob["status"]; last_error: string | null; created_at: string };
        setPrintJobs((cur) => {
          if (!cur.has(r.id)) return cur;
          return new Map(cur).set(r.id, { id: r.id, orderId: r.order_id, target: r.target, status: r.status, lastError: r.last_error, createdAt: r.created_at });
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, (p) => {
        const r = p.new as { id: string; qty_on_hand: number; low_stock_threshold: number };
        setStockLevels((cur) => new Map(cur).set(r.id, { id: r.id, qtyOnHand: r.qty_on_hand, lowStockThreshold: r.low_stock_threshold }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const orderList    = useMemo(() => [...orders.values()],     [orders]);
  const summary      = useMemo(() => summariseOrders(orderList), [orderList]);
  const income       = useMemo(() => sumCompletedRevenue(orderList), [orderList]);
  const netProfit    = useMemo(() => income.minus(expensesToday), [income, expensesToday]);
  const orderNumbers = useMemo(() => new Map(orderList.map((o) => [o.id, o.orderNumber])), [orderList]);
  const failures     = useMemo(() => getUnresolvedPrintFailures([...printJobs.values()], orderNumbers), [printJobs, orderNumbers]);
  const lowStockCount = useMemo(() => countLowStock([...stockLevels.values()]), [stockLevels]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ fontFamily: "var(--font-outfit, var(--font-sans))" }}>

          {/* ── Top tab bar ────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-black/5 flex-shrink-0">
            {/* Brand glyph */}
            <Link href="/dashboard" className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity" style={{ background: "var(--accent-yellow)" }}>
              <span className="text-black text-sm select-none">✦</span>
            </Link>

            {/* Open tab chip */}
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium">
              <LayoutDashboard className="h-3.5 w-3.5 text-neutral-500" />
              <span>Dashboard</span>
            </div>

            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-2">
              {/* Search — desktop */}
              <label className="hidden md:flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 w-72 cursor-text">
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                <input
                  placeholder="Search orders, inventory, customers…"
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-neutral-400"
                  onFocus={() => {/* future: open search modal */}}
                />
                <span className="text-[10px] rounded-md bg-white px-1.5 py-0.5 text-neutral-400 font-mono">⌘K</span>
              </label>

              {/* Bell */}
              <button
                type="button"
                className="relative h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-neutral-700" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: "var(--accent-green)" }} />
              </button>

              {/* Sign out avatar */}
              <button
                type="button"
                onClick={() => signOut()}
                className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium select-none hover:bg-neutral-300 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5 text-neutral-600" />
              </button>
            </div>
          </div>

          {/* ── Shell body: sidebar + main ──────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── Desktop sidebar w-56 ─────────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-56 border-r border-black/5 p-3 gap-0.5 flex-shrink-0 overflow-y-auto">
              <div className="mb-2 px-3 pt-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Rio Bakers Hut</div>
              </div>

              {SIDEBAR_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-black text-white font-medium"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

              {/* ── Promo block ── */}
              <div className="mt-auto pt-3">
                <div className="rounded-[20px] p-4" style={{ background: "var(--accent-yellow)" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-semibold">Pro plan</span>
                  </div>
                  <p className="mt-1.5 text-xs text-black/70 leading-snug">
                    Unlock advanced reports & multi-location support.
                  </p>
                  <Link
                    href="/settings"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    Upgrade <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* ── Mobile icon rail w-14 ─────────────────────────────────── */}
            <aside className="flex md:hidden flex-col w-14 py-3 px-1.5 shrink-0 border-r border-black/5 overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all duration-150 ${
                      isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </aside>

            {/* ── Main content ─────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

              {/* Header / breadcrumb */}
              <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>Rio Bakers Hut</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-neutral-800 font-medium">Dashboard</span>
                  </div>
                  <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">
                    Today&apos;s overview
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Orders
                  </Link>
                  <Link
                    href="/reports"
                    className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> View report
                  </Link>
                </div>
              </section>

              {/* ── Today's sales hero card ────────────────────────────── */}
              <Card className="relative overflow-hidden">
                {/* Yellow wash — one luminous panel per screen, desktop only */}
                <div
                  className="absolute right-0 top-0 h-full w-1/2 hidden md:block pointer-events-none rounded-r-[24px]"
                  style={{ background: "linear-gradient(120deg, transparent 0%, rgba(250,255,127,0.4) 100%)" }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <TrendingUp className="h-4 w-4" /> Today&apos;s sales
                    </div>
                    <Chip tone="green">
                      <ArrowUpRight className="h-3 w-3" /> Live
                    </Chip>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xs text-neutral-500 font-medium">LKR</span>
                    <span className="text-5xl font-light tracking-tight tabular-nums text-neutral-900">
                      {formatAmount(income)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {summary.completed === 0
                      ? "No completed orders yet today."
                      : `${summary.completed} completed order${summary.completed === 1 ? "" : "s"} so far today.`}
                  </p>
                  <Link
                    href="/orders"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:opacity-70 transition-opacity"
                  >
                    See all orders <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              {/* ── Order status pills ──────────────────────────────────── */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { label: "Total orders",  value: summary.total,     sub: "Today",    icon: ShoppingBag,   bg: "#f5f5f5",                       iconBg: "#000",                  iconColor: "#fff", text: "text-neutral-800", href: "/orders"              },
                  { label: "Completed",     value: summary.completed, sub: "Paid",     icon: CheckCircle2,  bg: "rgba(12,151,98,0.10)",          iconBg: "var(--accent-green)",   iconColor: "#fff", text: "text-[var(--accent-green)]", href: "/orders?status=completed" },
                  { label: "Pending",       value: summary.pending,   sub: "Open",     icon: Clock,         bg: "rgba(250,255,127,0.5)",         iconBg: "var(--accent-yellow)",  iconColor: "#000", text: "text-neutral-800", href: "/orders?status=open"      },
                  { label: "Cancelled",     value: summary.cancelled, sub: "Voided",   icon: XCircle,       bg: "rgba(239,68,68,0.08)",          iconBg: "#ef4444",               iconColor: "#fff", text: "text-red-600",     href: "/orders?status=cancelled" },
                ] as const).map((stat) => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-[20px] p-4 block hover:scale-[1.02] transition-transform duration-150"
                    style={{ background: stat.bg }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: stat.iconBg, color: stat.iconColor }}
                      >
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{stat.sub}</span>
                    </div>
                    <div className={`mt-4 text-3xl font-light ${stat.text}`}>{stat.value}</div>
                    <div className="mt-1 text-xs text-neutral-600 font-medium">{stat.label}</div>
                  </Link>
                ))}
              </section>

              {/* ── Finance + right column ──────────────────────────────── */}
              <section className="grid grid-cols-12 gap-4">

                {/* Net profit card */}
                <Card className="col-span-12 md:col-span-7">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-500 font-medium">Net profit today (estimated)</div>
                    <Chip tone="black">Est.</Chip>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xs text-neutral-500 font-medium">LKR</span>
                    <span className="text-4xl font-light tabular-nums text-neutral-900">{formatAmount(netProfit)}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {/* Income pill */}
                    <Link href="/finance" className="rounded-[20px] p-4 hover:opacity-90 transition-opacity" style={{ background: "rgba(12,151,98,0.08)" }}>
                      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent-green)" }}>
                        <ArrowUpRight className="h-4 w-4" /> Income
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xs text-neutral-500">LKR</span>
                        <span className="text-2xl font-light tabular-nums">{formatAmount(income)}</span>
                      </div>
                    </Link>
                    {/* Expenses pill */}
                    <Link href="/finance" className="rounded-[20px] p-4 bg-neutral-100 hover:opacity-90 transition-opacity">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600 font-medium">
                        <ArrowDownRight className="h-4 w-4" /> Expenses
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xs text-neutral-500">LKR</span>
                        <span className="text-2xl font-light tabular-nums">{formatAmount(new Decimal(expensesToday))}</span>
                      </div>
                    </Link>
                  </div>
                  <Link
                    href="/finance"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:opacity-70 transition-opacity"
                  >
                    Open Finance <ChevronRight className="h-3 w-3" />
                  </Link>
                </Card>

                {/* Right column */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-4">

                  {/* Low stock card */}
                  <Card className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                        <Boxes className="h-4 w-4 text-neutral-500" /> Low stock
                      </div>
                      <Link href="/inventory" className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">
                        View all <ChevronRight className="h-3 w-3 inline" />
                      </Link>
                    </div>
                    {lowStockCount === 0 ? (
                      <div className="flex items-center gap-3">
                        <IconBubble tone="green"><CheckCircle2 className="h-4 w-4" /></IconBubble>
                        <div>
                          <div className="text-sm font-medium text-neutral-800">All stocked up</div>
                          <div className="text-xs text-neutral-500">No items below reorder level</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <IconBubble tone="yellow"><Boxes className="h-4 w-4" /></IconBubble>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-800">
                            {lowStockCount} item{lowStockCount === 1 ? "" : "s"} low
                          </div>
                          <div className="text-xs text-neutral-500">Below reorder threshold</div>
                        </div>
                        <Link
                          href="/inventory?lowStock=1"
                          className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs text-white hover:opacity-80 transition-opacity flex-shrink-0"
                        >
                          View <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </Card>

                  {/* Bookings card */}
                  <Card className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                        <CalendarCheck className="h-4 w-4 text-neutral-500" /> Today&apos;s bookings
                      </div>
                      <Link href="/bookings" className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">
                        View all <ChevronRight className="h-3 w-3 inline" />
                      </Link>
                    </div>
                    <div className="rounded-[16px] p-3 bg-neutral-100">
                      <div className="text-sm text-neutral-700">Bookings module — coming in step 17.</div>
                      <div className="mt-1.5 text-xs text-neutral-500">Reservation tracking not yet active.</div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* ── Unresolved print failures ───────────────────────────── */}
              {failures.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Failed prints
                  </div>
                  <div className="flex flex-col gap-2">
                    {failures.map((failure) => (
                      <div
                        key={failure.id}
                        className="flex flex-col gap-2 rounded-[20px] bg-white p-4 sm:flex-row sm:items-center sm:justify-between border border-red-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-light tabular-nums text-neutral-900">{failure.orderNumber}</span>
                          <span className="text-sm text-neutral-500">
                            {PRINT_TARGET_LABELS[failure.target] ?? failure.target}
                          </span>
                        </div>
                        <PrintStatus status="failed" onReprint={() => reprintJob(failure.id)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Mobile quick-action strip ───────────────────────────── */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/orders/new"
                    className="flex items-center justify-between rounded-[20px] bg-black text-white px-4 py-3.5"
                  >
                    <div>
                      <div className="text-[10px] text-white/60 uppercase tracking-wider">Quick</div>
                      <div className="text-sm font-semibold mt-0.5">New order</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                  <Link
                    href="/inventory"
                    className="flex items-center justify-between rounded-[20px] px-4 py-3.5"
                    style={{ background: "var(--accent-yellow)" }}
                  >
                    <div>
                      <div className="text-[10px] text-black/60 uppercase tracking-wider">Check</div>
                      <div className="text-sm font-semibold mt-0.5">Inventory</div>
                    </div>
                    <Package className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Bottom breathing room */}
              <div className="h-4" />
            </main>
          </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatAmount(value: Decimal | number): string {
  const d = value instanceof Decimal ? value : new Decimal(value);
  return d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
