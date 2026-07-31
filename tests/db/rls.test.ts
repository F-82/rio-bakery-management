import type { Client } from "pg";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  becomeAnon,
  becomeAuthenticated,
  menuItemId,
  resetRole,
  userId,
  withRollback,
} from "./_client";

const OWNER = "owner@riobakershut.lk";
const BAKERY_STAFF = "bakery@riobakershut.lk";

async function counterId(c: Client, name: string): Promise<string> {
  const r = await c.query("select id from public.counters where business_id = $1 and name = $2", [
    BUSINESS_ID,
    name,
  ]);
  return r.rows[0].id as string;
}

async function createOrderAs(
  c: Client,
  uid: string,
  payload: Record<string, unknown>,
): Promise<string> {
  await c.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: uid }),
  ]);
  const r = await c.query("select public.create_order($1::jsonb) as res", [
    JSON.stringify(payload),
  ]);
  return (r.rows[0].res as { order_id: string }).order_id;
}

describe("RLS — expenses", () => {
  it("staff cannot read or write expenses; owner can", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);
      await c.query(
        "insert into public.expenses (business_id, category, amount, created_by) values ($1, 'Rent', 50000, $2)",
        [BUSINESS_ID, owner],
      );

      // Staff: the row is invisible and inserts are rejected.
      await becomeAuthenticated(c, staff);
      const staffSel = await c.query("select * from public.expenses");
      expect(staffSel.rows.length).toBe(0);
      // A rejected write aborts the transaction, so guard it with a savepoint.
      await c.query("savepoint bad_insert");
      await expect(
        c.query("insert into public.expenses (business_id, category, amount) values ($1, 'X', 1)", [
          BUSINESS_ID,
        ]),
      ).rejects.toThrow();
      await c.query("rollback to savepoint bad_insert");

      // Owner: sees the expense (positive control).
      await resetRole(c);
      await becomeAuthenticated(c, owner);
      const ownerSel = await c.query("select category, amount from public.expenses");
      expect(ownerSel.rows.length).toBe(1);
      expect(ownerSel.rows[0].category).toBe("Rent");
    });
  });
});

describe("RLS — orders scoped by counter", () => {
  it("staff cannot read another counter's orders, but can read their own today", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);
      const bakery = await counterId(c, "Bakery");
      const hotPlate = await counterId(c, "Hot Plate");
      const kottu = await menuItemId(c, "Chicken Kottu");
      const bun = await menuItemId(c, "Fish Bun");

      const hotOrder = await createOrderAs(c, owner, {
        counter_id: hotPlate,
        items: [{ menu_item_id: kottu, qty: 1 }],
      });
      const bakeryOrder = await createOrderAs(c, owner, {
        counter_id: bakery,
        items: [{ menu_item_id: bun, qty: 1 }],
      });

      await becomeAuthenticated(c, staff);
      const otherCounter = await c.query("select id from public.orders where id = $1", [hotOrder]);
      expect(otherCounter.rows.length).toBe(0);
      const ownCounter = await c.query("select id from public.orders where id = $1", [bakeryOrder]);
      expect(ownCounter.rows.length).toBe(1);

      // Staff also cannot read the stock ledger, even for their own order.
      const ledger = await c.query("select * from public.stock_movements");
      expect(ledger.rows.length).toBe(0);
    });
  });
});

describe("RLS — cross-business isolation", () => {
  it("a user cannot read another business's rows", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const otherBiz = (
        await c.query("insert into public.businesses (name) values ('Other Biz') returning id")
      ).rows[0].id;
      const otherCat = (
        await c.query(
          "insert into public.categories (business_id, name, scope) values ($1, 'Cat B', 'menu') returning id",
          [otherBiz],
        )
      ).rows[0].id;
      const otherItem = (
        await c.query(
          "insert into public.menu_items (business_id, name, price, category_id, main_category) values ($1, 'Secret B Item', 100, $2, 'bakery') returning id",
          [otherBiz, otherCat],
        )
      ).rows[0].id;

      await becomeAuthenticated(c, owner);
      const foreign = await c.query("select id from public.menu_items where id = $1", [otherItem]);
      expect(foreign.rows.length).toBe(0);
      // Positive control: own business rows are visible.
      const own = await c.query("select count(*)::int as n from public.menu_items");
      expect(own.rows[0].n).toBeGreaterThan(0);
    });
  });
});

describe("RLS — order creation still works via the RPC", () => {
  it("a staff member can create an order and read it back", async () => {
    await withRollback(async (c) => {
      const staff = await userId(c, BAKERY_STAFF);
      const bun = await menuItemId(c, "Fish Bun");
      await becomeAuthenticated(c, staff);
      const r = await c.query("select public.create_order($1::jsonb) as res", [
        JSON.stringify({ items: [{ menu_item_id: bun, qty: 1 }] }),
      ]);
      const orderId = (r.rows[0].res as { order_id: string }).order_id;
      const sel = await c.query("select id from public.orders where id = $1", [orderId]);
      expect(sel.rows.length).toBe(1);
    });
  });
});

describe("RLS — coverage", () => {
  it("every table in public has row level security enabled", async () => {
    await withRollback(async (c) => {
      const r = await c.query(
        "select tablename from pg_tables where schemaname = 'public' and rowsecurity = false order by tablename",
      );
      expect(r.rows.map((x) => x.tablename)).toEqual([]);
    });
  });

  it("a logged-out (anon) user reads nothing", async () => {
    await withRollback(async (c) => {
      await becomeAnon(c);
      const m = await c.query("select id from public.menu_items limit 1");
      expect(m.rows.length).toBe(0);
    });
  });
});
