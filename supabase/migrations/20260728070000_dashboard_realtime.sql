-- Realtime for the owner dashboard (STEPS.md 13): failed print jobs and
-- low-stock levels update live, same authorization model as orders_realtime
-- (20260727053426) — Postgres Changes checks each subscriber's own RLS, so
-- staff (who have no policy on print_jobs beyond their own counter/day, and
-- no dashboard tab to view this from) never receive rows they couldn't
-- already SELECT.
alter publication supabase_realtime add table public.print_jobs;
alter publication supabase_realtime add table public.inventory_items;
