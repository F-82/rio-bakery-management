-- Private storage bucket for expense receipts (STEPS.md §14).
--
-- Unlike menu-images (public, anyone can view a dish photo), a receipt can
-- carry sensitive financial detail, so this bucket is private and its
-- policies mirror expenses' own RLS exactly (20260726200104_rls.sql):
-- owner/manager may read, owner only may write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

create policy receipts_read on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and public.is_owner_or_manager()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy receipts_write on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and public.is_owner()
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );
