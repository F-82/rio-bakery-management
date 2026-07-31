import { writeFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.SUPABASE_POOLER_URL ?? process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("Set SUPABASE_POOLER_URL or SUPABASE_DB_URL before generating the menu list.");
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const { rows } = await client.query(`
    select
      item.menu_number,
      item.name,
      item.price,
      item.available,
      item.main_category,
      item.availability_schedule,
      coalesce(category.name, 'Uncategorized') as category
    from public.menu_items as item
    left join public.categories as category on category.id = item.category_id
    order by item.menu_number
  `);

  const lines = [
    "# Menu item numbers",
    "",
    `Complete menu catalog: ${rows.length} items. Numbers are permanent and do not restart by category or schedule.`,
    "",
    "| No. | Item | Main menu | Schedule | Subcategory | Price (LKR) | Available |",
    "| ---: | --- | --- | --- | --- | ---: | :---: |",
    ...rows.map((row) => {
      const escapeCell = (value) => String(value).replaceAll("|", "\\|").trim();
      const mainMenu = row.main_category.replaceAll("_", " ");
      const schedule = row.availability_schedule.replaceAll("_", "–");
      const price = Number(row.price).toFixed(2);

      return `| ${row.menu_number} | ${escapeCell(row.name)} | ${mainMenu} | ${schedule} | ${escapeCell(row.category)} | ${price} | ${row.available ? "Yes" : "No"} |`;
    }),
    "",
  ];

  await writeFile("MENU_ITEM_NUMBERS.md", lines.join("\n"), "utf8");
} finally {
  await client.end();
}
