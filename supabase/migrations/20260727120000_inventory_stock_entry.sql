-- Manual stock entry RPC for step 10 (Inventory). See ARCHITECTURE.md
-- Invariant 5: stock_movements is append-only, qty_on_hand is a denormalised
-- cache updated in the same transaction. stock_movements has no INSERT policy
-- for authenticated users (20260726200104_rls.sql) — this SECURITY DEFINER
-- function is the only path for a manual_adjustment/wastage/purchase/stocktake
-- row, same pattern as create_order for order_deduction/order_void.
--
-- Sign convention decided at the entry form, not by the caller passing a
-- signed delta for every reason: purchase/wastage take a positive magnitude
-- and this function applies the sign, so the UI never has to remember which
-- direction a reason moves stock. Stocktake takes the counted quantity and
-- computes the delta itself under the same row lock used to read
-- qty_on_hand, so a concurrent movement on the same item can't produce a
-- delta based on stale data.

create function public.record_stock_movement(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_business_id uuid;
  v_item_id   uuid;
  v_reason    public.stock_reason;
  v_note      text;
  v_delta     numeric(12, 3);
  v_qty       numeric(12, 3);
  v_counted   numeric(12, 3);
  v_after     numeric(12, 3);
  v_item      public.inventory_items%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select business_id into v_business_id from public.profiles where id = v_uid;
  if v_business_id is null then
    raise exception 'no profile for user %', v_uid;
  end if;
  if not exists (
    select 1 from public.profiles
    where id = v_uid and role in ('owner', 'manager')
  ) then
    raise exception 'not authorized to record a stock movement';
  end if;

  v_item_id := nullif(payload ->> 'inventory_item_id', '')::uuid;
  v_reason  := nullif(payload ->> 'reason', '')::public.stock_reason;
  v_note    := nullif(payload ->> 'note', '');

  if v_item_id is null then
    raise exception 'inventory_item_id is required';
  end if;
  if v_reason not in ('manual_adjustment', 'wastage', 'purchase', 'stocktake') then
    raise exception 'reason must be manual_adjustment, wastage, purchase or stocktake';
  end if;

  -- Lock the row before computing/applying any delta so a concurrent
  -- movement on the same item can't race the read of qty_on_hand.
  select * into v_item from public.inventory_items
  where id = v_item_id and business_id = v_business_id
  for update;
  if not found then
    raise exception 'inventory item % not in business', v_item_id;
  end if;

  if v_reason = 'stocktake' then
    v_counted := nullif(payload ->> 'counted_qty', '')::numeric;
    if v_counted is null then
      raise exception 'counted_qty is required for a stocktake';
    end if;
    v_delta := v_counted - v_item.qty_on_hand;
  elsif v_reason = 'manual_adjustment' then
    v_delta := nullif(payload ->> 'delta', '')::numeric;
    if v_delta is null or v_delta = 0 then
      raise exception 'delta must be a non-zero number for a manual adjustment';
    end if;
  else
    -- purchase / wastage: a positive magnitude, sign applied here.
    v_qty := nullif(payload ->> 'qty', '')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'qty must be a positive number for % ', v_reason;
    end if;
    v_delta := case when v_reason = 'purchase' then v_qty else -v_qty end;
  end if;

  insert into public.stock_movements
    (business_id, inventory_item_id, delta, reason, ref_user_id, note)
  values (v_business_id, v_item_id, v_delta, v_reason, v_uid, v_note);

  update public.inventory_items
  set qty_on_hand = qty_on_hand + v_delta
  where id = v_item_id
  returning qty_on_hand into v_after;

  return jsonb_build_object(
    'inventory_item_id', v_item_id,
    'delta', v_delta,
    'qty_on_hand', v_after
  );
end;
$$;

revoke all on function public.record_stock_movement(jsonb) from public;
grant execute on function public.record_stock_movement(jsonb) to authenticated;
