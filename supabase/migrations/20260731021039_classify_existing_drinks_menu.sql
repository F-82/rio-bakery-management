update public.menu_items m
set
  main_category = 'drinks',
  availability_schedule = 'all_days'
from public.categories c
where c.id = m.category_id
  and c.business_id = m.business_id
  and c.scope = 'menu'
  and c.name in ('Beverage', 'Mojito', 'Milkshake', 'Lassi');
