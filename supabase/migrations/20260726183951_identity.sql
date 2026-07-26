-- Identity schema: businesses, counters, profiles, settings.
-- See ARCHITECTURE.md §Schema/Identity. RLS is added in a later step (§RLS).

-- Enums --------------------------------------------------------------------

create type public.user_role as enum ('owner', 'manager', 'staff');
create type public.counter_kind as enum ('bakery', 'hot_plate');

-- Tables -------------------------------------------------------------------

create table public.businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  currency   text        not null default 'LKR',
  timezone   text        not null default 'Asia/Colombo',
  logo_url   text,
  created_at timestamptz not null default now()
);

create table public.counters (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid          not null references public.businesses (id) on delete cascade,
  name        text          not null,
  kind        public.counter_kind not null,
  active      boolean       not null default true,
  created_at  timestamptz   not null default now(),
  -- target for the composite FK from profiles (keeps a counter in its business)
  unique (business_id, id)
);

create index counters_business_id_idx on public.counters (business_id);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  business_id   uuid        not null references public.businesses (id) on delete cascade,
  name          text,
  role          public.user_role not null default 'staff',
  -- counter_id is a DEFAULT for order attribution, never an access restriction.
  counter_id    uuid,
  language_pref text        not null default 'en',
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  -- a profile's default counter must belong to the profile's business
  foreign key (business_id, counter_id)
    references public.counters (business_id, id) on delete set null
);

create index profiles_business_id_idx on public.profiles (business_id);
create index profiles_counter_id_idx on public.profiles (counter_id);

create table public.settings (
  business_id uuid  not null references public.businesses (id) on delete cascade,
  key         text  not null,
  value       jsonb not null,
  primary key (business_id, key)
);

-- Auth trigger -------------------------------------------------------------
-- Creates a profile row when a new auth user is inserted. Reads business,
-- role, default counter and name from the user's metadata; falls back to the
-- single business and least-privilege 'staff' when metadata is absent.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_role        public.user_role;
  v_counter_id  uuid;
begin
  v_business_id := coalesce(
    nullif(new.raw_user_meta_data ->> 'business_id', '')::uuid,
    (select id from public.businesses order by created_at limit 1)
  );
  v_role := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
    'staff'
  );
  v_counter_id := nullif(new.raw_user_meta_data ->> 'counter_id', '')::uuid;

  insert into public.profiles (id, business_id, name, role, counter_id, language_pref)
  values (
    new.id,
    v_business_id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    v_role,
    v_counter_id,
    coalesce(nullif(new.raw_user_meta_data ->> 'language_pref', ''), 'en')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
