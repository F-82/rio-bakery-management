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
  ('11111111-1111-1111-1111-111111111111', 'Soup', 'menu', 10),
  ('11111111-1111-1111-1111-111111111111', 'Appetizer', 'menu', 20),
  ('11111111-1111-1111-1111-111111111111', 'Salad', 'menu', 30),
  ('11111111-1111-1111-1111-111111111111', 'Noodles', 'menu', 40),
  ('11111111-1111-1111-1111-111111111111', 'Prawns', 'menu', 50),
  ('11111111-1111-1111-1111-111111111111', 'Mutton', 'menu', 60),
  ('11111111-1111-1111-1111-111111111111', 'Cuttle Fish', 'menu', 70),
  ('11111111-1111-1111-1111-111111111111', 'Vegetable', 'menu', 80),
  ('11111111-1111-1111-1111-111111111111', 'Beef', 'menu', 90),
  ('11111111-1111-1111-1111-111111111111', 'Nasi Goreng', 'menu', 100),
  ('11111111-1111-1111-1111-111111111111', 'Biryani', 'menu', 110),
  ('11111111-1111-1111-1111-111111111111', 'Chicken', 'menu', 120),
  ('11111111-1111-1111-1111-111111111111', 'Fish', 'menu', 130),
  ('11111111-1111-1111-1111-111111111111', 'Spaghetti', 'menu', 140),
  ('11111111-1111-1111-1111-111111111111', 'Rice', 'menu', 150),
  ('11111111-1111-1111-1111-111111111111', 'Kottu', 'menu', 160),
  ('11111111-1111-1111-1111-111111111111', 'Beverage', 'menu', 170),
  ('11111111-1111-1111-1111-111111111111', 'Mojito', 'menu', 180),
  ('11111111-1111-1111-1111-111111111111', 'Milkshake', 'menu', 190),
  ('11111111-1111-1111-1111-111111111111', 'Lassi', 'menu', 200),
  ('11111111-1111-1111-1111-111111111111', 'Dessert', 'menu', 210),
  ('11111111-1111-1111-1111-111111111111', 'Kids Menu', 'menu', 220),
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
  ('Canned Soda',        'Merchandise',    'merchandise',   'unit',   150,   24, 130.00),
  -- Hotplate menu protein/dry-good categories added 3e7781d have no stock
  -- data from the client yet (hotplate-menu.csv has names/prices only, no
  -- ingredients or supplier costs). qty_on_hand/cost are 0, not a real
  -- count, so recipe_items for these can't be built without inventing
  -- numbers — see LOG.md [blocked] hotplate recipe data.
  ('Prawns',             'Proteins',       'ingredient',    'g',        0,    0,   0.00),
  ('Mutton',             'Proteins',       'ingredient',    'g',        0,    0,   0.00),
  ('Beef',               'Proteins',       'ingredient',    'g',        0,    0,   0.00),
  ('Cuttlefish',         'Proteins',       'ingredient',    'g',        0,    0,   0.00),
  ('Noodles',            'Dry Goods',      'ingredient',    'g',        0,    0,   0.00),
  ('Pasta',              'Dry Goods',      'ingredient',    'g',        0,    0,   0.00)
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
  ('Chicken Soup', 'Soup', 480.0, true, 'standard', 10),
  ('Mutton Soup', 'Soup', 780.0, true, 'standard', 20),
  ('Seafood Soup', 'Soup', 680.0, true, 'standard', 30),
  ('Sweet Corn With Chicken Soup', 'Soup', 580.0, true, 'standard', 40),
  ('Tom Yum Soup', 'Soup', 580.0, true, 'standard', 50),
  ('Vegetables Soup', 'Soup', 380.0, true, 'standard', 60),
  ('Roseted Cashew Nut', 'Appetizer', 1980.0, true, 'standard', 70),
  ('French Fries', 'Appetizer', 780.0, true, 'standard', 80),
  ('Green Salad', 'Salad', 680.0, true, 'standard', 90),
  ('Mix Sea Food Salad', 'Salad', 980.0, true, 'standard', 100),
  ('Cucumber Salad', 'Salad', 480.0, true, 'standard', 110),
  ('Tomato Salad', 'Salad', 480.0, true, 'standard', 120),
  ('Vegetable Noodles (Half)', 'Noodles', 480.0, true, 'standard', 130),
  ('Vegetable Noodles (Full)', 'Noodles', 880.0, true, 'standard', 140),
  ('Egg Noodles (Half)', 'Noodles', 580.0, true, 'standard', 150),
  ('Egg Noodles (Full)', 'Noodles', 980.0, true, 'standard', 160),
  ('Fish Noodles (Half)', 'Noodles', 580.0, true, 'standard', 170),
  ('Fish Noodles (Full)', 'Noodles', 980.0, true, 'standard', 180),
  ('Chicken Noodles (Half)', 'Noodles', 680.0, true, 'standard', 190),
  ('Chicken Noodles (Full)', 'Noodles', 1080.0, true, 'standard', 200),
  ('Prawns Noodles (Half)', 'Noodles', 780.0, true, 'standard', 210),
  ('Prawns Noodles (Full)', 'Noodles', 1480.0, true, 'standard', 220),
  ('Sea Food Noodles (Half)', 'Noodles', 880.0, true, 'standard', 230),
  ('Sea Food Noodles (Full)', 'Noodles', 1680.0, true, 'standard', 240),
  ('Mix Noodles (Half)', 'Noodles', 880.0, true, 'standard', 250),
  ('Mix Noodles (Full)', 'Noodles', 1680.0, true, 'standard', 260),
  ('Fried Prawns', 'Prawns', 1480.0, true, 'standard', 270),
  ('Deviled Prawns', 'Prawns', 1480.0, true, 'standard', 280),
  ('Prawns Curry', 'Prawns', 1480.0, true, 'standard', 290),
  ('Prawns Stew', 'Prawns', 1480.0, true, 'standard', 300),
  ('Butter Prawns', 'Prawns', 1580.0, true, 'standard', 310),
  ('Mutton Curry', 'Mutton', 2580.0, true, 'standard', 320),
  ('Deviled Mutton', 'Mutton', 2580.0, true, 'standard', 330),
  ('Mutton Stew', 'Mutton', 2580.0, true, 'standard', 340),
  ('Cuttle Fish Curry', 'Cuttle Fish', 1480.0, true, 'standard', 350),
  ('Deviled Cuttle Fish', 'Cuttle Fish', 1480.0, true, 'standard', 360),
  ('Hot Butter Cuttle Fish', 'Cuttle Fish', 1480.0, true, 'standard', 370),
  ('Boiled Vegetables', 'Vegetable', 580.0, true, 'standard', 380),
  ('Hot Butter Mushroom', 'Vegetable', 880.0, true, 'standard', 390),
  ('Garlic Kankun', 'Vegetable', 580.0, true, 'standard', 400),
  ('Fried Beef', 'Beef', 1380.0, true, 'standard', 410),
  ('Deviled Beef', 'Beef', 1380.0, true, 'standard', 420),
  ('Beef Curry', 'Beef', 1380.0, true, 'standard', 430),
  ('Beef Stew', 'Beef', 1380.0, true, 'standard', 440),
  ('Chicken Nasi Goreng (Half)', 'Nasi Goreng', 780.0, true, 'standard', 450),
  ('Chicken Nasi Goreng (Full)', 'Nasi Goreng', 980.0, true, 'standard', 460),
  ('Sea Food Goreng (Half)', 'Nasi Goreng', 780.0, true, 'standard', 470),
  ('Sea Food Goreng (Full)', 'Nasi Goreng', 1480.0, true, 'standard', 480),
  ('Vegetable Chopsuey Rice (Half)', 'Nasi Goreng', 680.0, true, 'standard', 490),
  ('Vegetable Chopsuey Rice (Full)', 'Nasi Goreng', 1280.0, true, 'standard', 500),
  ('Chicken Chopsuey Rice (Half)', 'Nasi Goreng', 880.0, true, 'standard', 510),
  ('Chicken Chopsuey Rice (Full)', 'Nasi Goreng', 1480.0, true, 'standard', 520),
  ('Sea Food Chopsuey Rice (Half)', 'Nasi Goreng', 880.0, true, 'standard', 530),
  ('Sea Food Chopsuey Rice (Full)', 'Nasi Goreng', 1480.0, true, 'standard', 540),
  ('Mix Chopsuey Rice (Half)', 'Nasi Goreng', 880.0, true, 'standard', 550),
  ('Mix Chopsuey Rice (Full)', 'Nasi Goreng', 1480.0, true, 'standard', 560),
  ('Chicken Biryani (Half)', 'Biryani', 680.0, true, 'standard', 570),
  ('Chicken Biryani (Full)', 'Biryani', 1080.0, true, 'standard', 580),
  ('Mutton Biryani (Half)', 'Biryani', 850.0, true, 'standard', 590),
  ('Mutton Biryani (Full)', 'Biryani', 1580.0, true, 'standard', 600),
  ('Beef Biryani (Half)', 'Biryani', 780.0, true, 'standard', 610),
  ('Beef Biryani (Full)', 'Biryani', 1480.0, true, 'standard', 620),
  ('Fried Chicken', 'Chicken', 1080.0, true, 'standard', 630),
  ('Deviled Chicken', 'Chicken', 1080.0, true, 'standard', 640),
  ('Chicken Curry', 'Chicken', 980.0, true, 'standard', 650),
  ('Chicken Stew (listed twice)', 'Chicken', 1080.0, true, 'standard', 660),
  ('Chilli Chicken', 'Chicken', 1080.0, true, 'standard', 670),
  ('Butter Chicken', 'Chicken', 1080.0, true, 'standard', 680),
  ('Fried Fish', 'Fish', 980.0, true, 'standard', 690),
  ('Deviled Fish', 'Fish', 980.0, true, 'standard', 700),
  ('Curry Fish', 'Fish', 880.0, true, 'standard', 710),
  ('Stew Fish', 'Fish', 980.0, true, 'standard', 720),
  ('Fish Fingers', 'Fish', 1080.0, true, 'standard', 730),
  ('Chicken Spaghetti (Half)', 'Spaghetti', 780.0, true, 'standard', 740),
  ('Chicken Spaghetti (Full)', 'Spaghetti', 1480.0, true, 'standard', 750),
  ('Prawns Spaghetti (Half)', 'Spaghetti', 780.0, true, 'standard', 760),
  ('Prawns Spaghetti (Full)', 'Spaghetti', 1480.0, true, 'standard', 770),
  ('Seafood Spaghetti (Half)', 'Spaghetti', 780.0, true, 'standard', 780),
  ('Seafood Spaghetti (Full)', 'Spaghetti', 1480.0, true, 'standard', 790),
  ('Mix Spaghetti (Half)', 'Spaghetti', 780.0, true, 'standard', 800),
  ('Mix Spaghetti (Full)', 'Spaghetti', 1480.0, true, 'standard', 810),
  ('Creamy Chicken Penne Pasta (Half)', 'Spaghetti', 780.0, true, 'standard', 820),
  ('Creamy Chicken Penne Pasta (Full)', 'Spaghetti', 1480.0, true, 'standard', 830),
  ('Creamy Chicken Sea Food Pasta (Half)', 'Spaghetti', 780.0, true, 'standard', 840),
  ('Creamy Chicken Sea Food Pasta (Full)', 'Spaghetti', 1480.0, true, 'standard', 850),
  ('Steam Rice', 'Rice', 380.0, true, 'standard', 860),
  ('Vegetable Rice (Half)', 'Rice', 480.0, true, 'standard', 870),
  ('Vegetable Rice (Full)', 'Rice', 880.0, true, 'standard', 880),
  ('Egg Fried Rice (Half)', 'Rice', 520.0, true, 'standard', 890),
  ('Egg Fried Rice (Full)', 'Rice', 980.0, true, 'standard', 900),
  ('Fish Fried Rice (Half)', 'Rice', 580.0, true, 'standard', 910),
  ('Fish Fried Rice (Full)', 'Rice', 980.0, true, 'standard', 920),
  ('Chicken Fried Rice (Half)', 'Rice', 580.0, true, 'standard', 930),
  ('Chicken Fried Rice (Full)', 'Rice', 980.0, true, 'standard', 940),
  ('Prawns Fried Rice (Half)', 'Rice', 780.0, true, 'standard', 950),
  ('Prawns Fried Rice (Full)', 'Rice', 1480.0, true, 'standard', 960),
  ('Sea Food Fried Rice (Half)', 'Rice', 780.0, true, 'standard', 970),
  ('Sea Food Fried Rice (Full)', 'Rice', 1480.0, true, 'standard', 980),
  ('Mix Fried Rice (Half)', 'Rice', 780.0, true, 'standard', 990),
  ('Mix Fried Rice (Full)', 'Rice', 1480.0, true, 'standard', 1000),
  ('Vegetable Kottu (Half)', 'Kottu', 480.0, true, 'standard', 1010),
  ('Vegetable Kottu (Full)', 'Kottu', 880.0, true, 'standard', 1020),
  ('Egg Kottu (Half)', 'Kottu', 520.0, true, 'standard', 1030),
  ('Egg Kottu (Full)', 'Kottu', 920.0, true, 'standard', 1040),
  ('Chicken Kottu (Half)', 'Kottu', 580.0, true, 'standard', 1050),
  ('Chicken Kottu (Full)', 'Kottu', 980.0, true, 'standard', 1060),
  ('Cheese Kottu (Half)', 'Kottu', 780.0, true, 'standard', 1070),
  ('Cheese Kottu (Full)', 'Kottu', 1480.0, true, 'standard', 1080),
  ('Roasted Chicken Cheese Kottu (Half)', 'Kottu', 930.0, true, 'standard', 1090),
  ('Roasted Chicken Cheese Kottu (Full)', 'Kottu', 1580.0, true, 'standard', 1100),
  ('Sea Food Kottu (Half)', 'Kottu', 930.0, true, 'standard', 1110),
  ('Sea Food Kottu (Full)', 'Kottu', 1580.0, true, 'standard', 1120),
  ('Mix Kottu (Half)', 'Kottu', 930.0, true, 'standard', 1130),
  ('Mix Kottu (Full)', 'Kottu', 1580.0, true, 'standard', 1140),
  ('Fresh Lime Juice', 'Beverage', 260.0, true, 'standard', 1150),
  ('Mango Juice', 'Beverage', 380.0, true, 'standard', 1160),
  ('Mix Fruit Juice', 'Beverage', 380.0, true, 'standard', 1170),
  ('Orange Juice', 'Beverage', 380.0, true, 'standard', 1180),
  ('Pineapple Juice', 'Beverage', 380.0, true, 'standard', 1190),
  ('Papaya Juice', 'Beverage', 380.0, true, 'standard', 1200),
  ('Watermelon Juice', 'Beverage', 280.0, true, 'standard', 1210),
  ('Avocado Juice', 'Beverage', 380.0, true, 'standard', 1220),
  ('Passion Fruit Juice', 'Beverage', 280.0, true, 'standard', 1230),
  ('Rio Special Lime Mint', 'Beverage', 380.0, true, 'standard', 1240),
  ('Fruit Salad', 'Beverage', 480.0, true, 'standard', 1250),
  ('Fruit Platter', 'Beverage', 880.0, true, 'standard', 1260),
  ('Strawberry Mojito', 'Mojito', 580.0, true, 'standard', 1270),
  ('Mint Mojito', 'Mojito', 580.0, true, 'standard', 1280),
  ('Passion Fruit Mojito', 'Mojito', 580.0, true, 'standard', 1290),
  ('Vanilla Milkshake', 'Milkshake', 580.0, true, 'standard', 1300),
  ('Chocolate Milkshake', 'Milkshake', 580.0, true, 'standard', 1310),
  ('Strawberry Milkshake', 'Milkshake', 580.0, true, 'standard', 1320),
  ('Lassi', 'Lassi', 380.0, true, 'standard', 1330),
  ('Mango Lassi', 'Lassi', 480.0, true, 'standard', 1340),
  ('Watalappan', 'Dessert', 120.0, true, 'standard', 1350),
  ('Ice Cream', 'Dessert', 400.0, true, 'standard', 1360),
  ('Chocolate Brownies', 'Dessert', 480.0, true, 'standard', 1370),
  ('Fruit Salad With Ice Cream', 'Dessert', 680.0, true, 'standard', 1380),
  ('Cream Caramel Pudding', 'Dessert', 120.0, true, 'standard', 1390),
  ('Rainbow Jelly', 'Dessert', 120.0, true, 'standard', 1400),
  ('Crunchy Fish Fingers', 'Kids Menu', 880.0, true, 'standard', 1410),
  ('Chicken Lollipop', 'Kids Menu', 880.0, true, 'standard', 1420),
  ('French Fries (Kids)', 'Kids Menu', 580.0, true, 'standard', 1430),
  ('Creamy Pasta / Spaghetti', 'Kids Menu', 680.0, true, 'standard', 1440),
  ('Chicken Sandwich', 'Kids Menu', 1280.0, true, 'standard', 1450),
  ('Cheese Sandwich', 'Kids Menu', 1080.0, true, 'standard', 1460),
  ('Mini Chicken Burger', 'Kids Menu', 480.0, true, 'standard', 1470)
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
--
-- Only "Fresh Lime Juice" has a real recipe below. The other 146 hotplate
-- menu items (3e7781d) have no ingredient data from the client yet —
-- hotplate-menu.csv is name/price only. A prior bakery-menu recipe list
-- lived here (Fish Bun, Chicken Roll, Croissant, Kottu variants, etc.)
-- referencing menu items that no longer exist; it silently matched nothing
-- via this block's inner join (no error, just dead rows) and has been
-- removed rather than left as misleading dead seed data. See LOG.md
-- [blocked] hotplate recipe data — orders for these items won't deduct
-- stock until real recipes are supplied.
insert into public.recipe_items (business_id, menu_item_id, inventory_item_id, qty)
select '11111111-1111-1111-1111-111111111111', m.id, i.id, v.qty
from (values
  ('Fresh Lime Juice',    'Lime',                  2),
  ('Fresh Lime Juice',    'Sugar',                25)
) as v(menu_name, inv_name, qty)
join public.menu_items m
  on m.business_id = '11111111-1111-1111-1111-111111111111' and m.name = v.menu_name
join public.inventory_items i
  on i.business_id = '11111111-1111-1111-1111-111111111111' and i.name = v.inv_name
on conflict (menu_item_id, inventory_item_id) do update set qty = excluded.qty;
