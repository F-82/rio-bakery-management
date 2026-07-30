-- Performance: wrap RLS helper calls as (select fn()) so the planner evaluates
-- them once per query (InitPlan) instead of once per row. The helpers are
-- already STABLE; wrapping them in a scalar subquery is the Supabase-documented
-- optimisation and is semantically identical to the bare call. auth.uid() is
-- wrapped for the same reason. No policy's access logic changes — only the
-- evaluation form — so row visibility for every role is unchanged (verified by
-- before/after visibility snapshot). See ARCHITECTURE.md Invariant 8: RLS is the
-- access boundary; this preserves it exactly.
--
-- ALTER POLICY (in place) is used rather than drop/recreate so there is never a
-- window where a table has no policy.

-- businesses ---------------------------------------------------------------
alter policy businesses_read on public.businesses
  using (id = (select public.current_business_id()));
alter policy businesses_write on public.businesses
  using ((select public.is_owner()) and id = (select public.current_business_id()))
  with check ((select public.is_owner()) and id = (select public.current_business_id()));

-- counters -----------------------------------------------------------------
alter policy counters_read on public.counters
  using (business_id = (select public.current_business_id()));
alter policy counters_write on public.counters
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- profiles -----------------------------------------------------------------
alter policy profiles_read on public.profiles
  using (
    id = (select auth.uid())
    or ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  );
alter policy profiles_write on public.profiles
  using ((select public.is_owner()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner()) and business_id = (select public.current_business_id()));

-- settings -----------------------------------------------------------------
alter policy settings_read on public.settings
  using (business_id = (select public.current_business_id())
         and ((select public.is_owner_or_manager()) or is_public));
alter policy settings_write on public.settings
  using ((select public.is_owner()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner()) and business_id = (select public.current_business_id()));

-- categories ---------------------------------------------------------------
alter policy categories_read on public.categories
  using (business_id = (select public.current_business_id()));
alter policy categories_write on public.categories
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- menu_items ---------------------------------------------------------------
alter policy menu_items_read on public.menu_items
  using (business_id = (select public.current_business_id()));
alter policy menu_items_write on public.menu_items
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- inventory_items ----------------------------------------------------------
alter policy inventory_items_read on public.inventory_items
  using (business_id = (select public.current_business_id()));
alter policy inventory_items_write on public.inventory_items
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- recipe_items -------------------------------------------------------------
alter policy recipe_items_all on public.recipe_items
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- orders -------------------------------------------------------------------
alter policy orders_owner_mgr_all on public.orders
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));
alter policy orders_staff_read on public.orders
  using (
    business_id = (select public.current_business_id())
    and (select public."current_role"()) = 'staff'
    and counter_id = (select public.current_counter_id())
    and order_day = (now() at time zone 'Asia/Colombo')::date
  );

-- order_items --------------------------------------------------------------
alter policy order_items_owner_mgr_all on public.order_items
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ));
alter policy order_items_staff_read on public.order_items
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public."current_role"()) = 'staff'
      and o.counter_id = (select public.current_counter_id())
      and o.order_day = (now() at time zone 'Asia/Colombo')::date
  ));

-- daily_counters -----------------------------------------------------------
alter policy daily_counters_read on public.daily_counters
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- stock_movements ----------------------------------------------------------
alter policy stock_movements_read on public.stock_movements
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));

-- print_jobs ---------------------------------------------------------------
alter policy print_jobs_owner_mgr_all on public.print_jobs
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));
alter policy print_jobs_staff_read on public.print_jobs
  using (
    business_id = (select public.current_business_id())
    and exists (
      select 1 from public.orders o
      where o.id = print_jobs.order_id
        and o.counter_id = (select public.current_counter_id())
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );
alter policy print_jobs_staff_reprint on public.print_jobs
  with check (
    business_id = (select public.current_business_id())
    and exists (
      select 1 from public.orders o
      where o.id = print_jobs.order_id
        and o.counter_id = (select public.current_counter_id())
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );

-- expenses -----------------------------------------------------------------
alter policy expenses_read on public.expenses
  using ((select public.is_owner_or_manager()) and business_id = (select public.current_business_id()));
alter policy expenses_write on public.expenses
  using ((select public.is_owner()) and business_id = (select public.current_business_id()))
  with check ((select public.is_owner()) and business_id = (select public.current_business_id()));
