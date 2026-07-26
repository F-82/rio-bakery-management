import { describe, expect, it } from "vitest";
import {
  cleanupCommitted,
  createOrderCommitted,
  inventoryQtyMap,
  menuItemId,
  newClient,
  userId,
  type CreateOrderResult,
} from "./_client";

const OWNER = "owner@riobakershut.lk";

/** Collect fulfilled results, keep created order ids even if some calls fail. */
function partition(results: PromiseSettledResult<CreateOrderResult>[]) {
  const ok: CreateOrderResult[] = [];
  const errors: unknown[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") ok.push(r.value);
    else errors.push(r.reason);
  }
  return { ok, errors };
}

describe("concurrency", () => {
  it("concurrent create_order on the same inventory item leaves correct stock", async () => {
    const c = newClient();
    await c.connect();
    const uid = await userId(c, OWNER);
    const kottu = await menuItemId(c, "Chicken Kottu");
    const snapshot = await inventoryQtyMap(c);
    const recipe = await c.query(
      "select inventory_item_id, qty from public.recipe_items where menu_item_id = $1",
      [kottu],
    );

    const N = 8;
    const results = await Promise.allSettled(
      Array.from({ length: N }, () =>
        createOrderCommitted(uid, { items: [{ menu_item_id: kottu, qty: 1 }] }),
      ),
    );
    const { ok, errors } = partition(results);

    try {
      expect(errors).toEqual([]);
      expect(ok.length).toBe(N);

      const after = await inventoryQtyMap(c);
      for (const row of recipe.rows) {
        const iid = row.inventory_item_id as string;
        const expected = snapshot.get(iid)! - N * Number(row.qty);
        expect(after.get(iid)).toBeCloseTo(expected, 3);
      }
      // Every concurrent order still got a distinct sequence number.
      const seqs = ok.map((r) => r.daily_seq);
      expect(new Set(seqs).size).toBe(N);
    } finally {
      await cleanupCommitted(
        ok.map((r) => r.order_id),
        snapshot,
      );
      await c.end().catch(() => {});
    }
  });

  it("daily_seq never duplicates under parallel inserts", async () => {
    const c = newClient();
    await c.connect();
    const uid = await userId(c, OWNER);
    const bun = await menuItemId(c, "Fish Bun");
    const snapshot = await inventoryQtyMap(c);

    const N = 12;
    const results = await Promise.allSettled(
      Array.from({ length: N }, () =>
        createOrderCommitted(uid, { items: [{ menu_item_id: bun, qty: 1 }] }),
      ),
    );
    const { ok, errors } = partition(results);

    try {
      expect(errors).toEqual([]);
      expect(ok.length).toBe(N);
      const seqs = ok.map((r) => r.daily_seq);
      expect(new Set(seqs).size).toBe(N);
      const numbers = ok.map((r) => r.order_number);
      expect(new Set(numbers).size).toBe(N);
    } finally {
      await cleanupCommitted(
        ok.map((r) => r.order_id),
        snapshot,
      );
      await c.end().catch(() => {});
    }
  });
});
