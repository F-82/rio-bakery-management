-- Views use the querying user's RLS policies instead of the view owner's
-- privileges. This keeps priority customer data inside the same business
-- boundary as customers and orders.
alter view public.priority_customers
  set (security_invoker = true);

-- This trigger only raises, but pin its lookup path like every other database
-- function so a caller cannot shadow referenced objects.
alter function public.stock_movements_append_only()
  set search_path = '';

-- Public bucket URLs do not need a broad storage.objects SELECT policy.
-- Authenticated managers still need scoped SELECT for Storage API operations
-- such as brand-logo upserts, while anonymous users can fetch known public
-- object URLs without being able to list the bucket.
drop policy menu_images_read on storage.objects;
create policy menu_images_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = (select public.current_business_id())::text
);

drop policy brand_assets_read on storage.objects;
create policy brand_assets_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'brand-assets'
  and (storage.foldername(name))[1] = (select public.current_business_id())::text
);

-- PostgreSQL grants EXECUTE to PUBLIC by default. Explicitly remove anonymous
-- access from every SECURITY DEFINER API/helper and restore only the signed-in
-- calls the application and its RLS policies require.
revoke all on function public.create_order(jsonb) from public, anon;
revoke all on function public.void_order(uuid, text) from public, anon;
revoke all on function public.find_or_create_customer(jsonb) from public, anon;
revoke all on function public.record_stock_movement(jsonb) from public, anon;
revoke all on function public.mark_order_prepared(uuid) from public, anon;
revoke all on function public.current_business_id() from public, anon;
revoke all on function public.current_counter_id() from public, anon;
revoke all on function public."current_role"() from public, anon;
revoke all on function public.current_counter_kind() from public, anon;
revoke all on function public.is_owner() from public, anon;
revoke all on function public.is_owner_or_manager() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.create_order(jsonb) to authenticated;
grant execute on function public.void_order(uuid, text) to authenticated;
grant execute on function public.find_or_create_customer(jsonb) to authenticated;
grant execute on function public.record_stock_movement(jsonb) to authenticated;
grant execute on function public.mark_order_prepared(uuid) to authenticated;
grant execute on function public.current_business_id() to authenticated;
grant execute on function public.current_counter_id() to authenticated;
grant execute on function public."current_role"() to authenticated;
grant execute on function public.current_counter_kind() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_owner_or_manager() to authenticated;
