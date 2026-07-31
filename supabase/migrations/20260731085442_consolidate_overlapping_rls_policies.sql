-- FOR ALL write policies also participate in SELECT, so they overlap the
-- dedicated read policies and force PostgreSQL to evaluate multiple
-- permissive expressions for every row. Split writes by command and combine
-- role-specific reads while preserving the same predicates.

-- Simple business-scoped tables -------------------------------------------

drop policy bookings_write on public.bookings;
create policy bookings_insert on public.bookings for insert to authenticated
  with check (business_id = (select public.current_business_id()));
create policy bookings_update on public.bookings for update to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));
create policy bookings_delete on public.bookings for delete to authenticated
  using (business_id = (select public.current_business_id()));

drop policy businesses_write on public.businesses;
create policy businesses_insert on public.businesses for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  );
create policy businesses_update on public.businesses for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  );
create policy businesses_delete on public.businesses for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  );

drop policy categories_write on public.categories;
create policy categories_insert on public.categories for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy categories_update on public.categories for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy categories_delete on public.categories for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy counters_write on public.counters;
create policy counters_insert on public.counters for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy counters_update on public.counters for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy counters_delete on public.counters for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy expenses_write on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy expenses_update on public.expenses for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy expenses_delete on public.expenses for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy inventory_items_write on public.inventory_items;
create policy inventory_items_insert on public.inventory_items for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy inventory_items_update on public.inventory_items for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy inventory_items_delete on public.inventory_items for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy menu_items_write on public.menu_items;
create policy menu_items_insert on public.menu_items for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy menu_items_update on public.menu_items for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy menu_items_delete on public.menu_items for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy profiles_write on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy profiles_update on public.profiles for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy profiles_delete on public.profiles for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy settings_write on public.settings;
create policy settings_insert on public.settings for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy settings_update on public.settings for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy settings_delete on public.settings for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

-- Customers ---------------------------------------------------------------

drop policy customers_owner_mgr_all on public.customers;
create policy customers_insert on public.customers for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy customers_update on public.customers for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy customers_delete on public.customers for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

-- Orders and order items ---------------------------------------------------

drop policy orders_owner_mgr_all on public.orders;
drop policy orders_staff_read on public.orders;
drop policy orders_hot_plate_queue_read on public.orders;

create policy orders_read on public.orders for select to authenticated
  using (
    business_id = (select public.current_business_id())
    and (
      (select public.is_owner_or_manager())
      or (
        (select public."current_role"()) = 'staff'
        and order_day = (now() at time zone 'Asia/Colombo')::date
        and (
          counter_id = (select public.current_counter_id())
          or created_by = (select auth.uid())
          or (
            (select public.current_counter_kind()) = 'hot_plate'
            and prep_status <> 'not_required'
          )
        )
      )
    )
  );
create policy orders_insert on public.orders for insert to authenticated
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy orders_update on public.orders for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy orders_delete on public.orders for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

drop policy order_items_owner_mgr_all on public.order_items;
drop policy order_items_staff_read on public.order_items;
drop policy order_items_hot_plate_queue_read on public.order_items;

create policy order_items_read on public.order_items for select to authenticated
  using (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (
        (select public.is_owner_or_manager())
        or (
          (select public."current_role"()) = 'staff'
          and o.order_day = (now() at time zone 'Asia/Colombo')::date
          and (
            o.counter_id = (select public.current_counter_id())
            or o.created_by = (select auth.uid())
            or (
              (select public.current_counter_kind()) = 'hot_plate'
              and o.prep_status <> 'not_required'
            )
          )
        )
      )
  ));
create policy order_items_insert on public.order_items for insert to authenticated
  with check (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ));
create policy order_items_update on public.order_items for update to authenticated
  using (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ))
  with check (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ));
create policy order_items_delete on public.order_items for delete to authenticated
  using (exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.business_id = (select public.current_business_id())
      and (select public.is_owner_or_manager())
  ));

-- Print jobs ---------------------------------------------------------------

drop policy print_jobs_owner_mgr_all on public.print_jobs;
drop policy print_jobs_staff_read on public.print_jobs;
drop policy print_jobs_staff_reprint on public.print_jobs;

create policy print_jobs_read on public.print_jobs for select to authenticated
  using (
    business_id = (select public.current_business_id())
    and (
      (select public.is_owner_or_manager())
      or exists (
        select 1
        from public.orders o
        where o.id = print_jobs.order_id
          and (
            o.counter_id = (select public.current_counter_id())
            or o.created_by = (select auth.uid())
          )
          and o.order_day = (now() at time zone 'Asia/Colombo')::date
      )
    )
  );
create policy print_jobs_insert on public.print_jobs for insert to authenticated
  with check (
    business_id = (select public.current_business_id())
    and (
      (select public.is_owner_or_manager())
      or exists (
        select 1
        from public.orders o
        where o.id = print_jobs.order_id
          and (
            o.counter_id = (select public.current_counter_id())
            or o.created_by = (select auth.uid())
          )
          and o.order_day = (now() at time zone 'Asia/Colombo')::date
      )
    )
  );
create policy print_jobs_update on public.print_jobs for update to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
create policy print_jobs_delete on public.print_jobs for delete to authenticated
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
