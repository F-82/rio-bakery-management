import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import { StatCard } from "@/components/patterns/StatCard";
import { PageHeader } from "@/components/patterns/PageHeader";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { LowStockBadge } from "@/components/patterns/LowStockBadge";
import { PriorityStar } from "@/components/patterns/PriorityStar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { formatLKR, formatQty } from "@/lib/format";
import { EmptyStateDemo, PrintStatusFailedDemo } from "./demo-interactions";

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
  return (
    <section className="flex flex-col gap-4 border-b border-line pb-12">
      <h2 className="text-h2 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-tile border border-line ${className}`} />
      <span className="text-micro text-ink-2">{name}</span>
    </div>
  );
}

/** Dev-only design system reference. Never reachable in production. */
export default function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 p-6 sm:p-8 lg:p-12">
      <PageHeader
        title="Kitchen sink"
        actions={
          <Button variant="outline" size="default">
            Dev only
          </Button>
        }
      />

      <Section title="Type scale">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-display text-ink">047</p>
            <span className="text-micro text-ink-2">display — 44/48, Ranade Light</span>
          </div>
          <div>
            <p className="text-h1 text-ink">Today&apos;s orders</p>
            <span className="text-micro text-ink-2">h1 — 28/34, Ranade Light</span>
          </div>
          <div>
            <p className="text-h2 text-ink">Inventory</p>
            <span className="text-micro text-ink-2">h2 — 20/26, General Sans Semibold</span>
          </div>
          <div>
            <p className="text-h3 text-ink">Low stock</p>
            <span className="text-micro text-ink-2">h3 — 17/24, General Sans Semibold</span>
          </div>
          <div>
            <p className="text-body text-ink">
              Kitchen printer didn&apos;t respond. The order is saved.
            </p>
            <span className="text-micro text-ink-2">body — 16/24, Ranade Regular</span>
          </div>
          <div>
            <p className="text-body-sm text-ink">Butter croissant × 3</p>
            <span className="text-micro text-ink-2">body-sm — 14/20, Ranade Regular</span>
          </div>
          <div>
            <p className="text-label text-ink">Order status</p>
            <span className="text-micro text-ink-2">label — 13/18, General Sans Medium</span>
          </div>
          <div>
            <p className="text-micro text-ink">Bakery counter</p>
            <span className="text-micro text-ink-2">micro — 11/16 uppercase, General Sans Medium</span>
          </div>
          <div>
            <p className="text-num-lg text-ink">{formatLKR(12450)}</p>
            <span className="text-micro text-ink-2">num-lg — 34/38 tabular, Ranade Light</span>
          </div>
          <div>
            <p className="text-num text-ink">{formatLKR(950)}</p>
            <span className="text-micro text-ink-2">num — 16/22 tabular, Ranade Regular</span>
          </div>
        </div>
      </Section>

      <Section title="Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Swatch name="bg" className="bg-bg" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="surface-alt" className="bg-surface-alt" />
          <Swatch name="ink" className="bg-ink" />
          <Swatch name="ink-2" className="bg-ink-2" />
          <Swatch name="ink-3" className="bg-ink-3" />
          <Swatch name="line" className="bg-line" />
          <Swatch name="pos" className="bg-pos" />
          <Swatch name="neg" className="bg-neg" />
          <Swatch name="warn" className="bg-warn" />
          <Swatch name="alert" className="bg-alert" />
          <Swatch name="alert-bg" className="bg-alert-bg" />
        </div>
      </Section>

      <Section title="Logo">
        <div className="flex items-end gap-6">
          <Logo size={24} />
          <Logo size={32} />
          <Logo size={48} />
          <Logo size={64} />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Void order</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="default">44px default</Button>
          <Button size="lg">56px primary action bar</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="warn">Warn</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="StatCard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's sales" value={formatLKR(84200)} delta={{ value: "12%", direction: "up" }} />
          <StatCard label="Orders" value="47" delta={{ value: "3%", direction: "down" }} />
          <StatCard label="Avg. order" value={formatLKR(1791)} />
          <StatCard label="Low stock items" value="4" />
        </div>
      </Section>

      <Section title="MoneyText">
        <div className="flex items-baseline gap-6">
          <MoneyText amount={950} />
          <MoneyText amount={12450} size="num-lg" />
          <MoneyText amount={-150} />
        </div>
      </Section>

      <Section title="PrintStatus">
        <div className="flex flex-col gap-3">
          <PrintStatus status="queued" />
          <PrintStatus status="printing" />
          <PrintStatus status="done" />
          <PrintStatusFailedDemo />
        </div>
      </Section>

      <Section title="CounterBadge">
        <div className="flex gap-3">
          <CounterBadge kind="bakery" />
          <CounterBadge kind="hot_plate" />
        </div>
      </Section>

      <Section title="LowStockBadge">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">Plenty (10, threshold 5):</span>
            <LowStockBadge qty={10} threshold={5} unit="kg" />
            <span className="text-body-sm text-ink-3">(nothing rendered)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">Low (3, threshold 5):</span>
            <LowStockBadge qty={3} threshold={5} unit="kg" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-2">Negative (-2, threshold 5):</span>
            <LowStockBadge qty={-2} threshold={5} unit="kg" />
          </div>
        </div>
      </Section>

      <Section title="PriorityStar">
        <div className="flex items-center gap-4">
          <PriorityStar variant="manual" />
          <PriorityStar variant="derived" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyStateDemo />
      </Section>

      <Section title="DataTable">
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
      </Section>
    </div>
  );
}
