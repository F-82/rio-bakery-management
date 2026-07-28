-- Customers + loyalty programme. See ARCHITECTURE.md §Schema/Loyalty.
-- orders.customer_id has existed since 20260726193504_orders_rpc.sql with a
-- comment "FK to customers added in the loyalty step" — this is that step.
-- create_order's step 7 ("Loyalty: accrue points; apply redemption if staff
-- flagged it", ARCHITECTURE.md §The order RPC) was a no-op until now.

create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  name           text,
  phone_e164     text not null,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  is_priority    boolean not null default false,
  priority_note  text,
  total_spend    numeric(12, 2) not null default 0 check (total_spend >= 0),
  order_count    integer not null default 0 check (order_count >= 0),
  first_order_at timestamptz,
  last_order_at  timestamptz,
  created_at     timestamptz not null default now(),
  unique (business_id, phone_e164),
  unique (business_id, id)
);

create index customers_business_id_idx on public.customers (business_id);

-- Points ledger. No business_id column — same precedent as order_items,
-- scoped via its parent (customer) join, not a direct column (Invariant 10
-- applies to business-scoped tables; this is a child of one).
create table public.loyalty_transactions (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers (id) on delete cascade,
  order_id        uuid references public.orders (id) on delete set null,
  points_earned   integer not null default 0 check (points_earned >= 0),
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  balance_after   integer not null check (balance_after >= 0),
  created_at      timestamptz not null default now()
);

create index loyalty_transactions_customer_id_idx on public.loyalty_transactions (customer_id);
create index loyalty_transactions_order_id_idx on public.loyalty_transactions (order_id);

alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (business_id, customer_id) references public.customers (business_id, id);

-- Priority customers: manual flag OR derived top-spender over a rolling
-- 90-day window (ARCHITECTURE.md §Loyalty — "owner needs both"). Top-spender
-- cutoff is the top 10 by recent completed-order spend per business; not
-- specified in ARCHITECTURE.md, chosen as a reasonable default and logged in
-- LOG.md rather than left unbounded (an unbounded "any spend > 0" list isn't
-- a priority list).
create view public.priority_customers as
with recent as (
  select
    o.customer_id,
    sum(o.total) as recent_spend,
    count(*) as recent_order_count
  from public.orders o
  where o.status = 'completed'
    and o.customer_id is not null
    and o.created_at >= now() - interval '90 days'
  group by o.customer_id
),
ranked as (
  select
    c.id, c.business_id, c.name, c.phone_e164, c.loyalty_points,
    c.is_priority, c.priority_note, c.total_spend, c.order_count,
    c.first_order_at, c.last_order_at,
    coalesce(r.recent_spend, 0) as recent_spend,
    coalesce(r.recent_order_count, 0) as recent_order_count,
    row_number() over (
      partition by c.business_id
      order by coalesce(r.recent_spend, 0) desc, coalesce(r.recent_order_count, 0) desc
    ) as spend_rank
  from public.customers c
  left join recent r on r.customer_id = c.id
)
select
  id, business_id, name, phone_e164, loyalty_points, is_priority, priority_note,
  total_spend, order_count, first_order_at, last_order_at, recent_spend, recent_order_count,
  (recent_spend > 0 and spend_rank <= 10) as is_top_spender
from ranked
where is_priority or (recent_spend > 0 and spend_rank <= 10)
order by is_priority desc, recent_spend desc;

-- RLS -----------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.loyalty_transactions enable row level security;

-- customers: owner/manager all; staff read (loyalty lookup at POS). Staff
-- "insert" (ARCHITECTURE.md §RLS) is granted via find_or_create_customer
-- below, not a raw INSERT policy — same reasoning as step 09's create_order
-- (RPC-gated writes over broad direct grants) and step 10's
-- record_stock_movement.
create policy customers_owner_mgr_all on public.customers for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());
create policy customers_staff_read on public.customers for select to authenticated
  using (business_id = public.current_business_id());

-- loyalty_transactions: owner/manager read only. No client insert policy —
-- rows are written only inside create_order (SECURITY DEFINER, bypasses RLS),
-- same pattern as stock_movements' order_deduction rows.
create policy loyalty_transactions_read on public.loyalty_transactions for select to authenticated
  using (
    public.is_owner_or_manager()
    and exists (
      select 1 from public.customers c
      where c.id = loyalty_transactions.customer_id
        and c.business_id = public.current_business_id()
    )
  );

