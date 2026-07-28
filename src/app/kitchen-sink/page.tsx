"use client";

import { notFound } from "next/navigation";
import { TrendingUp, ShoppingBag, Wallet, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import { StatCard } from "@/components/patterns/StatCard";
import { IconChip } from "@/components/patterns/IconChip";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { PageHeader } from "@/components/patterns/PageHeader";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { LowStockBadge } from "@/components/patterns/LowStockBadge";
import { PriorityStar } from "@/components/patterns/PriorityStar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { formatLKR, formatQty } from "@/lib/format";
import { EmptyStateDemo, PrintStatusFailedDemo, TabPillsDemo } from "./demo-interactions";
import { useTranslation } from "react-i18next";

type Row = { id: string; item: string; counter: "bakery" | "hot_plate"; qty: number; total: number };

const rows: Row[] = [
  { id: "1", item: "Butter croissant", counter: "bakery", qty: 3, total: 750 },
  { id: "2", item: "Chicken kottu", counter: "hot_plate", qty: 1, total: 950 },
  { id: "3", item: "Fish bun", counter: "bakery", qty: 5, total: 625 },
];

const columns: DataTableColumn<Row>[] = [
  { key: "item", header: "Item", render: (r) => r.item },
  { key: "counter", header: "Counter", render: (r) => <CounterBadge kind={r.counter} /> },
  { key: "qty", header: "Qty", render: (r) => formatQty(r.qty), align: "right" },
  { key: "total", header: "Total", render: (r) => <MoneyText amount={r.total} />, align: "right" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-4 border-b border-line pb-12">
      <h2 className="text-h2 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
    const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-tile border border-line ${className}`} />
      <span className="text-micro text-ink-2">{name}</span>
    </div>
  );
}

/** Dev-only design system reference. Never reachable in production. */
export default function KitchenSinkPage() {
    const { t } = useTranslation();
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 p-6 sm:p-8 lg:p-12">
      <PageHeader
        title={t("Kitchen sink")}
        actions={
          <Button variant="outline" size="default">
            {t("Dev only")}</Button>
        }
      />

      <Section title={t("Type scale")}>
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-display text-ink">047</p>
            <span className="text-micro text-ink-2">{t("display — 44/48, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-h1 text-ink">{t("Today's orders")}</p>
            <span className="text-micro text-ink-2">{t("h1 — 28/34, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-h2 text-ink">{t("Inventory")}</p>
            <span className="text-micro text-ink-2">{t("h2 — 20/26, General Sans Semibold")}</span>
          </div>
          <div>
            <p className="text-h3 text-ink">{t("Low stock")}</p>
            <span className="text-micro text-ink-2">{t("h3 — 17/24, General Sans Semibold")}</span>
          </div>
          <div>
            <p className="text-body text-ink">
              {t("Kitchen printer didn't respond. The order is saved.")}</p>
            <span className="text-micro text-ink-2">{t("body — 16/24, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-body-sm text-ink">{t("Butter croissant × 3")}</p>
            <span className="text-micro text-ink-2">{t("body-sm — 14/20, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-label text-ink">{t("Order status")}</p>
            <span className="text-micro text-ink-2">{t("label — 13/18, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-micro text-ink">{t("Bakery counter")}</p>
            <span className="text-micro text-ink-2">{t("micro — 11/16 uppercase, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-num-lg text-ink">{formatLKR(12450)}</p>
            <span className="text-micro text-ink-2">{t("num-lg — 34/38 tabular, General Sans Medium")}</span>
          </div>
          <div>
            <p className="text-num text-ink">{formatLKR(950)}</p>
            <span className="text-micro text-ink-2">{t("num — 16/22 tabular, General Sans Medium")}</span>
          </div>
        </div>
      </Section>

      <Section title={t("Palette")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Swatch name="bg" className="bg-bg" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="surface-2" className="bg-surface-2" />
          <Swatch name="ink" className="bg-ink" />
          <Swatch name="ink-2" className="bg-ink-2" />
          <Swatch name="ink-3" className="bg-ink-3" />
          <Swatch name="black" className="bg-black" />
          <Swatch name="line" className="bg-line" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="accent-soft" className="bg-accent-soft" />
          <Swatch name="accent-tint" className="bg-accent-tint" />
          <Swatch name="pos" className="bg-pos" />
          <Swatch name="neg" className="bg-neg" />
          <Swatch name="warn" className="bg-warn" />
          <Swatch name="alert" className="bg-alert" />
          <Swatch name="alert-bg" className="bg-alert-bg" />
          <Swatch name="alert-strong" className="bg-alert-strong" />
          <Swatch name="neg-strong" className="bg-neg-strong" />
        </div>
        <div className="h-24 w-full rounded-card bg-accent-grad" />
      </Section>

      <Section title={t("Logo")}>
        <div className="flex items-end gap-6">
          <Logo size={24} />
          <Logo size={32} />
          <Logo size={48} />
          <Logo size={64} />
        </div>
      </Section>

      <Section title={t("IconChip")}>
        <div className="flex items-center gap-4">
          <IconChip icon={TrendingUp} />
          <IconChip icon={ShoppingBag} />
          <IconChip icon={PackageX} />
        </div>
      </Section>

      <Section title={t("TabPills")}>
        <TabPillsDemo />
      </Section>

      <Section title={t("AccentPanel")}>
        <AccentPanel className="flex flex-col gap-1">
          <span className="text-micro text-ink-2">{t("Today's sales")}</span>
          <span className="text-display text-ink">{formatLKR(84200)}</span>
        </AccentPanel>
        <span className="text-micro text-ink-2">
          {t("--accent-grad, radius 28, black text. One per screen, maximum.")}</span>
      </Section>

      <Section title={t("Buttons")}>
        <div className="flex flex-wrap items-center gap-4">
          <Button>{t("Default")}</Button>
          <Button variant="outline">{t("Outline")}</Button>
          <Button variant="secondary">{t("Secondary")}</Button>
          <Button variant="ghost">{t("Ghost")}</Button>
          <Button variant="destructive-outline">{t("Void order")}</Button>
          <Button variant="link">{t("Link")}</Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="destructive">{t("Confirm void")}</Button>
          </div>
          <span className="text-micro text-ink-2">
            {t("filled destructive — the confirming action inside a confirm step only. Every other destructive trigger uses destructive-outline (DESIGN.md §&quot;Blue and red never fight&quot;)")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="default">{t("44px default")}</Button>
          <Button size="lg">{t("56px primary action bar")}</Button>
        </div>
      </Section>

      <Section title={t("Badges")}>
        <div className="flex flex-wrap items-center gap-4">
          <Badge>{t("Default")}</Badge>
          <Badge variant="secondary">{t("Secondary")}</Badge>
          <Badge variant="warn">{t("Warn")}</Badge>
          <Badge variant="destructive">{t("Destructive")}</Badge>
          <Badge variant="outline">{t("Outline")}</Badge>
        </div>
      </Section>

      <Section title={t("StatCard")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label={t("Today's sales")}
            value={formatLKR(84200)}
            delta={{ value: "12%", direction: "up" }}
          />
          <StatCard icon={ShoppingBag} label={t("Orders")} value="47" delta={{ value: "3%", direction: "down" }} />
          <StatCard icon={Wallet} label={t("Avg. order")} value={formatLKR(1791)} />
          <StatCard icon={PackageX} label={t("Low stock items")} value="4" />
        </div>
      </Section>

      <Section title={t("MoneyText")}>
        <div className="flex items-baseline gap-6">
          <MoneyText amount={950} />
          <MoneyText amount={12450} size="num-lg" />
          <MoneyText amount={-150} />
        </div>
      </Section>

      <Section title={t("PrintStatus")}>
        <div className="flex flex-col gap-3">
          <PrintStatus status="queued" />
          <PrintStatus status="printing" />
          <PrintStatus status="done" />
          <PrintStatusFailedDemo />
        </div>
      </Section>

      <Section title={t("CounterBadge")}>
        <div className="flex gap-3">
          <CounterBadge kind="bakery" />
          <CounterBadge kind="hot_plate" />
        </div>
      </Section>

      <Section title={t("LowStockBadge")}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">{t("Plenty (10, threshold 5):")}</span>
            <LowStockBadge qty={10} threshold={5} unit="kg" />
            <span className="text-body-sm text-ink-2">{t("(nothing rendered)")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">{t("Low (3, threshold 5):")}</span>
            <LowStockBadge qty={3} threshold={5} unit="kg" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">{t("Negative (-2, threshold 5):")}</span>
            <LowStockBadge qty={-2} threshold={5} unit="kg" />
          </div>
        </div>
      </Section>

      <Section title={t("PriorityStar")}>
        <div className="flex items-center gap-4">
          <PriorityStar variant="manual" />
          <PriorityStar variant="derived" />
        </div>
      </Section>

      <Section title={t("EmptyState")}>
        <EmptyStateDemo />
      </Section>

      <Section title={t("DataTable")}>
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
      </Section>
    </div>
  );
}
