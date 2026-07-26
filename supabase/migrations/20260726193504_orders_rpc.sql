-- Orders, stock ledger, print queue + the order RPC.
-- See ARCHITECTURE.md §Schema/Orders, §Stock ledger, §Printing, §The order RPC.
-- This is the core of the system. RLS is added in a later step (§RLS).

-- Enums --------------------------------------------------------------------

create type public.order_status as enum ('open', 'completed', 'voided');
create type public.stock_reason as enum (
  'order_deduction', 'order_void', 'purchase', 'wastage', 'manual_adjustment', 'stocktake'
);
create type public.print_target as enum ('customer_receipt', 'kitchen_ticket');
create type public.print_status as enum ('queued', 'printing', 'done', 'failed');

-- Daily order-number counter (resets at Colombo midnight) -------------------

create table public.daily_counters (
  business_id uuid not null references public.businesses (id) on delete cascade,
  day         date not null,
  last_seq    integer not null default 0,
  primary key (business_id, day)
);

-- Orders -------------------------------------------------------------------

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  daily_seq       integer not null,
  order_number    text not null,
  -- order_day mirrors the Colombo day used to allocate daily_seq; it exists so
  -- (business_id, order_day, daily_seq) can be unique (a STABLE tz expression
  -- can't be a generated column).
  order_day       date not null,
  counter_id      uuid,
  created_by      uuid references auth.users (id),
  customer_id     uuid, -- FK to customers added in the loyalty step
  source          text not null default 'pos',
  status          public.order_status not null default 'completed',
  subtotal        numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  discount_reason text,
  tax_amount      numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null default 0 check (total >= 0),
  payment_method  text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  voided_at       timestamptz,
  void_reason     text,
  foreign key (business_id, counter_id) references public.counters (business_id, id),
  unique (business_id, order_day, daily_seq)
);

create index orders_business_id_idx on public.orders (business_id);
create index orders_counter_id_idx on public.orders (counter_id);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_created_at_idx on public.orders (created_at);

-- Order line items. Prices/flags are SNAPSHOTS taken at order time so renaming
-- or deleting a menu item never alters a historical receipt or tax figure.

create table public.order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete cascade,
  menu_item_id          uuid references public.menu_items (id) on delete set null,
  name_snapshot         text not null,
  qty                   numeric(12, 3) not null check (qty > 0),
  unit_price            numeric(12, 2) not null check (unit_price >= 0),
  line_total            numeric(12, 2) not null check (line_total >= 0),
  requires_kitchen_prep boolean not null,
  tax_category          public.tax_category not null,
  notes                 text
);

create index order_items_order_id_idx on public.order_items (order_id);

-- Stock ledger. Append-only; qty_on_hand is a denormalised cache updated in the
-- same transaction. Enforced immutable by a trigger below.

create table public.stock_movements (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  inventory_item_id uuid not null,
  delta             numeric(12, 3) not null,
  reason            public.stock_reason not null,
  ref_order_id      uuid references public.orders (id) on delete set null,
  ref_user_id       uuid references auth.users (id),
  note              text,
  created_at        timestamptz not null default now(),
  foreign key (business_id, inventory_item_id)
    references public.inventory_items (business_id, id)
);

create index stock_movements_inventory_item_id_idx on public.stock_movements (inventory_item_id);
create index stock_movements_ref_order_id_idx on public.stock_movements (ref_order_id);

create function public.stock_movements_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'stock_movements is append-only (attempted %)', tg_op;
end;
$$;

create trigger stock_movements_no_update
before update or delete on public.stock_movements
for each row execute function public.stock_movements_append_only();

-- Print queue. Rows, not fire-and-forget, so failures surface and reprints are
-- new rows. kitchen_ticket carries no prices and only prep lines.

create table public.print_jobs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  order_id    uuid not null references public.orders (id) on delete cascade,
  target      public.print_target not null,
  payload     jsonb not null,
  status      public.print_status not null default 'queued',
  attempts    integer not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index print_jobs_order_id_idx on public.print_jobs (order_id);
create index print_jobs_status_idx on public.print_jobs (status);

-- create_order -------------------------------------------------------------
-- Single transaction. Payload shape:
--   { counter_id?, customer_id?, source?, status?, payment_method?,
--     discount_amount?, discount_reason?,
--     items: [ { menu_item_id, qty, notes? }, ... ] }
-- Any price in the payload is ignored; prices come from menu_items.price.

create function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid            uuid := auth.uid();
  v_business_id    uuid;
  v_counter_id     uuid;
  v_customer_id    uuid;
  v_source         text;
  v_status         public.order_status;
  v_payment        text;
  v_discount       numeric(12, 2);
  v_discount_reason text;
  v_items          jsonb;
  v_n              integer;
  v_matched        integer;
  v_day            date;
  v_seq            integer;
  v_order_number   text;
  v_order_id       uuid;
  v_subtotal       numeric(12, 2);
  v_total          numeric(12, 2);
  v_allow_negative boolean;
  v_has_prep       boolean;
  v_warnings       jsonb;
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
  v_items       := payload -> 'items';

  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'order has no items';
  end if;
  if v_counter_id is not null
     and not exists (select 1 from public.counters
                     where id = v_counter_id and business_id = v_business_id) then
    raise exception 'counter % not in business', v_counter_id;
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

  -- 6. Totals: server-side, discount clamped to subtotal, tax kept at 0 until a
  --    VAT rate exists (report splits revenue by tax_category, see Invariant 7).
  select coalesce(sum(line_total), 0) into v_subtotal
  from public.order_items where order_id = v_order_id;
  v_discount := least(greatest(v_discount, 0), v_subtotal);
  v_total := v_subtotal - v_discount;
  update public.orders
  set subtotal = v_subtotal, discount_amount = v_discount, total = v_total
  where id = v_order_id;

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
    'low_stock_warnings', v_warnings
  );
end;
$$;

-- void_order ---------------------------------------------------------------
-- Never hard-deletes. Flips status and inserts reversing stock movements.

create function public.void_order(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_order    public.orders%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order % not found', p_order_id;
  end if;
  if not exists (
    select 1 from public.profiles where id = v_uid and business_id = v_order.business_id
  ) then
    raise exception 'not authorized to void this order';
  end if;
  if v_order.status = 'voided' then
    raise exception 'order % already voided', p_order_id;
  end if;

  -- Lock the affected inventory rows in id order, then reverse each deduction.
  perform i.id from public.inventory_items i
  where i.id in (
    select inventory_item_id from public.stock_movements
    where ref_order_id = p_order_id and reason = 'order_deduction'
  )
  order by i.id
  for update;

  with rev as (
    insert into public.stock_movements
      (business_id, inventory_item_id, delta, reason, ref_order_id, ref_user_id, note)
    select business_id, inventory_item_id, -delta, 'order_void', p_order_id, v_uid, p_reason
    from public.stock_movements
    where ref_order_id = p_order_id and reason = 'order_deduction'
    returning inventory_item_id, delta
  )
  update public.inventory_items i
  set qty_on_hand = i.qty_on_hand + rev.delta
  from rev
  where i.id = rev.inventory_item_id;

  update public.orders
  set status = 'voided', voided_at = now(), void_reason = p_reason
  where id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'status', 'voided');
end;
$$;

revoke all on function public.create_order(jsonb) from public;
revoke all on function public.void_order(uuid, text) from public;
grant execute on function public.create_order(jsonb) to authenticated;
grant execute on function public.void_order(uuid, text) to authenticated;