-- find_or_create_customer ----------------------------------------------------
-- The UI-must-not-throw trap (STEPS.md §12): phone is normalised to E.164 in
-- TS (normalisePhone) before this is ever called — this function never parses
-- a raw phone string, it only trusts and enforces the unique index. Three
-- callers with three raw formats normalise to the same phone_e164 in TS, so
-- the second and third calls hit ON CONFLICT DO NOTHING and return the
-- existing row instead of erroring.

create function public.find_or_create_customer(payload jsonb)
returns public.customers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := auth.uid();
  v_business_id uuid;
  v_phone       text;
  v_name        text;
  v_customer    public.customers%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select business_id into v_business_id from public.profiles where id = v_uid;
  if v_business_id is null then
    raise exception 'no profile for user %', v_uid;
  end if;

  v_phone := nullif(payload ->> 'phone_e164', '');
  v_name  := nullif(payload ->> 'name', '');
  if v_phone is null or v_phone !~ '^\+94[1-9]\d{8}$' then
    raise exception 'phone_e164 must already be normalised E.164 (+94XXXXXXXXX)';
  end if;

  insert into public.customers (business_id, name, phone_e164)
  values (v_business_id, v_name, v_phone)
  on conflict (business_id, phone_e164) do nothing;

  select * into v_customer from public.customers
  where business_id = v_business_id and phone_e164 = v_phone;

  return v_customer;
end;
$$;

revoke all on function public.find_or_create_customer(jsonb) from public;
grant execute on function public.find_or_create_customer(jsonb) to authenticated;

-- create_order — extended with loyalty accrual/redemption ------------------
-- Full replace (forward-only migrations can't edit 20260726193504_orders_rpc.sql
-- in place). Steps 1-5 and 7-9 are unchanged from that file; step 6 gains
-- redemption before the totals update, and a new step 6b accrues points.
-- Payload gains an optional redeem_points (integer, staff-flagged at the
-- till). Money math: redemption discount and points-earned are both computed
-- server-side from settings, never trusted from the client, same as every
-- other figure this function produces (Invariant 3).

create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid             uuid := auth.uid();
  v_business_id     uuid;
  v_counter_id      uuid;
  v_customer_id     uuid;
  v_source          text;
  v_status          public.order_status;
  v_payment         text;
  v_discount        numeric(12, 2);
  v_discount_reason text;
  v_items           jsonb;
  v_n               integer;
  v_matched         integer;
  v_day             date;
  v_seq             integer;
  v_order_number    text;
  v_order_id        uuid;
  v_subtotal        numeric(12, 2);
  v_total           numeric(12, 2);
  v_allow_negative  boolean;
  v_has_prep        boolean;
  v_warnings        jsonb;
  v_customer        public.customers%rowtype;
  v_earn_rate       numeric;
  v_redeem_rate     numeric;
  v_redeem_requested integer;
  v_redeem_points   integer;
  v_redemption_discount numeric(12, 2);
  v_points_earned   integer;
  v_loyalty_balance integer;
  v_loyalty         jsonb;
