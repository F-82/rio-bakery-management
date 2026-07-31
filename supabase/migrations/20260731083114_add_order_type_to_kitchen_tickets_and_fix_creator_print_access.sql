-- Kitchen tickets need the order type so the chef can distinguish dine-in
-- orders from takeaway orders. Keeping this in a trigger means every path
-- that creates a kitchen print job gets the same payload contract, including
-- future reprint paths that do not call create_order directly.
create function public.add_order_source_to_kitchen_ticket()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target = 'kitchen_ticket' then
    new.payload := new.payload || jsonb_build_object(
      'source',
      (select o.source from public.orders o where o.id = new.order_id)
    );
  end if;
  return new;
end;
$$;

create trigger print_jobs_add_order_source
before insert on public.print_jobs
for each row execute function public.add_order_source_to_kitchen_ticket();

-- Bring existing kitchen jobs up to the same payload shape so a queued ticket
-- or an order opened after deployment also shows the order type.
update public.print_jobs pj
set payload = pj.payload || jsonb_build_object('source', o.source)
from public.orders o
where pj.order_id = o.id
  and pj.target = 'kitchen_ticket';

-- A staff member may deliberately select another counter while entering an
-- order. Counter scoping still hides orders created by everyone else, but the
-- creator needs same-day access to their own order, items and print jobs so
-- they can complete or retry the bill print.
alter policy orders_staff_read on public.orders
  using (
    business_id = (select public.current_business_id())
    and (select public."current_role"()) = 'staff'
    and (
      counter_id = (select public.current_counter_id())
      or created_by = (select auth.uid())
    )
    and order_day = (now() at time zone 'Asia/Colombo')::date
  );

alter policy order_items_staff_read on public.order_items
  using (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public."current_role"()) = 'staff'
      and (
        o.counter_id = (select public.current_counter_id())
        or o.created_by = (select auth.uid())
      )
      and o.order_day = (now() at time zone 'Asia/Colombo')::date
  ));

alter policy print_jobs_staff_read on public.print_jobs
  using (
    business_id = (select public.current_business_id())
    and exists (
      select 1
      from public.orders o
      where o.id = print_jobs.order_id
        and (
          o.counter_id = (select public.current_counter_id())
          or o.created_by = (select auth.uid())
        )
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );

alter policy print_jobs_staff_reprint on public.print_jobs
  with check (
    business_id = (select public.current_business_id())
    and exists (
      select 1
      from public.orders o
      where o.id = print_jobs.order_id
        and (
          o.counter_id = (select public.current_counter_id())
          or o.created_by = (select auth.uid())
        )
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );
