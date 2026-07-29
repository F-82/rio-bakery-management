-- Composite indexes for orders' actual hot-path queries. business_id alone
-- is already indexed (20260726193504_orders_rpc.sql); every dashboard,
-- reports, tax and finance query additionally ranges on order_day or
-- created_at, or filters on status, and those were falling back to a
-- sequential scan behind the RLS business_id predicate.
--
-- (business_id, order_day) is the busiest one - dashboard's "today",
-- reports/tax/finance's period ranges (lib/queries/{dashboard,reports,tax,finance}.ts)
-- all filter on it directly, not created_at.
create index orders_business_order_day_idx on public.orders (business_id, order_day desc);

-- Orders list default sort + created_at date-range filter (lib/queries/orders.ts).
create index orders_business_created_at_idx on public.orders (business_id, created_at desc);

-- Orders list status filter (lib/queries/orders.ts).
create index orders_business_status_idx on public.orders (business_id, status);
