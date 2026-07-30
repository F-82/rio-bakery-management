-- The helper is used only while evaluating authenticated RLS policies.
-- Supabase may retain a direct anon grant in addition to PUBLIC's default.
revoke all on function public.current_counter_kind() from anon;
