with schedules (availability_schedule, category_name, sort_order) as (
  values
    ('monday_saturday'::public.menu_schedule, 'Weekday Bakery', 3460),
    ('sunday'::public.menu_schedule, 'Sunday Bakery', 2450)
)
insert into public.menu_items (
  business_id,
  name,
  price,
  category_id,
  available,
  requires_kitchen_prep,
  tax_category,
  sort_order,
  main_category,
  availability_schedule
)
select
  b.id,
  'Rio Special Bun',
  0.00,
  c.id,
  false,
  false,
  'standard',
  s.sort_order,
  'bakery',
  s.availability_schedule
from schedules s
cross join public.businesses b
join public.categories c
  on c.business_id = b.id
  and c.scope = 'menu'
  and c.name = s.category_name
where b.name = 'Rio Bakers Hut'
on conflict (
  business_id,
  name,
  main_category,
  availability_schedule,
  price
) do update
set
  category_id = excluded.category_id,
  available = false,
  requires_kitchen_prep = false,
  tax_category = excluded.tax_category,
  sort_order = excluded.sort_order;
