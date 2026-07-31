import { getOrders, getOrderSources, type OrdersFilter } from "@/lib/queries/orders";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfileContext } from "@/lib/queries/profile";
import { OrdersShell } from "@/components/orders/OrdersShell";

type OrdersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const filter: OrdersFilter = {
    tab: firstValue(params.tab) === "archived" ? "archived" : "active",
    status:
      firstValue(params.status) === "open" || firstValue(params.status) === "completed"
        ? (firstValue(params.status) as "open" | "completed")
        : undefined,
    counterId: firstValue(params.counter),
    source: firstValue(params.source),
    paymentMethod: firstValue(params.payment),
    dateFrom: firstValue(params.from),
    dateTo: firstValue(params.to),
    search: firstValue(params.search),
  };

  const [orders, sources, counters, context] = await Promise.all([
    getOrders(filter),
    getOrderSources(),
    getActiveCounters(),
    getCurrentProfileContext(),
  ]);

  const canVoid = context?.profile.role === "owner" || context?.profile.role === "manager";

  return (
    <OrdersShell
      initialOrders={orders}
      filter={filter}
      counters={counters}
      sources={sources}
      canVoid={canVoid}
      counterId={context?.profile.counter_id ?? null}
    />
  );
}
