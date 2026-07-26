-- Row level security. See ARCHITECTURE.md §RLS. RLS is the access boundary;
-- hiding a tab in React is not access control (Invariant 8).
--
-- All helpers are SECURITY DEFINER so they read profiles without tripping the
-- profiles policies (no recursion). The order RPC and print agent run as the
-- table owner / service_role, which bypass RLS, so staff never need direct
-- write grants for order creation or ledger writes.

-- expenses (schema per §Money) — created here so its RLS can be enforced now.
create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  date              date not null default (now() at time zone 'Asia/Colombo')::date,
  category          text not null,
  amount            numeric(12, 2) not null check (amount >= 0),
  note              text,
  is_tax_deductible boolean not null default false,
  receipt_url       text,
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now()
);
create index expenses_business_id_idx on public.expenses (business_id);
create index expenses_date_idx on public.expenses (date);

-- settings.is_public: which keys a staff member may read (loyalty rates, etc.)
alter table public.settings add column is_public boolean not null default false;

-- Helper functions ---------------------------------------------------------

create function public.current_business_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create function public.current_counter_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select counter_id from public.profiles where id = auth.uid()
$$;

create function public."current_role"()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_owner_or_manager()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('owner', 'manager') from public.profiles where id = auth.uid()), false)
$$;

-- Enable RLS on every table ------------------------------------------------

alter table public.businesses      enable row level security;
alter table public.counters        enable row level security;
alter table public.profiles        enable row level security;
alter table public.settings        enable row level security;
alter table public.categories      enable row level security;
alter table public.menu_items      enable row level security;
alter table public.inventory_items enable row level security;
alter table public.recipe_items    enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.daily_counters  enable row level security;
alter table public.stock_movements enable row level security;
alter table public.print_jobs      enable row level security;
alter table public.expenses        enable row level security;

-- businesses: members read; owner writes ----------------------------------
create policy businesses_read on public.businesses for select to authenticated
  using (id = public.current_business_id());
create policy businesses_write on public.businesses for all to authenticated
  using (public.is_owner() and id = public.current_business_id())
  with check (public.is_owner() and id = public.current_business_id());

-- counters: members read; owner/manager write -----------------------------
create policy counters_read on public.counters for select to authenticated
  using (business_id = public.current_business_id());
create policy counters_write on public.counters for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());

-- profiles: owner all; manager read; staff read self; owner writes ---------
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (public.is_owner_or_manager() and business_id = public.current_business_id())
  );
create policy profiles_write on public.profiles for all to authenticated
  using (public.is_owner() and business_id = public.current_business_id())
  with check (public.is_owner() and business_id = public.current_business_id());

-- settings: owner/manager read all; staff read public keys; owner writes ---
create policy settings_read on public.settings for select to authenticated
  using (business_id = public.current_business_id()
         and (public.is_owner_or_manager() or is_public));
create policy settings_write on public.settings for all to authenticated
  using (public.is_owner() and business_id = public.current_business_id())
  with check (public.is_owner() and business_id = public.current_business_id());

-- categories: members read; owner/manager write ---------------------------
create policy categories_read on public.categories for select to authenticated
  using (business_id = public.current_business_id());
create policy categories_write on public.categories for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());

-- menu_items: members read (needed to sell); owner/manager write -----------
create policy menu_items_read on public.menu_items for select to authenticated
  using (business_id = public.current_business_id());
create policy menu_items_write on public.menu_items for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());

-- inventory_items: members read (needs stock to sell); owner/manager write -
create policy inventory_items_read on public.inventory_items for select to authenticated
  using (business_id = public.current_business_id());
create policy inventory_items_write on public.inventory_items for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());

-- recipe_items: owner/manager only -----------------------------------------
create policy recipe_items_all on public.recipe_items for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());

-- orders: owner/manager all; staff read own counter, today -----------------
create policy orders_owner_mgr_all on public.orders for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());
create policy orders_staff_read on public.orders for select to authenticated
  using (
    business_id = public.current_business_id()
    and public."current_role"() = 'staff'
    and counter_id = public.current_counter_id()
    and order_day = (now() at time zone 'Asia/Colombo')::date
  );

-- order_items: visible via the parent order --------------------------------
create policy order_items_owner_mgr_all on public.order_items for all to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = public.current_business_id()
      and public.is_owner_or_manager()
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = public.current_business_id()
      and public.is_owner_or_manager()
  ));
create policy order_items_staff_read on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.business_id = public.current_business_id()
      and public."current_role"() = 'staff'
      and o.counter_id = public.current_counter_id()
      and o.order_day = (now() at time zone 'Asia/Colombo')::date
  ));

-- daily_counters: owner/manager read only (writes are via the RPC) ---------
create policy daily_counters_read on public.daily_counters for select to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id());

-- stock_movements: owner/manager read; inserts only via the RPC ------------
create policy stock_movements_read on public.stock_movements for select to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id());

-- print_jobs: owner/manager all; staff read + reprint their visible orders --
create policy print_jobs_owner_mgr_all on public.print_jobs for all to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id())
  with check (public.is_owner_or_manager() and business_id = public.current_business_id());
create policy print_jobs_staff_read on public.print_jobs for select to authenticated
  using (
    business_id = public.current_business_id()
    and exists (
      select 1 from public.orders o
      where o.id = print_jobs.order_id
        and o.counter_id = public.current_counter_id()
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );
create policy print_jobs_staff_reprint on public.print_jobs for insert to authenticated
  with check (
    business_id = public.current_business_id()
    and exists (
      select 1 from public.orders o
      where o.id = print_jobs.order_id
        and o.counter_id = public.current_counter_id()
        and o.order_day = (now() at time zone 'Asia/Colombo')::date
    )
  );

-- expenses: owner all; manager read; staff none ----------------------------
create policy expenses_read on public.expenses for select to authenticated
  using (public.is_owner_or_manager() and business_id = public.current_business_id());
create policy expenses_write on public.expenses for all to authenticated
  using (public.is_owner() and business_id = public.current_business_id())
  with check (public.is_owner() and business_id = public.current_business_id());
