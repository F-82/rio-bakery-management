import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  createOrder,
  inventoryQtyMap,
  menuItemId,
  setActor,
  userId,
  withRollback,
} from "./_client";

const OWNER = "owner@riobakershut.lk";

async function inventoryId(c: import("pg").Client, name: string): Promise<string> {
  const r = await c.query(
    "select id from public.inventory_items where business_id = $1 and name = $2",
    [BUSINESS_ID, name],
  );
  return r.rows[0].id as string;
}

describe("create_order — pricing & snapshots", () => {
  it("computes totals server-side and ignores client-supplied prices", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const kottu = await menuItemId(c, "Chicken Kottu"); // 850
      const bun = await menuItemId(c, "Fish Bun"); // 120
      const res = await createOrder(c, {
        items: [
          { menu_item_id: kottu, qty: 2, unit_price: 999999, price: 999999, line_total: 999999 },
          { menu_item_id: bun, qty: 3, unit_price: 1 },
        ],
      });
      expect(Number(res.subtotal)).toBe(2060);
      expect(Number(res.total)).toBe(2060);

      const items = await c.query(
        "select name_snapshot, unit_price, line_total from public.order_items where order_id = $1 order by name_snapshot",
        [res.order_id],
      );
      const kottuRow = items.rows.find((r) => r.name_snapshot === "Chicken Kottu");
      const bunRow = items.rows.find((r) => r.name_snapshot === "Fish Bun");
      expect(Number(kottuRow.unit_price)).toBe(850);
      expect(Number(kottuRow.line_total)).toBe(1700);
      expect(Number(bunRow.unit_price)).toBe(120);
      expect(Number(bunRow.line_total)).toBe(360);
    });
  });

  it("snapshots name, price, prep flag and tax category onto the line", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const kottu = await menuItemId(c, "Chicken Kottu");
      const res = await createOrder(c, { items: [{ menu_item_id: kottu, qty: 1 }] });
      // Renaming/repricing the menu item afterwards must not change the line.
      await c.query("update public.menu_items set name = 'RENAMED', price = 99999 where id = $1", [
        kottu,
      ]);
      const oi = await c.query(
        "select name_snapshot, unit_price, requires_kitchen_prep, tax_category from public.order_items where order_id = $1",
        [res.order_id],
      );
      expect(oi.rows[0].name_snapshot).toBe("Chicken Kottu");
      expect(Number(oi.rows[0].unit_price)).toBe(850);
      expect(oi.rows[0].requires_kitchen_prep).toBe(true);
      expect(oi.rows[0].tax_category).toBe("standard");
    });
  });
});

describe("create_order — kitchen tickets", () => {
  it("emits no kitchen ticket when no line requires prep", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const bun = await menuItemId(c, "Fish Bun"); // prep = false
      const res = await createOrder(c, { items: [{ menu_item_id: bun, qty: 1 }] });
      expect(res.kitchen_ticket).toBe(false);
      const jobs = await c.query(
        "select target from public.print_jobs where order_id = $1",
        [res.order_id],
      );
      expect(jobs.rows.map((r) => r.target)).toEqual(["customer_receipt"]);
    });
  });

  it("mixed order → 1 receipt + 1 KOT with only prep lines and no prices", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const kottu = await menuItemId(c, "Chicken Kottu"); // prep
      const bun = await menuItemId(c, "Fish Bun"); // no prep
      const coffee = await menuItemId(c, "Milk Coffee"); // prep
      const res = await createOrder(c, {
        items: [
          { menu_item_id: kottu, qty: 1 },
          { menu_item_id: bun, qty: 1 },
          { menu_item_id: coffee, qty: 1 },
        ],
      });
      expect(res.kitchen_ticket).toBe(true);

      const jobs = await c.query(
        "select target, payload from public.print_jobs where order_id = $1",
        [res.order_id],
      );
      expect(jobs.rows.map((r) => r.target).sort()).toEqual(["customer_receipt", "kitchen_ticket"]);

      const receipt = jobs.rows.find((r) => r.target === "customer_receipt").payload;
      const kot = jobs.rows.find((r) => r.target === "kitchen_ticket").payload;

      expect(receipt.items.length).toBe(3);
      expect(kot.items.map((i: { name: string }) => i.name).sort()).toEqual([
        "Chicken Kottu",
        "Milk Coffee",
      ]);
      expect(kot.order_number).toBe(res.order_number);
      // No price fields anywhere in the KOT payload.
      expect(JSON.stringify(kot)).not.toMatch(/unit_price|line_total|"price"|subtotal|"total"/);
      for (const i of kot.items) {
        expect(i).not.toHaveProperty("unit_price");
        expect(i).not.toHaveProperty("line_total");
      }
    });
  });
});

