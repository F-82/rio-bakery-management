-- Bookings and Brand Assets schema

-- Enums
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.booking_source as enum ('in_person', 'phone', 'online');

-- Bookings table
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  date          date not null,
  time          time not null,
  party_size    integer not null check (party_size > 0),
  customer_id   uuid references public.customers (id) on delete set null,
  customer_name text not null,
  phone         text not null,
  status        public.booking_status not null default 'pending',
  source        public.booking_source not null default 'in_person',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index bookings_business_id_idx on public.bookings (business_id);
create index bookings_date_idx on public.bookings (date);

-- RLS for bookings
alter table public.bookings enable row level security;

create policy bookings_read on public.bookings for select to authenticated
  using (business_id = public.current_business_id());

create policy bookings_write on public.bookings for all to authenticated
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- Brand Assets storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

create policy brand_assets_read on storage.objects for select
  to public
  using (bucket_id = 'brand-assets');

create policy brand_assets_write on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brand-assets'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy brand_assets_update on storage.objects for update
  to authenticated
  using (
    bucket_id = 'brand-assets'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  )
  with check (
    bucket_id = 'brand-assets'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy brand_assets_delete on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brand-assets'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );
