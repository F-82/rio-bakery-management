-- void_order authorized any caller in the same business, not just
-- owner/manager (found while building step 09's void UI). This is a
-- SECURITY DEFINER function, so RLS doesn't apply to it — the business-only
-- check was the *entire* authorization, meaning any staff member could call
-- it directly (bypassing the UI) and void any order. Invariant 8: RLS/RPC
-- authorization is the boundary, not what the frontend chooses to show.
create or replace function public.void_order(p_order_id uuid, p_reason text)
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
    select 1 from public.profiles
    where id = v_uid
      and business_id = v_order.business_id
      and role in ('owner', 'manager')
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
