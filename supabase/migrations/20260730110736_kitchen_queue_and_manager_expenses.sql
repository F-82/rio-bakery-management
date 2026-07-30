-- Kitchen preparation is operational state, separate from financial order
-- status. A paid order remains completed while its food moves pending -> prepared.
create type public.prep_status as enum ('not_required', 'pending', 'prepared');

alter table public.orders
  add column prep_status public.prep_status not null default 'not_required',
  add column prepared_at timestamptz,
  add column prepared_by uuid references auth.users (id);

create index orders_business_prep_day_idx
  on public.orders (business_id, prep_status, order_day desc);

update public.orders o
set prep_status = 'pending'
where exists (
  select 1
  from public.order_items oi
  where oi.order_id = o.id
    and oi.requires_kitchen_prep
);

-- create_order inserts the order before its item snapshots. Marking the parent
-- from the item trigger keeps the existing transaction and RPC contract intact.
create function public.mark_order_prep_required()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.requires_kitchen_prep then
    update public.orders
    set prep_status = 'pending', prepared_at = null, prepared_by = null
    where id = new.order_id;
  end if;
  return new;
end;
$$;

create trigger order_items_mark_prep_required
after insert on public.order_items
for each row execute function public.mark_order_prep_required();

create function public.current_counter_kind()
returns public.counter_kind
language sql
stable
security definer
set search_path = ''
as $$
  select c.kind
  from public.profiles p
  join public.counters c on c.id = p.counter_id
  where p.id = auth.uid()
$$;

revoke all on function public.current_counter_kind() from public;
grant execute on function public.current_counter_kind() to authenticated;

-- Hot-plate staff need all of today's kitchen orders, including ones entered
-- at the bakery counter. This is read-only; completion goes through the RPC.
create policy orders_hot_plate_queue_read
on public.orders
for select
to authenticated
using (
  business_id = (select public.current_business_id())
  and (select public."current_role"()) = 'staff'
  and (select public.current_counter_kind()) = 'hot_plate'
  and order_day = (now() at time zone 'Asia/Colombo')::date
  and prep_status <> 'not_required'
);

create policy order_items_hot_plate_queue_read
on public.order_items
for select
to authenticated
using (
  (select public."current_role"()) = 'staff'
  and (select public.current_counter_kind()) = 'hot_plate'
  and exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and o.order_day = (now() at time zone 'Asia/Colombo')::date
      and o.prep_status <> 'not_required'
  )
);

create function public.mark_order_prepared(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_business_id uuid;
  v_role public.user_role;
  v_counter_kind public.counter_kind;
  v_order public.orders%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.business_id, p.role, c.kind
  into v_business_id, v_role, v_counter_kind
  from public.profiles p
  left join public.counters c on c.id = p.counter_id
  where p.id = v_uid and p.active;

  if v_business_id is null
     or not (v_role in ('owner', 'manager') or v_counter_kind = 'hot_plate') then
    raise exception 'not authorized to prepare orders';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
    and business_id = v_business_id
  for update;

  if not found then
    raise exception 'order not found';
  end if;
  if v_order.prep_status = 'not_required' then
    raise exception 'order does not require preparation';
  end if;
  if v_order.status = 'voided' then
    raise exception 'voided order cannot be prepared';
  end if;

  update public.orders
  set prep_status = 'prepared',
      prepared_at = coalesce(prepared_at, now()),
      prepared_by = coalesce(prepared_by, v_uid)
  where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'prep_status', 'prepared'
  );
end;
$$;

revoke all on function public.mark_order_prepared(uuid) from public;
revoke all on function public.mark_order_prepared(uuid) from anon;
grant execute on function public.mark_order_prepared(uuid) to authenticated;

-- Managers may record real expenses, but their UI receives only revenue data
-- and the expense-entry form. RLS still scopes writes to their own business.
drop policy expenses_write on public.expenses;
create policy expenses_write
on public.expenses
for all
to authenticated
using (
  (select public.is_owner_or_manager())
  and business_id = (select public.current_business_id())
)
with check (
  (select public.is_owner_or_manager())
  and business_id = (select public.current_business_id())
);

drop policy receipts_write on storage.objects;
create policy receipts_write
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (select public.is_owner_or_manager())
  and (storage.foldername(name))[1] = (select public.current_business_id())::text
);
