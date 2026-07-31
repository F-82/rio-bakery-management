-- A supplied menu can legitimately contain the same display name at two
-- prices (Fish Pastry is listed at both LKR 110 and LKR 120). Preserve both
-- rows instead of renaming or silently merging them.
alter table public.menu_items
  drop constraint menu_items_business_name_category_schedule_key;

alter table public.menu_items
  add constraint menu_items_business_name_category_schedule_price_key
  unique (
    business_id,
    name,
    main_category,
    availability_schedule,
    price
  );

insert into public.categories (business_id, name, scope, sort_order)
select id, 'Weekday Bakery', 'menu', 490
from public.businesses
where name = 'Rio Bakers Hut'
on conflict (business_id, scope, name) do update
set sort_order = excluded.sort_order;

-- weekdays-bakery.csv.csv, imported verbatim. Blank-price rows are retained
-- at 0.00 but unavailable so staff cannot accidentally sell them for free.
with weekday_items (name, price, available, sort_order) as (
  values
    ('Normal Bread', 100.00, true, 3000),
    ('Sandwich Bread (L)', 260.00, true, 3010),
    ('Sandwich Bread (S)', 200.00, true, 3020),
    ('Roast Bread', 45.00, true, 3030),
    ('Hot Dog', 200.00, true, 3040),
    ('Burger', 150.00, true, 3050),
    ('Drumstick Bun', 150.00, true, 3060),
    ('Cheese Burger Omlet', 100.00, true, 3070),
    ('Deval Bun', 0.00, false, 3080),
    ('Egg Bun', 100.00, true, 3090),
    ('Sausage Bun', 100.00, true, 3100),
    ('Sausage Pastry', 130.00, true, 3110),
    ('Fish Pastry', 110.00, true, 3120),
    ('Fish Pastry', 120.00, true, 3130),
    ('Chicken Pastry', 0.00, false, 3140),
    ('Chocolate Pastry', 130.00, true, 3150),
    ('Sausages Bun(S)', 80.00, true, 3160),
    ('Egg Pizza', 120.00, true, 3170),
    ('Senisambal Bun', 80.00, true, 3180),
    ('Fish Bun', 90.00, true, 3190),
    ('Garlic Bun', 0.00, false, 3200),
    ('Polpani Jam Bun', 80.00, true, 3210),
    ('Viyan Roll', 60.00, true, 3220),
    ('Jam Pass', 70.00, true, 3230),
    ('Tea Bun', 0.00, false, 3240),
    ('Cream Bun', 0.00, false, 3250),
    ('Jam Bun', 80.00, true, 3260),
    ('Spanchi', 80.00, true, 3270),
    ('Donut', 0.00, false, 3280),
    ('Egg Roll', 130.00, true, 3290),
    ('Fish Roll', 120.00, true, 3300),
    ('Chinese Roll', 80.00, true, 3310),
    ('Cutlet', 60.00, true, 3320),
    ('Patis', 70.00, true, 3330),
    ('Sandwich Piece', 0.00, false, 3340),
    ('Ada 70/-', 0.00, false, 3350),
    ('Tea Cake', 50.00, true, 3360),
    ('Cookies', 0.00, false, 3370),
    ('Butter Cake', 0.00, false, 3380),
    ('Chocolate Cake', 0.00, false, 3390),
    ('Ribbon Cake', 0.00, false, 3400),
    ('Fruit Cake', 0.00, false, 3410),
    ('Cake Pieces', 0.00, false, 3420),
    ('Chicken Bun', 150.00, true, 3430),
    ('Mushroom Bun', 0.00, false, 3440),
    ('Wade', 30.00, true, 3450)
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
  'monday_saturday'
from weekday_items i
cross join public.businesses b
join public.categories c
  on c.business_id = b.id
  and c.scope = 'menu'
  and c.name = 'Weekday Bakery'
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
  available = excluded.available,
  requires_kitchen_prep = excluded.requires_kitchen_prep,
  tax_category = excluded.tax_category,
  sort_order = excluded.sort_order;
