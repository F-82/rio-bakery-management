import type { Client } from "pg";
import { describe, expect, it } from "vitest";
import { BUSINESS_ID, setActor, userId, withRollback } from "./_client";

const OWNER = "owner@riobakershut.lk";
const BAKERY_STAFF = "bakery@riobakershut.lk";

async function inventoryId(c: Client, name: string): Promise<string> {
  const r = await c.query(
    "select id from public.inventory_items where business_id = $1 and name = $2",
    [BUSINESS_ID, name],
  );
  return r.rows[0].id as string;
}

type MovementResult = { inventory_item_id: string; delta: string; qty_on_hand: string };

async function recordMovement(
  c: Client,
  payload: Record<string, unknown>,
): Promise<MovementResult> {
  const r = await c.query("select public.record_stock_movement($1::jsonb) as res", [
    JSON.stringify(payload),
  ]);
  return r.rows[0].res as MovementResult;
}

describe("record_stock_movement — sign conventions", () => {
  it("purchase adds the entered qty", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await c.query("update public.inventory_items set qty_on_hand = 1000 where id = $1", [flour]);
      const res = await recordMovement(c, { inventory_item_id: flour, reason: "purchase", qty: 500 });
      expect(Number(res.delta)).toBe(500);
      expect(Number(res.qty_on_hand)).toBe(1500);
    });
  });

  it("wastage subtracts the entered qty", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await c.query("update public.inventory_items set qty_on_hand = 1000 where id = $1", [flour]);
      const res = await recordMovement(c, { inventory_item_id: flour, reason: "wastage", qty: 200, note: "spoiled" });
      expect(Number(res.delta)).toBe(-200);
      expect(Number(res.qty_on_hand)).toBe(800);
    });
  });

  it("manual_adjustment applies the signed delta as-is", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await c.query("update public.inventory_items set qty_on_hand = 1000 where id = $1", [flour]);
      const res = await recordMovement(c, { inventory_item_id: flour, reason: "manual_adjustment", delta: -50 });
      expect(Number(res.delta)).toBe(-50);
      expect(Number(res.qty_on_hand)).toBe(950);
    });
  });

  it("stocktake computes the delta from counted vs current, under a row lock", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await c.query("update public.inventory_items set qty_on_hand = 1000 where id = $1", [flour]);
      const res = await recordMovement(c, { inventory_item_id: flour, reason: "stocktake", counted_qty: 730 });
      expect(Number(res.delta)).toBe(-270);
      expect(Number(res.qty_on_hand)).toBe(730);
    });
  });

  it("negative stock is allowed and not clamped to zero", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await c.query("update public.inventory_items set qty_on_hand = 50 where id = $1", [flour]);
      const res = await recordMovement(c, { inventory_item_id: flour, reason: "wastage", qty: 200 });
      expect(Number(res.qty_on_hand)).toBe(-150);
    });
  });
});

describe("record_stock_movement — validation", () => {
  it("rejects a missing/zero delta for manual_adjustment", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await expect(
        recordMovement(c, { inventory_item_id: flour, reason: "manual_adjustment", delta: 0 }),
      ).rejects.toThrow(/non-zero/);
    });
  });

  it("rejects a non-positive qty for purchase/wastage", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await expect(
        recordMovement(c, { inventory_item_id: flour, reason: "purchase", qty: -5 }),
      ).rejects.toThrow(/positive/);
    });
  });

  it("rejects an unknown reason", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await expect(
        recordMovement(c, { inventory_item_id: flour, reason: "order_deduction", qty: 5 }),
      ).rejects.toThrow(/reason must be/);
    });
  });

  it("rejects an item from another business", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const otherBiz = (
        await c.query("insert into public.businesses (name) values ('Other Biz') returning id")
      ).rows[0].id;
      const otherItem = (
        await c.query(
          "insert into public.inventory_items (business_id, name, stock_type, base_unit) values ($1, 'Secret Sugar', 'ingredient', 'g') returning id",
          [otherBiz],
        )
      ).rows[0].id;
      await setActor(c, owner);
      await expect(
        recordMovement(c, { inventory_item_id: otherItem, reason: "purchase", qty: 5 }),
      ).rejects.toThrow(/not in business/);
    });
  });
});

describe("record_stock_movement — authorization", () => {
  it("staff cannot record a stock movement", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, BAKERY_STAFF));
      const flour = await inventoryId(c, "Flour");
      await expect(
        recordMovement(c, { inventory_item_id: flour, reason: "purchase", qty: 5 }),
      ).rejects.toThrow(/not authorized/);
    });
  });
});

describe("record_stock_movement — ledger integrity", () => {
  it("every movement appends exactly one row and qty_on_hand equals the running sum of deltas", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      const before = (
        await c.query("select qty_on_hand from public.inventory_items where id = $1", [flour])
      ).rows[0].qty_on_hand;

      const ops: Array<Record<string, unknown>> = [
        { inventory_item_id: flour, reason: "purchase", qty: 300 },
        { inventory_item_id: flour, reason: "wastage", qty: 40, note: "dropped a bag" },
        { inventory_item_id: flour, reason: "manual_adjustment", delta: -15 },
        { inventory_item_id: flour, reason: "stocktake", counted_qty: Number(before) + 100 },
      ];
      for (const op of ops) await recordMovement(c, op);

      const after = await c.query("select qty_on_hand from public.inventory_items where id = $1", [flour]);
      const sum = await c.query(
        "select coalesce(sum(delta), 0) as s from public.stock_movements where inventory_item_id = $1",
        [flour],
      );
      const countRows = await c.query(
        "select count(*)::int as n from public.stock_movements where inventory_item_id = $1 and reason in ('purchase','wastage','manual_adjustment','stocktake')",
        [flour],
      );
      expect(countRows.rows[0].n).toBe(4);
      expect(Number(after.rows[0].qty_on_hand)).toBeCloseTo(Number(before) + Number(sum.rows[0].s), 3);
    });
  });

  it("stock_movements stays append-only even for manual entries", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const flour = await inventoryId(c, "Flour");
      await recordMovement(c, { inventory_item_id: flour, reason: "purchase", qty: 10 });
      const row = await c.query(
        "select id from public.stock_movements where inventory_item_id = $1 order by created_at desc limit 1",
        [flour],
      );
      await expect(
        c.query("update public.stock_movements set delta = 999 where id = $1", [row.rows[0].id]),
      ).rejects.toThrow(/append-only/);
    });
  });
});