begin
  -- 1. Resolve caller -> business, default counter
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select business_id, counter_id into v_business_id, v_counter_id
  from public.profiles where id = v_uid;
  if v_business_id is null then
    raise exception 'no profile for user %', v_uid;
  end if;

  v_counter_id  := coalesce(nullif(payload ->> 'counter_id', '')::uuid, v_counter_id);
  v_customer_id := nullif(payload ->> 'customer_id', '')::uuid;
  v_source      := coalesce(nullif(payload ->> 'source', ''), 'pos');
  v_status      := coalesce(nullif(payload ->> 'status', '')::public.order_status, 'completed');
  v_payment     := nullif(payload ->> 'payment_method', '');
  v_discount    := coalesce(nullif(payload ->> 'discount_amount', '')::numeric, 0);
  v_discount_reason := nullif(payload ->> 'discount_reason', '');
  v_redeem_requested := coalesce(nullif(payload ->> 'redeem_points', '')::integer, 0);
  v_items       := payload -> 'items';

  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'order has no items';
  end if;
  if v_counter_id is not null
     and not exists (select 1 from public.counters
                     where id = v_counter_id and business_id = v_business_id) then
    raise exception 'counter % not in business', v_counter_id;
  end if;
  if v_redeem_requested < 0 then
    raise exception 'redeem_points cannot be negative';
  end if;

  -- 2. Validate lines and that prices resolve server-side
  select count(*) into v_n
  from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text);
  if exists (
    select 1 from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
    where li.menu_item_id is null or li.qty is null or li.qty <= 0
  ) then
    raise exception 'each item needs a menu_item_id and qty > 0';
  end if;
  select count(*) into v_matched
  from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
  join public.menu_items mi
    on mi.id = li.menu_item_id and mi.business_id = v_business_id and mi.available;
  if v_matched <> v_n then
    raise exception 'one or more menu items are unknown or unavailable';
  end if;

  -- 2b. Customer, if given, must belong to this business. Locked here (not
  -- with the inventory rows) — different table, no shared lock-ordering
  -- concern with the FOR UPDATE ORDER BY below.
  if v_customer_id is not null then
    select * into v_customer from public.customers
    where id = v_customer_id and business_id = v_business_id
    for update;
    if not found then
      raise exception 'customer % not in business', v_customer_id;
    end if;
  end if;

  -- 3. Lock affected inventory rows in a consistent order to avoid deadlock.
  --    LockRows sits above the Sort, so rows lock in inventory_item_id order.
  perform i.id
  from public.inventory_items i
  where i.id in (
    select r.inventory_item_id
    from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
    join public.recipe_items r
      on r.menu_item_id = li.menu_item_id and r.business_id = v_business_id
  )
  order by i.id
  for update;

  -- 4. Allocate the daily sequence atomically (no select-then-insert).
  v_day := (now() at time zone 'Asia/Colombo')::date;
  insert into public.daily_counters (business_id, day, last_seq)
  values (v_business_id, v_day, 1)
  on conflict (business_id, day)
    do update set last_seq = public.daily_counters.last_seq + 1
  returning last_seq into v_seq;
  v_order_number := lpad(v_seq::text, 3, '0');

  -- 5. Insert the order, then the lines with snapshots.
  insert into public.orders (
    business_id, daily_seq, order_number, order_day, counter_id, created_by,
    customer_id, source, status, discount_reason, payment_method, completed_at
  ) values (
    v_business_id, v_seq, v_order_number, v_day, v_counter_id, v_uid,
    v_customer_id, v_source, v_status, v_discount_reason, v_payment,
    case when v_status = 'completed' then now() end
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, menu_item_id, name_snapshot, qty, unit_price, line_total,
    requires_kitchen_prep, tax_category, notes
  )
  select v_order_id, mi.id, mi.name, li.qty, mi.price, round(mi.price * li.qty, 2),
         mi.requires_kitchen_prep, mi.tax_category, li.notes
  from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
  join public.menu_items mi
    on mi.id = li.menu_item_id and mi.business_id = v_business_id;

  -- 6. Totals: server-side. Manual discount clamps to subtotal first, then
  --    redemption (if any) fills whatever room is left — a customer can't
  --    redeem past 100% off, same clamp reasoning as the plain discount had.
  select coalesce(sum(line_total), 0) into v_subtotal
  from public.order_items where order_id = v_order_id;
  v_discount := least(greatest(v_discount, 0), v_subtotal);

  v_redeem_points := 0;
  v_redemption_discount := 0;
  if v_customer_id is not null and v_redeem_requested > 0 then
    select coalesce((value #>> '{}')::numeric, 0.01) into v_redeem_rate
    from public.settings where business_id = v_business_id and key = 'loyalty.redeem_lkr_per_point';
    v_redeem_rate := coalesce(v_redeem_rate, 0.01);

    -- Clamp to: what the customer actually has, and whatever discount room
    -- is left after the manual discount, so combined discount never exceeds
    -- the subtotal (a 100%+ "discount" isn't a real order).
    v_redeem_points := least(
      v_redeem_requested,
      v_customer.loyalty_points,
      floor((v_subtotal - v_discount) / nullif(v_redeem_rate, 0))::integer
    );
    v_redeem_points := greatest(v_redeem_points, 0);
    v_redemption_discount := round(v_redeem_points * v_redeem_rate, 2);
    v_discount := v_discount + v_redemption_discount;
  end if;

  v_total := v_subtotal - v_discount;
  update public.orders
  set subtotal = v_subtotal, discount_amount = v_discount, total = v_total
  where id = v_order_id;

  -- 6b. Loyalty: accrue on the amount actually paid, apply the redemption
  --     computed above, ledger + denormalised customer stats in one update.
  if v_customer_id is not null then
    select coalesce((value #>> '{}')::numeric, 1) into v_earn_rate
    from public.settings where business_id = v_business_id and key = 'loyalty.earn_points_per_lkr';
    v_earn_rate := coalesce(v_earn_rate, 1);
    v_points_earned := floor(v_total * v_earn_rate)::integer;

    update public.customers
    set loyalty_points = loyalty_points - v_redeem_points + v_points_earned,
        total_spend    = total_spend + v_total,
        order_count    = order_count + 1,
        first_order_at = coalesce(first_order_at, now()),
        last_order_at  = now()
    where id = v_customer_id
    returning loyalty_points into v_loyalty_balance;

    insert into public.loyalty_transactions
      (customer_id, order_id, points_earned, points_redeemed, balance_after)
    values (v_customer_id, v_order_id, v_points_earned, v_redeem_points, v_loyalty_balance);

    v_loyalty := jsonb_build_object(
      'points_earned', v_points_earned,
      'points_redeemed', v_redeem_points,
      'redemption_discount', v_redemption_discount,
      'balance', v_loyalty_balance
    );
  end if;

  -- 7. Expand recipes -> stock ledger + qty_on_hand, in one statement.
  select coalesce((nullif(value, 'false'::jsonb) is not null), true) into v_allow_negative
  from public.settings
  where business_id = v_business_id and key = 'inventory.allow_negative_stock';
  v_allow_negative := coalesce(v_allow_negative, true);

  if not v_allow_negative then
    if exists (
      select 1
      from (
        select r.inventory_item_id as iid, sum(r.qty * li.qty) as need
        from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
        join public.recipe_items r
          on r.menu_item_id = li.menu_item_id and r.business_id = v_business_id
        group by r.inventory_item_id
      ) a
      join public.inventory_items i on i.id = a.iid
      where i.qty_on_hand - a.need < 0
    ) then
      raise exception 'insufficient stock (negative stock disabled for this business)';
    end if;
  end if;

  with agg as (
    select r.inventory_item_id as iid, sum(r.qty * li.qty) as need
    from jsonb_to_recordset(v_items) as li(menu_item_id uuid, qty numeric, notes text)
    join public.recipe_items r
      on r.menu_item_id = li.menu_item_id and r.business_id = v_business_id
    group by r.inventory_item_id
  ),
  mv as (
    insert into public.stock_movements
      (business_id, inventory_item_id, delta, reason, ref_order_id, ref_user_id)
    select v_business_id, iid, -need, 'order_deduction', v_order_id, v_uid
    from agg
    returning inventory_item_id, delta
  ),
  upd as (
    update public.inventory_items i
    set qty_on_hand = i.qty_on_hand + mv.delta
    from mv
    where i.id = mv.inventory_item_id
    returning i.id, i.name, i.qty_on_hand, i.low_stock_threshold
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'inventory_item_id', id, 'name', name,
        'qty_on_hand', qty_on_hand, 'low_stock_threshold', low_stock_threshold,
        'negative', qty_on_hand < 0
      )
    ) filter (where qty_on_hand <= low_stock_threshold),
    '[]'::jsonb
  ) into v_warnings
  from upd;

  -- 8. Print jobs: customer receipt always; kitchen ticket only if a line needs
  --    prep, carrying only prep lines and no prices.
  insert into public.print_jobs (business_id, order_id, target, payload)
  select v_business_id, v_order_id, 'customer_receipt',
    jsonb_build_object(
      'order_number', v_order_number,
      'counter_id', v_counter_id,
      'created_at', now(),
      'subtotal', v_subtotal,
      'discount_amount', v_discount,
      'total', v_total,
      'payment_method', v_payment,
      'items', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'name', name_snapshot, 'qty', qty, 'unit_price', unit_price,
          'line_total', line_total, 'notes', notes
        ) order by name_snapshot), '[]'::jsonb)
        from public.order_items where order_id = v_order_id
      )
    );

  v_has_prep := exists (
    select 1 from public.order_items where order_id = v_order_id and requires_kitchen_prep
  );
  if v_has_prep then
    insert into public.print_jobs (business_id, order_id, target, payload)
    select v_business_id, v_order_id, 'kitchen_ticket',
      jsonb_build_object(
        'order_number', v_order_number,
        'counter_id', v_counter_id,
        'created_at', now(),
        'items', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'name', name_snapshot, 'qty', qty, 'notes', notes
          ) order by name_snapshot), '[]'::jsonb)
          from public.order_items
          where order_id = v_order_id and requires_kitchen_prep
        )
      );
  end if;

  -- 9. Result
  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'daily_seq', v_seq,
    'subtotal', v_subtotal,
    'discount_amount', v_discount,
    'total', v_total,
    'kitchen_ticket', v_has_prep,
    'low_stock_warnings', v_warnings,
    'loyalty', v_loyalty
  );
end;
$$;