describe("create_order — stock ledger", () => {
  it("allows negative stock and returns a warning instead of erroring", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const kottuRoti = await inventoryId(c, "Kottu Roti");
      await c.query("update public.inventory_items set qty_on_hand = 100 where id = $1", [
        kottuRoti,
      ]);
      const kottu = await menuItemId(c, "Chicken Kottu"); // needs 250 Kottu Roti
      const res = await createOrder(c, { items: [{ menu_item_id: kottu, qty: 1 }] });

      const q = await c.query("select qty_on_hand from public.inventory_items where id = $1", [
        kottuRoti,
      ]);
      expect(Number(q.rows[0].qty_on_hand)).toBe(-150);
      const warn = res.low_stock_warnings.find((w) => w.inventory_item_id === kottuRoti);
      expect(warn).toBeTruthy();
      expect(warn!.negative).toBe(true);
    });
  });

  it("blocks the sale when negative stock is disabled for the business", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      await c.query(
        "update public.settings set value = 'false'::jsonb where business_id = $1 and key = 'inventory.allow_negative_stock'",
        [BUSINESS_ID],
      );
      const kottuRoti = await inventoryId(c, "Kottu Roti");
      await c.query("update public.inventory_items set qty_on_hand = 100 where id = $1", [
        kottuRoti,
      ]);
      const kottu = await menuItemId(c, "Chicken Kottu");
      await expect(
        createOrder(c, { items: [{ menu_item_id: kottu, qty: 1 }] }),
      ).rejects.toThrow(/insufficient stock/);
    });
  });

  it("qty_on_hand equals initial + sum(deltas) after a random sequence", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const before = await inventoryQtyMap(c);
      const menus = [
        "Chicken Kottu",
        "Fish Bun",
        "Egg Fried Rice",
        "Milk Coffee",
        "Croissant",
        "Vegetable Kottu",
      ];
      const created: string[] = [];
      for (let i = 0; i < 10; i++) {
        const name = menus[Math.floor(Math.random() * menus.length)];
        const id = await menuItemId(c, name);
        const qty = 1 + Math.floor(Math.random() * 3);
        const res = await createOrder(c, { items: [{ menu_item_id: id, qty }] });
        created.push(res.order_id);
      }
      // Void two of them to exercise reversals in the ledger.
      await c.query("select public.void_order($1, $2)", [created[2], "random-seq void"]);
      await c.query("select public.void_order($1, $2)", [created[5], "random-seq void"]);

      const rows = await c.query(
        `select i.id,
                i.qty_on_hand,
                coalesce((select sum(m.delta) from public.stock_movements m
                          where m.inventory_item_id = i.id), 0) as sum_delta
         from public.inventory_items i where i.business_id = $1`,
        [BUSINESS_ID],
      );
      for (const row of rows.rows) {
        const expected = before.get(row.id)! + Number(row.sum_delta);
        expect(Number(row.qty_on_hand)).toBeCloseTo(expected, 3);
      }
    });
  });
});

describe("void_order", () => {
  it("reverses stock movements exactly and marks the order voided", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const before = await inventoryQtyMap(c);
      const kottu = await menuItemId(c, "Chicken Kottu");
      const res = await createOrder(c, { items: [{ menu_item_id: kottu, qty: 2 }] });

      await c.query("select public.void_order($1, $2)", [res.order_id, "mistake"]);

      const after = await inventoryQtyMap(c);
      for (const [id, qty] of before) {
        expect(after.get(id)).toBeCloseTo(qty, 3);
      }
      const s = await c.query(
        "select coalesce(sum(delta), 0) as s from public.stock_movements where ref_order_id = $1",
        [res.order_id],
      );
      expect(Number(s.rows[0].s)).toBe(0);

      const o = await c.query(
        "select status, voided_at, void_reason from public.orders where id = $1",
        [res.order_id],
      );
      expect(o.rows[0].status).toBe("voided");
      expect(o.rows[0].voided_at).toBeTruthy();
      expect(o.rows[0].void_reason).toBe("mistake");

      await expect(
        c.query("select public.void_order($1, $2)", [res.order_id, "again"]),
      ).rejects.toThrow(/already voided/);
    });
  });
});

describe("daily_seq", () => {
  it("assigns a distinct, increasing sequence to sequential orders", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const bun = await menuItemId(c, "Fish Bun");
      const seqs: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await createOrder(c, { items: [{ menu_item_id: bun, qty: 1 }] });
        seqs.push(res.daily_seq);
      }
      expect(new Set(seqs).size).toBe(seqs.length);
      for (let i = 1; i < seqs.length; i++) expect(seqs[i]).toBeGreaterThan(seqs[i - 1]);
    });
  });
});
