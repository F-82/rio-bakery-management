alter table public.menu_items
  add column menu_number integer;

with numbered as (
  select
    id,
    row_number() over (
      partition by business_id
      order by sort_order, created_at, id
    )::integer as menu_number
  from public.menu_items
)
update public.menu_items as item
set menu_number = numbered.menu_number
from numbered
where numbered.id = item.id;

alter table public.menu_items
  alter column menu_number set not null,
  add constraint menu_items_menu_number_positive check (menu_number > 0),
  add constraint menu_items_business_menu_number_key unique (business_id, menu_number);

create function public.assign_menu_item_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.menu_number is null then
    -- Serialize number assignment within one business so simultaneous inserts
    -- cannot both choose the same next number.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.business_id::text, 0)
    );

    select coalesce(max(item.menu_number), 0) + 1
    into new.menu_number
    from public.menu_items as item
    where item.business_id = new.business_id;
  end if;

  return new;
end;
$$;

create trigger assign_menu_item_number_before_insert
before insert on public.menu_items
for each row execute function public.assign_menu_item_number();
