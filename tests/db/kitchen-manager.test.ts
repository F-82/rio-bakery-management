import type { Client } from "pg";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  becomeAuthenticated,
  createOrder,
  resetRole,
  setActor,
  userId,
  withRollback,
} from "./_client";

const OWNER = "owner@riobakershut.lk";
const MANAGER = "manager@riobakershut.lk";
const BAKERY_STAFF = "bakery@riobakershut.lk";
const HOT_PLATE_STAFF = "hotplate@riobakershut.lk";

async function prepMenuItemId(c: Client): Promise<string> {
  const result = await c.query(
    "select id from public.menu_items where business_id = $1 and available and requires_kitchen_prep order by sort_order, id limit 1",
    [BUSINESS_ID],
  );
  if (!result.rows[0]) throw new Error("staging needs at least one available prep item");
  return result.rows[0].id as string;
}

async function counterId(c: Client, kind: "bakery" | "hot_plate"): Promise<string> {
  const result = await c.query(
    "select id from public.counters where business_id = $1 and kind = $2 and active limit 1",
    [BUSINESS_ID, kind],
  );
  return result.rows[0].id as string;
}

describe("kitchen preparation queue", () => {
  it("marks prep orders pending and lets hot-plate staff clear them without changing revenue status", async () => {
    await withRollback(async (c) => {
      const ownerId = await userId(c, OWNER);
      const hotPlateId = await userId(c, HOT_PLATE_STAFF);
      await setActor(c, ownerId);

      const order = await createOrder(c, {
        counter_id: await counterId(c, "bakery"),
        items: [{ menu_item_id: await prepMenuItemId(c), qty: 1 }],
      });

      const before = await c.query(
        "select status, prep_status, prepared_at from public.orders where id = $1",
        [order.order_id],
      );
      expect(before.rows[0]).toMatchObject({
        status: "completed",
        prep_status: "pending",
        prepared_at: null,
      });

      await becomeAuthenticated(c, hotPlateId);
      const visible = await c.query("select id from public.orders where id = $1", [order.order_id]);
      expect(visible.rows).toHaveLength(1);
      await c.query("select public.mark_order_prepared($1)", [order.order_id]);

      await resetRole(c);
      const after = await c.query(
        "select status, prep_status, prepared_at, prepared_by from public.orders where id = $1",
        [order.order_id],
      );
      expect(after.rows[0].status).toBe("completed");
      expect(after.rows[0].prep_status).toBe("prepared");
      expect(after.rows[0].prepared_at).not.toBeNull();
      expect(after.rows[0].prepared_by).toBe(hotPlateId);
    });
  });

  it("does not let bakery staff clear kitchen orders", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const order = await createOrder(c, {
        items: [{ menu_item_id: await prepMenuItemId(c), qty: 1 }],
      });

      await becomeAuthenticated(c, await userId(c, BAKERY_STAFF));
      await expect(
        c.query("select public.mark_order_prepared($1)", [order.order_id]),
      ).rejects.toThrow(/not authorized/);
    });
  });
});

describe("manager permissions", () => {
  it("lets managers add business expenses while staff remain blocked", async () => {
    await withRollback(async (c) => {
      const managerId = await userId(c, MANAGER);
      await becomeAuthenticated(c, managerId);
      const inserted = await c.query(
        "insert into public.expenses (business_id, category, amount, created_by) values ($1, 'Manager test', 10, $2) returning id",
        [BUSINESS_ID, managerId],
      );
      expect(inserted.rows).toHaveLength(1);
      const businessUpdate = await c.query(
        "update public.businesses set name = name where id = $1 returning id",
        [BUSINESS_ID],
      );
      expect(businessUpdate.rows).toHaveLength(1);
      const settingsUpdate = await c.query(
        "update public.settings set value = value where business_id = $1 returning key",
        [BUSINESS_ID],
      );
      expect(settingsUpdate.rowCount).toBeGreaterThan(0);

      await resetRole(c);
      await becomeAuthenticated(c, await userId(c, BAKERY_STAFF));
      await expect(
        c.query(
          "insert into public.expenses (business_id, category, amount) values ($1, 'Blocked', 10)",
          [BUSINESS_ID],
        ),
      ).rejects.toThrow();
    });
  });
});
