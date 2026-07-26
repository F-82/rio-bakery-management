-- Catalog schema: categories, menu_items, inventory_items, recipe_items.
-- See ARCHITECTURE.md §Schema/Catalog. RLS is added in a later step (§RLS).
--
-- Units: each inventory item has ONE canonical base_unit. recipe_items.qty is
-- always expressed in that unit. There is no conversion table.
-- Finished goods unify with ingredients: a finished_good is an inventory_item
-- whose menu item has a single recipe row pointing at that same inventory item
-- with qty 1, so stock deduction is one code path (see ARCHITECTURE §Catalog).

-- Enums --------------------------------------------------------------------

create type public.category_scope as enum ('menu', 'inventory');
create type public.stock_type as enum ('ingredient', 'finished_good', 'merchandise');
create type public.tax_category as enum ('standard', 'zero_rated', 'exempt');

-- Categories ---------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name        text not null,
  scope       public.category_scope not null,
  sort_order  integer not null default 0,
  unique (business_id, scope, name),
  -- target for composite FKs from menu_items / inventory_items
  unique (business_id, id)
);

create index categories_business_id_idx on public.categories (business_id);

-- Menu items ---------------------------------------------------------------

create table public.menu_items (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses (id) on delete cascade,
  name                  text not null,
  price                 numeric(12, 2) not null check (price >= 0),
  category_id           uuid,
  image_url             text,
  available             boolean not null default true,
  requires_kitchen_prep boolean not null default false,
  tax_category          public.tax_category not null default 'standard',
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  foreign key (business_id, category_id)
    references public.categories (business_id, id) on delete set null,
  unique (business_id, name),
  unique (business_id, id)
);

create index menu_items_business_id_idx on public.menu_items (business_id);
create index menu_items_category_id_idx on public.menu_items (category_id);

-- Inventory items ----------------------------------------------------------
-- Ingredients, finished goods and merchandise share this table via stock_type.

create table public.inventory_items (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses (id) on delete cascade,
  name                text not null,
  category_id         uuid,
  stock_type          public.stock_type not null,
  base_unit           text not null,
  qty_on_hand         numeric(12, 3) not null default 0,
  low_stock_threshold numeric(12, 3) not null default 0 check (low_stock_threshold >= 0),
  unit_cost           numeric(12, 2) not null default 0 check (unit_cost >= 0),
  barcode             text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  foreign key (business_id, category_id)
    references public.categories (business_id, id) on delete set null,
  unique (business_id, name),
  unique (business_id, id)
);

create index inventory_items_business_id_idx on public.inventory_items (business_id);
create unique index inventory_items_business_barcode_key
  on public.inventory_items (business_id, barcode)
  where barcode is not null;

-- Recipe items -------------------------------------------------------------
-- Links a menu item to the inventory it consumes, qty in the item's base_unit.

create table public.recipe_items (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  menu_item_id      uuid not null,
  inventory_item_id uuid not null,
  qty               numeric(12, 3) not null check (qty > 0),
  foreign key (business_id, menu_item_id)
    references public.menu_items (business_id, id) on delete cascade,
  foreign key (business_id, inventory_item_id)
    references public.inventory_items (business_id, id) on delete restrict,
  unique (menu_item_id, inventory_item_id)
);

create index recipe_items_menu_item_id_idx on public.recipe_items (menu_item_id);
create index recipe_items_inventory_item_id_idx on public.recipe_items (inventory_item_id);
