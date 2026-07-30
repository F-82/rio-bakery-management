-- Apart from the deliberately reduced revenue screen and no Dashboard,
-- managers administer the same operational areas as owners.
alter policy businesses_write on public.businesses
  using (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and id = (select public.current_business_id())
  );

alter policy profiles_write on public.profiles
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );

alter policy settings_write on public.settings
  using (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  )
  with check (
    (select public.is_owner_or_manager())
    and business_id = (select public.current_business_id())
  );
