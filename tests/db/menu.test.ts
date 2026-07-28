import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  becomeAuthenticated,
  createOrder,
  menuItemId,
  resetRole,
  setActor,
  userId,
  withRollback,
} from "./_client";

const OWNER = "owner@riobakershut.lk";
const BAKERY_STAFF = "bakery@riobakershut.lk";

async function inventoryId(c: import("pg").Client, name: string): Promise<string> {
  const r = await c.query(
    "select id from public.inventory_items where business_id = $1 and name = $2",
    [BUSINESS_ID, name],
  );
  return r.rows[0].id as string;
}

describe("menu_items — requires_kitchen_prep toggle", () => {
  it("changes kitchen ticket emission on the next order (STEPS.md §11 done-when)", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const fishBun = await menuItemId(c, "Fish Bun");

      // Baseline: seeded false, no kitchen ticket.
      const before = await createOrder(c, { items: [{ menu_item_id: fishBun, qty: 1 }] });
      expect(before.kitchen_ticket).toBe(false);

      // Flip the flag — the only thing the menu CRUD screen changes.
      await c.query("update public.menu_items set requires_kitchen_prep = true where id = $1", [fishBun]);

      const after = await createOrder(c, { items: [{ menu_item_id: fishBun, qty: 1 }] });
      expect(after.kitchen_ticket).toBe(true);

      // And back off again — the toggle isn't one-directional.
      await c.query("update public.menu_items set requires_kitchen_prep = false where id = $1", [fishBun]);
      const restored = await createOrder(c, { items: [{ menu_item_id: fishBun, qty: 1 }] });
      expect(restored.kitchen_ticket).toBe(false);
    });
  });
});

describe("RLS — menu_items / recipe_items writes", () => {
  it("staff cannot insert or update menu_items; owner/manager can", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);

      await becomeAuthenticated(c, staff);
      await c.query("savepoint bad_insert");
      await expect(
        c.query(
          "insert into public.menu_items (business_id, name, price) values ($1, 'Staff Item', 100) returning id",
          [BUSINESS_ID],
        ),
      ).rejects.toThrow();
      await c.query("rollback to savepoint bad_insert");

      const bun = await menuItemId(c, "Fish Bun");
      await c.query("savepoint bad_update");
      await c.query("update public.menu_items set price = 999 where id = $1", [bun]);
      // RLS silently affects zero rows rather than throwing — verify nothing changed.
      const staffRead = await c.query("select price from public.menu_items where id = $1", [bun]);
      expect(Number(staffRead.rows[0].price)).not.toBe(999);
      await c.query("rollback to savepoint bad_update");

      await resetRole(c);
      await becomeAuthenticated(c, owner);
      const inserted = await c.query(
        "insert into public.menu_items (business_id, name, price) values ($1, 'Owner Item', 100) returning id",
        [BUSINESS_ID],
      );
      expect(inserted.rows.length).toBe(1);
    });
  });

  it("staff cannot write recipe_items; owner/manager can replace a menu item's recipe", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);
      const bun = await menuItemId(c, "Fish Bun");
      const flour = await inventoryId(c, "Flour");

      await becomeAuthenticated(c, staff);
      await c.query("savepoint bad_recipe_insert");
      await expect(
        c.query(
          "insert into public.recipe_items (business_id, menu_item_id, inventory_item_id, qty) values ($1, $2, $3, 10)",
          [BUSINESS_ID, bun, flour],
        ),
      ).rejects.toThrow();
      await c.query("rollback to savepoint bad_recipe_insert");

      // Owner replaces the recipe outright — delete-all then insert-new, the
      // same shape replaceMenuItemRecipe (lib/actions/menu.ts) performs.
      await resetRole(c);
      await becomeAuthenticated(c, owner);
      const fish = await inventoryId(c, "Fish");
      await c.query("delete from public.recipe_items where menu_item_id = $1", [bun]);
      await c.query(
        "insert into public.recipe_items (business_id, menu_item_id, inventory_item_id, qty) values ($1, $2, $3, 999)",
        [BUSINESS_ID, bun, fish],
      );
      const lines = await c.query(
        "select inventory_item_id, qty from public.recipe_items where menu_item_id = $1",
        [bun],
      );
      expect(lines.rows).toEqual([{ inventory_item_id: fish, qty: "999.000" }]);
    });
  });

  it("rejects a non-positive recipe quantity", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const bun = await menuItemId(c, "Fish Bun");
      const flour = await inventoryId(c, "Flour");
      await expect(
        c.query(
          "insert into public.recipe_items (business_id, menu_item_id, inventory_item_id, qty) values ($1, $2, $3, 0)",
          [BUSINESS_ID, bun, flour],
        ),
      ).rejects.toThrow();
    });
  });
});
