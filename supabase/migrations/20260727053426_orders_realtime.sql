-- Realtime for the orders list (STEPS.md 09): both tills see each other's
-- orders live. Realtime's Postgres Changes authorizes every event against
-- each subscriber's own RLS policies, so staff still only see their own
-- counter/day and owner/manager see everything — the existing orders RLS
-- (see 20260726200104_rls.sql) applies unchanged, nothing new to write here.
alter publication supabase_realtime add table public.orders;
