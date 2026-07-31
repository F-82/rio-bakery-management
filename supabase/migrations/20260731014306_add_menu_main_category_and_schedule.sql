create type public.menu_main_category as enum ('hot_plate', 'bakery', 'drinks');
create type public.menu_schedule as enum ('all_days', 'monday_saturday', 'sunday');

alter table public.menu_items
  add column main_category public.menu_main_category,
  add column availability_schedule public.menu_schedule;

-- The catalog already contains the supplied hot-plate menu. Keep those items
-- available every day while making the new classification explicit.
update public.menu_items
set
  main_category = 'hot_plate',
  availability_schedule = 'all_days';

alter table public.menu_items
  alter column main_category set not null,
  alter column availability_schedule set not null,
  alter column availability_schedule set default 'all_days';

alter table public.menu_items
  drop constraint menu_items_business_id_name_key;

alter table public.menu_items
  add constraint menu_items_business_name_category_schedule_key
  unique (business_id, name, main_category, availability_schedule);

create index menu_items_main_category_schedule_idx
  on public.menu_items (business_id, main_category, availability_schedule)
  where available;

-- The supplied CSV does not include subcategories, so keep its items together
-- under a dedicated Sunday Bakery subcategory. It can be refined in the UI.
insert into public.categories (business_id, name, scope, sort_order)
select id, 'Sunday Bakery', 'menu', 500
from public.businesses
where name = 'Rio Bakers Hut'
on conflict (business_id, scope, name) do update
set sort_order = excluded.sort_order;

-- sunday-bakery.csv, imported verbatim. Rows with a blank price are retained
-- at 0.00 but kept unavailable so they cannot accidentally be sold for free.
with sunday_items (name, price, available, sort_order) as (
  values
    ('Normal Bread', 100.00, true, 2000),
    ('Sandwich Bread (L)', 260.00, true, 2010),
    ('Sandwich Bread (S)', 200.00, true, 2020),
    ('Roast Bread', 45.00, true, 2030),
    ('Hot Dog', 200.00, true, 2040),
    ('Burger', 150.00, true, 2050),
    ('Drumstick Bun', 150.00, true, 2060),
    ('Cheese Burger Omelet', 100.00, true, 2070),
    ('Deval Bun', 0.00, false, 2080),
    ('Egg Bun', 100.00, true, 2090),
    ('Sausage Bun', 100.00, true, 2100),
    ('Sausage Pastry', 130.00, true, 2110),
    ('Fish Pastry', 110.00, true, 2120),
    ('Chicken Pastry', 0.00, false, 2130),
    ('Chocolate Pastry', 130.00, true, 2140),
    ('Sausages Bun(S)', 80.00, true, 2150),
    ('Egg Pizza', 120.00, true, 2160),
    ('Senisambal Bun', 80.00, true, 2170),
    ('Fish Bun', 90.00, true, 2180),
    ('Garlic Bun', 0.00, false, 2190),
    ('Polpani Jam Bun', 80.00, true, 2200),
    ('Viyan Roll', 60.00, true, 2210),
    ('Jam Pass', 70.00, true, 2220),
    ('Tea Bun', 0.00, false, 2230),
    ('Cream Bun', 0.00, false, 2240),
    ('Jam Bun', 80.00, true, 2250),
    ('Spanichi', 0.00, false, 2260),
    ('Donut', 0.00, false, 2270),
    ('Egg Roll', 130.00, true, 2280),
    ('Fish Roll', 120.00, true, 2290),
    ('Chinese Roll', 0.00, false, 2300),
    ('Cutlet', 60.00, true, 2310),
    ('Patis', 70.00, true, 2320),
    ('Sandwich Piece', 0.00, false, 2330),
    ('Ada 70/-', 50.00, true, 2340),
    ('Tea Cake', 50.00, true, 2350),
    ('Cookies', 0.00, false, 2360),
    ('Butter Cake', 0.00, false, 2370),
    ('Chocolate Cake', 0.00, false, 2380),
    ('Ribbon Cake', 0.00, false, 2390),
    ('Fruit Cake', 0.00, false, 2400),
    ('Cake Pieces', 0.00, false, 2410),
    ('Chicken Bun', 150.00, true, 2420),
    ('Mushroom Bun', 0.00, false, 2430),
    ('Wade', 30.00, true, 2440)
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
  i.name,
  i.price,
  c.id,
  i.available,
  false,
  'standard',
  i.sort_order,
  'bakery',
  'sunday'
from sunday_items i
cross join public.businesses b
join public.categories c
  on c.business_id = b.id
  and c.scope = 'menu'
  and c.name = 'Sunday Bakery'
where b.name = 'Rio Bakers Hut'
on conflict (business_id, name, main_category, availability_schedule) do update
set
  price = excluded.price,
  category_id = excluded.category_id,
  available = excluded.available,
  requires_kitchen_prep = excluded.requires_kitchen_prep,
  tax_category = excluded.tax_category,
  sort_order = excluded.sort_order;
