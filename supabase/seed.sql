-- Seed data for rio-staging. Idempotent — safe to re-run.
-- Auth users (owner + staff) are seeded separately via the Admin API so their
-- profiles are created by the on_auth_user_created trigger. See
-- scripts/seed-auth.mjs. Fixed UUIDs below let that script reference them.

-- Business -----------------------------------------------------------------
insert into public.businesses (id, name, currency, timezone)
values ('11111111-1111-1111-1111-111111111111', 'Rio Bakers Hut', 'LKR', 'Asia/Colombo')
on conflict (id) do update
  set name = excluded.name, currency = excluded.currency, timezone = excluded.timezone;

-- Counters -----------------------------------------------------------------
insert into public.counters (id, business_id, name, kind)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Bakery',    'bakery'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Hot Plate', 'hot_plate')
on conflict (id) do update
  set name = excluded.name, kind = excluded.kind, active = true;

-- Baseline settings (see ARCHITECTURE.md §Loyalty, §Stock ledger) ----------
insert into public.settings (business_id, key, value)
values
  ('11111111-1111-1111-1111-111111111111', 'loyalty.earn_points_per_lkr',   '1'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'loyalty.redeem_lkr_per_point',  '0.01'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'inventory.allow_negative_stock', 'true'::jsonb)
on conflict (business_id, key) do update set value = excluded.value;
