import { describe, expect, it } from "vitest";
import {
  availableMenuItem,
  BUSINESS_ID,
  createOrder,
  inventoryQtyMap,
  setActor,
  userId,
  withRollback,
} from "./_client";

const OWNER = "owner@riobakershut.lk";

describe("create_order — pricing & snapshots", () => {
  it("computes totals server-side and ignores client-supplied prices", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const item = await availableMenuItem(c);
      const res = await createOrder(c, {
        items: [
          {
            menu_item_id: item.id,
            qty: 2,
            unit_price: 999999,
            price: 999999,
            line_total: 999999,
          },
        ],
      });
      expect(Number(res.subtotal)).toBe(item.price * 2);
      expect(Number(res.total)).toBe(item.price * 2);

      const items = await c.query(
        "select name_snapshot, unit_price, line_total from public.order_items where order_id = $1",
        [res.order_id],
      );
      expect(items.rows[0].name_snapshot).toBe(item.name);
      expect(Number(items.rows[0].unit_price)).toBe(item.price);
      expect(Number(items.rows[0].line_total)).toBe(item.price * 2);
    });
  });

  it("snapshots name, price, prep flag and tax category onto the line", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const item = await availableMenuItem(c, { requiresKitchenPrep: true });
      const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty: 1 }] });
      // Renaming/repricing the menu item afterwards must not change the line.
      await c.query("update public.menu_items set name = 'RENAMED', price = 99999 where id = $1", [
        item.id,
      ]);
      const oi = await c.query(
        "select name_snapshot, unit_price, requires_kitchen_prep, tax_category from public.order_items where order_id = $1",
        [res.order_id],
      );
      expect(oi.rows[0].name_snapshot).toBe(item.name);
      expect(Number(oi.rows[0].unit_price)).toBe(item.price);
      expect(oi.rows[0].requires_kitchen_prep).toBe(item.requiresKitchenPrep);
      expect(oi.rows[0].tax_category).toBe(item.taxCategory);
    });
  });
});

describe("create_order — kitchen tickets", () => {
  it("emits no kitchen ticket when no line requires prep", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const item = await availableMenuItem(c, { requiresKitchenPrep: false });
      const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty: 1 }] });
      expect(res.kitchen_ticket).toBe(false);
      const jobs = await c.query("select target from public.print_jobs where order_id = $1", [
        res.order_id,
      ]);
      expect(jobs.rows.map((r) => r.target)).toEqual(["customer_receipt"]);
    });
  });

  it("mixed order → 1 receipt + 1 KOT with only prep lines and no prices", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const prepItem = await availableMenuItem(c, { requiresKitchenPrep: true });
      const counterItem = await availableMenuItem(c, { requiresKitchenPrep: false });
      const res = await createOrder(c, {
        items: [
          { menu_item_id: prepItem.id, qty: 1 },
          { menu_item_id: counterItem.id, qty: 1 },
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

      expect(receipt.items.length).toBe(2);
      expect(kot.items.map((i: { name: string }) => i.name)).toEqual([prepItem.name]);
      expect(kot.order_number).toBe(res.order_number);
      expect(kot.source).toBe("pos");
      // No price fields anywhere in the KOT payload.
      expect(JSON.stringify(kot)).not.toMatch(/unit_price|line_total|"price"|subtotal|"total"/);
      for (const i of kot.items) {
        expect(i).not.toHaveProperty("unit_price");
        expect(i).not.toHaveProperty("line_total");
      }
    });
  });

  it("includes dine-in or takeaway on the kitchen ticket", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const prepItem = await availableMenuItem(c, { requiresKitchenPrep: true });
      const res = await createOrder(c, {
        source: "takeaway",
        items: [{ menu_item_id: prepItem.id, qty: 1 }],
      });
      const job = await c.query(
        "select payload from public.print_jobs where order_id = $1 and target = 'kitchen_ticket'",
        [res.order_id],
      );

      expect(job.rows[0].payload.source).toBe("takeaway");
    });
  });
});

describe("create_order — stock ledger", () => {
  it("allows negative stock and returns a warning instead of erroring", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const item = await availableMenuItem(c, { withRecipe: true });
      const recipe = (
        await c.query(
          "select inventory_item_id, qty from public.recipe_items where menu_item_id = $1 order by inventory_item_id limit 1",
          [item.id],
        )
      ).rows[0] as { inventory_item_id: string; qty: string };
      await c.query("update public.inventory_items set qty_on_hand = 0 where id = $1", [
        recipe.inventory_item_id,
      ]);
      const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty: 1 }] });

      const q = await c.query("select qty_on_hand from public.inventory_items where id = $1", [
        recipe.inventory_item_id,
      ]);
      expect(Number(q.rows[0].qty_on_hand)).toBe(-Number(recipe.qty));
      const warn = res.low_stock_warnings.find(
        (w) => w.inventory_item_id === recipe.inventory_item_id,
      );
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
      const item = await availableMenuItem(c, { withRecipe: true });
      const recipe = (
        await c.query(
          "select inventory_item_id from public.recipe_items where menu_item_id = $1 order by inventory_item_id limit 1",
          [item.id],
        )
      ).rows[0] as { inventory_item_id: string };
      await c.query("update public.inventory_items set qty_on_hand = 0 where id = $1", [
        recipe.inventory_item_id,
      ]);
      await expect(createOrder(c, { items: [{ menu_item_id: item.id, qty: 1 }] })).rejects.toThrow(
        /insufficient stock/,
      );
    });
  });

  it("qty_on_hand equals initial + sum(deltas) after a random sequence", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const before = await inventoryQtyMap(c);
      const menus = (
        await c.query(
          "select id from public.menu_items where business_id = $1 and available and price > 0 order by id limit 6",
          [BUSINESS_ID],
        )
      ).rows as Array<{ id: string }>;
      const created: string[] = [];
      for (let i = 0; i < 10; i++) {
        const item = menus[i % menus.length];
        const qty = 1 + (i % 3);
        const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty }] });
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
      const item = await availableMenuItem(c, { withRecipe: true });
      const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty: 2 }] });

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
      const item = await availableMenuItem(c);
      const seqs: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await createOrder(c, { items: [{ menu_item_id: item.id, qty: 1 }] });
        seqs.push(res.daily_seq);
      }
      expect(new Set(seqs).size).toBe(seqs.length);
      for (let i = 1; i < seqs.length; i++) expect(seqs[i]).toBeGreaterThan(seqs[i - 1]);
    });
  });
});
