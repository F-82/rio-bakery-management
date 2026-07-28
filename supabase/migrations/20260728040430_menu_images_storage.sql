-- Storage bucket for menu item photos (STEPS.md §11).
--
-- Public bucket: menu photos are shown in the POS tile grid and the menu
-- management list, never anything sensitive, so plain public URLs are fine.
-- Writes are still scoped by business — the first path segment must be the
-- caller's business_id, and only owner/manager may write (mirrors
-- menu_items_write in 20260726200104_rls.sql).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy menu_images_read on storage.objects for select
  to public
  using (bucket_id = 'menu-images');

create policy menu_images_write on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );
