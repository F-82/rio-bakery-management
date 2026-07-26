-- Seed data for rio-staging. Idempotent — safe to re-run.
-- Auth users (owner + staff) are seeded separately via the Admin API so their
-- profiles are created by the on_auth_user_created trigger. See
-- scripts/seed-auth.mjs. Fixed UUIDs below let that script reference them.

-- Business -----------------------------------------------------------------
insert into public.businesses (id, name, currency, timezone)
values ('11111111-1111-1111-1111-111111111111', 'Rio Bakers Hut', 'LKR', 'Asia/Colombo')
on conflict (id) do update
  set name = excluded.name, currency = excluded.currency, timezone = excluded.timezone;

-- Counters -----------------------------------------------------------------
insert into public.counters (id, business_id, name, kind)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Bakery',    'bakery'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Hot Plate', 'hot_plate')
on conflict (id) do update
  set name = excluded.name, kind = excluded.kind, active = true;

-- Baseline settings (see ARCHITECTURE.md §Loyalty, §Stock ledger) ----------
insert into public.settings (business_id, key, value, is_public)
values
  ('11111111-1111-1111-1111-111111111111', 'loyalty.earn_points_per_lkr',   '1'::jsonb,    true),
  ('11111111-1111-1111-1111-111111111111', 'loyalty.redeem_lkr_per_point',  '0.01'::jsonb, true),
  ('11111111-1111-1111-1111-111111111111', 'inventory.allow_negative_stock', 'true'::jsonb, false)
on conflict (business_id, key) do update set value = excluded.value, is_public = excluded.is_public;

-- Catalog ------------------------------------------------------------------
-- Categories (menu + inventory scopes)
insert into public.categories (business_id, name, scope, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Buns & Rolls',          'menu',      10),
  ('11111111-1111-1111-1111-111111111111', 'Cakes & Pastries',      'menu',      20),
  ('11111111-1111-1111-1111-111111111111', 'Kottu & Rice',          'menu',      30),
  ('11111111-1111-1111-1111-111111111111', 'Sandwiches & Devilled', 'menu',      40),
  ('11111111-1111-1111-1111-111111111111', 'Beverages',             'menu',      50),
  ('11111111-1111-1111-1111-111111111111', 'Dry Goods',             'inventory', 10),
  ('11111111-1111-1111-1111-111111111111', 'Dairy & Eggs',          'inventory', 20),
  ('11111111-1111-1111-1111-111111111111', 'Proteins',              'inventory', 30),
  ('11111111-1111-1111-1111-111111111111', 'Produce',               'inventory', 40),
  ('11111111-1111-1111-1111-111111111111', 'Bakery Supplies',       'inventory', 50),
  ('11111111-1111-1111-1111-111111111111', 'Finished Goods',        'inventory', 60),
  ('11111111-1111-1111-1111-111111111111', 'Merchandise',           'inventory', 70)
on conflict (business_id, scope, name) do update set sort_order = excluded.sort_order;

-- Inventory items: (name, category, stock_type, base_unit, qty_on_hand, low_stock_threshold, unit_cost)
insert into public.inventory_items
  (business_id, name, category_id, stock_type, base_unit, qty_on_hand, low_stock_threshold, unit_cost)
select
  '11111111-1111-1111-1111-111111111111',
  v.name, c.id, v.stock_type::public.stock_type, v.base_unit, v.qty, v.low, v.cost
from (values
  ('Flour',              'Dry Goods',      'ingredient',    'g',    50000, 5000, 0.25),
  ('Sugar',              'Dry Goods',      'ingredient',    'g',    30000, 3000, 0.30),
  ('Rice',               'Dry Goods',      'ingredient',    'g',    60000, 8000, 0.20),
  ('Kottu Roti',         'Dry Goods',      'ingredient',    'g',    20000, 3000, 0.40),
  ('Tea Leaves',         'Dry Goods',      'ingredient',    'g',     5000,  500, 2.00),
  ('Coffee Powder',      'Dry Goods',      'ingredient',    'g',     4000,  500, 3.50),
  ('Cooking Oil',        'Dry Goods',      'ingredient',    'ml',   20000, 2000, 0.50),
  ('Butter',             'Dairy & Eggs',   'ingredient',    'g',    10000, 1000, 1.20),
  ('Milk',               'Dairy & Eggs',   'ingredient',    'ml',   20000, 2000, 0.35),
  ('Eggs',               'Dairy & Eggs',   'ingredient',    'unit',   300,   30, 25.00),
  ('Cheese',             'Dairy & Eggs',   'ingredient',    'g',     5000,  500, 2.50),
  ('Chicken',            'Proteins',       'ingredient',    'g',    40000, 5000, 1.10),
  ('Fish',               'Proteins',       'ingredient',    'g',    20000, 2000, 1.40),
  ('Sausage',            'Proteins',       'ingredient',    'g',     8000, 1000, 1.60),
  ('Vegetables',         'Produce',        'ingredient',    'g',    30000, 3000, 0.30),
  ('Lime',               'Produce',        'ingredient',    'unit',   200,   20, 15.00),
  ('Bread Loaf',         'Bakery Supplies','ingredient',    'unit',   100,   10, 120.00),
  ('Croissant',          'Finished Goods', 'finished_good', 'unit',    60,   10, 90.00),
  ('Bottled Water 500ml','Merchandise',    'merchandise',   'unit',   200,   24, 60.00),
  ('Canned Soda',        'Merchandise',    'merchandise',   'unit',   150,   24, 130.00)
) as v(name, cat, stock_type, base_unit, qty, low, cost)
join public.categories c
  on c.business_id = '11111111-1111-1111-1111-111111111111'
  and c.scope = 'inventory' and c.name = v.cat
on conflict (business_id, name) do update set
  category_id = excluded.category_id,
  stock_type = excluded.stock_type,
  base_unit = excluded.base_unit,
  qty_on_hand = excluded.qty_on_hand,
  low_stock_threshold = excluded.low_stock_threshold,
  unit_cost = excluded.unit_cost;

-- Menu items: (name, category, price, requires_kitchen_prep, tax_category, sort_order)
insert into public.menu_items
  (business_id, name, category_id, price, requires_kitchen_prep, tax_category, sort_order)
select
  '11111111-1111-1111-1111-111111111111',
  v.name, c.id, v.price, v.prep, v.tax::public.tax_category, v.sort
from (values
  ('Fish Bun',             'Buns & Rolls',          120,  false, 'standard',   10),
  ('Chicken Roll',         'Buns & Rolls',          150,  false, 'standard',   20),
  ('Vegetable Roti',       'Buns & Rolls',          100,  false, 'exempt',     30),
  ('Egg Roti',             'Buns & Rolls',          130,  false, 'standard',   40),
  ('Sausage Bun',          'Buns & Rolls',          160,  false, 'standard',   50),
  ('Croissant',            'Cakes & Pastries',      220,  true,  'standard',   10),
  ('Chocolate Éclair',     'Cakes & Pastries',      180,  false, 'standard',   20),
  ('Butter Cake Slice',    'Cakes & Pastries',      140,  false, 'standard',   30),
  ('Ribbon Cake Slice',    'Cakes & Pastries',      150,  false, 'standard',   40),
  ('Chicken Kottu',        'Kottu & Rice',          850,  true,  'standard',   10),
  ('Vegetable Kottu',      'Kottu & Rice',          650,  true,  'standard',   20),
  ('Cheese Kottu',         'Kottu & Rice',          1100, true,  'standard',   30),
  ('Egg Fried Rice',       'Kottu & Rice',          700,  true,  'standard',   40),
  ('Chicken Fried Rice',   'Kottu & Rice',          950,  true,  'standard',   50),
  ('Chicken Submarine',    'Sandwiches & Devilled', 780,  true,  'standard',   10),
  ('Devilled Chicken',     'Sandwiches & Devilled', 1200, true,  'standard',   20),
  ('Plain Tea',            'Beverages',             80,   true,  'standard',   10),
  ('Milk Coffee',          'Beverages',             150,  true,  'standard',   20),
  ('Fresh Lime Juice',     'Beverages',             250,  true,  'standard',   30),
  ('Bottled Water 500ml',  'Beverages',             100,  false, 'zero_rated', 40),
  ('Canned Soda',          'Beverages',             250,  false, 'standard',   50)
) as v(name, cat, price, prep, tax, sort)
join public.categories c
  on c.business_id = '11111111-1111-1111-1111-111111111111'
  and c.scope = 'menu' and c.name = v.cat
on conflict (business_id, name) do update set
  category_id = excluded.category_id,
  price = excluded.price,
  requires_kitchen_prep = excluded.requires_kitchen_prep,
  tax_category = excluded.tax_category,
  sort_order = excluded.sort_order;

-- Recipe items: (menu_item, inventory_item, qty in the item's base_unit)
-- Croissant / Bottled Water / Canned Soda point at their own finished_good /
-- merchandise inventory row with qty 1 (see ARCHITECTURE §Catalog).
insert into public.recipe_items (business_id, menu_item_id, inventory_item_id, qty)
select '11111111-1111-1111-1111-111111111111', m.id, i.id, v.qty
from (values
  ('Fish Bun',            'Flour',                80),
  ('Fish Bun',            'Fish',                 40),
  ('Fish Bun',            'Cooking Oil',           5),
  ('Chicken Roll',        'Flour',                70),
  ('Chicken Roll',        'Chicken',              50),
  ('Chicken Roll',        'Cooking Oil',          10),
  ('Vegetable Roti',      'Flour',                90),
  ('Vegetable Roti',      'Vegetables',           60),
  ('Egg Roti',            'Flour',                90),
  ('Egg Roti',            'Eggs',                  1),
  ('Sausage Bun',         'Flour',                80),
  ('Sausage Bun',         'Sausage',              50),
  ('Croissant',           'Croissant',             1),
  ('Chocolate Éclair',    'Flour',                50),
  ('Chocolate Éclair',    'Sugar',                30),
  ('Chocolate Éclair',    'Milk',                 40),
  ('Chocolate Éclair',    'Butter',               20),
  ('Butter Cake Slice',   'Flour',                60),
  ('Butter Cake Slice',   'Sugar',                50),
  ('Butter Cake Slice',   'Butter',               40),
  ('Butter Cake Slice',   'Eggs',                  1),
  ('Ribbon Cake Slice',   'Flour',                60),
  ('Ribbon Cake Slice',   'Sugar',                55),
  ('Ribbon Cake Slice',   'Butter',               35),
  ('Ribbon Cake Slice',   'Eggs',                  1),
  ('Chicken Kottu',       'Kottu Roti',          250),
  ('Chicken Kottu',       'Chicken',             150),
  ('Chicken Kottu',       'Vegetables',           80),
  ('Chicken Kottu',       'Eggs',                  1),
  ('Chicken Kottu',       'Cooking Oil',          20),
  ('Vegetable Kottu',     'Kottu Roti',          250),
  ('Vegetable Kottu',     'Vegetables',          150),
  ('Vegetable Kottu',     'Eggs',                  1),
  ('Vegetable Kottu',     'Cooking Oil',          20),
  ('Cheese Kottu',        'Kottu Roti',          250),
  ('Cheese Kottu',        'Chicken',             120),
  ('Cheese Kottu',        'Cheese',               80),
  ('Cheese Kottu',        'Vegetables',           60),
  ('Cheese Kottu',        'Eggs',                  1),
  ('Cheese Kottu',        'Cooking Oil',          20),
  ('Egg Fried Rice',      'Rice',                300),
  ('Egg Fried Rice',      'Eggs',                  2),
  ('Egg Fried Rice',      'Vegetables',           60),
  ('Egg Fried Rice',      'Cooking Oil',          20),
  ('Chicken Fried Rice',  'Rice',                300),
  ('Chicken Fried Rice',  'Chicken',             130),
  ('Chicken Fried Rice',  'Eggs',                  1),
  ('Chicken Fried Rice',  'Vegetables',           60),
  ('Chicken Fried Rice',  'Cooking Oil',          20),
  ('Chicken Submarine',   'Bread Loaf',            1),
  ('Chicken Submarine',   'Chicken',             120),
  ('Chicken Submarine',   'Cheese',               40),
  ('Chicken Submarine',   'Vegetables',           40),
  ('Devilled Chicken',    'Chicken',             250),
  ('Devilled Chicken',    'Vegetables',           80),
  ('Devilled Chicken',    'Cooking Oil',          25),
  ('Plain Tea',           'Tea Leaves',            5),
  ('Plain Tea',           'Sugar',                15),
  ('Milk Coffee',         'Coffee Powder',         8),
  ('Milk Coffee',         'Milk',                 80),
  ('Milk Coffee',         'Sugar',                15),
  ('Fresh Lime Juice',    'Lime',                  2),
  ('Fresh Lime Juice',    'Sugar',                25),
  ('Bottled Water 500ml', 'Bottled Water 500ml',   1),
  ('Canned Soda',         'Canned Soda',           1)
) as v(menu_name, inv_name, qty)
join public.menu_items m
  on m.business_id = '11111111-1111-1111-1111-111111111111' and m.name = v.menu_name
join public.inventory_items i
  on i.business_id = '11111111-1111-1111-1111-111111111111' and i.name = v.inv_name
on conflict (menu_item_id, inventory_item_id) do update set qty = excluded.qty;
