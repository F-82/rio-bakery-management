import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { OrdersFilters } from "@/components/orders/OrdersFilters";
import { OrdersList } from "@/components/orders/OrdersList";
import { getOrders, getOrderSources, type OrdersFilter } from "@/lib/queries/orders";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getTranslation } from "@/lib/i18n-server";

type OrdersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const { t } = await getTranslation();
  const params = await searchParams;

  const filter: OrdersFilter = {
    tab: firstValue(params.tab) === "archived" ? "archived" : "active",
    status: firstValue(params.status) === "open" || firstValue(params.status) === "completed"
      ? (firstValue(params.status) as "open" | "completed")
      : undefined,
    counterId: firstValue(params.counter),
    source: firstValue(params.source),
    paymentMethod: firstValue(params.payment),
    dateFrom: firstValue(params.from),
    dateTo: firstValue(params.to),
    search: firstValue(params.search),
  };

  const [orders, sources, counters, profile] = await Promise.all([
    getOrders(filter),
    getOrderSources(),
    getActiveCounters(),
    getCurrentProfile(),
  ]);

  const canVoid = profile?.role === "owner" || profile?.role === "manager";

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 pb-0 sm:p-6 sm:pb-0">
        <PageHeader
          title={t("Orders")}
          actions={
            <Button asChild>
              <Link href="/orders/new">{t("New order")}</Link>
            </Button>
          }
        />
      </div>
      <OrdersFilters counters={counters} sources={sources} />
      {/* Keyed by the filter so a filter change remounts with fresh state
          instead of syncing initialOrders via an effect. */}
      <OrdersList
        key={JSON.stringify(filter)}
        initialOrders={orders}
        filter={filter}
        counters={counters}
        canVoid={canVoid}
      />
    </div>
  );
}
