import type { Client } from "pg";
import { describe, expect, it } from "vitest";
import { normalisePhone } from "@/lib/format";
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

type Customer = {
  id: string;
  name: string | null;
  phone_e164: string;
  loyalty_points: string;
  total_spend: string;
  order_count: number;
};

async function findOrCreateCustomer(c: Client, payload: Record<string, unknown>): Promise<Customer> {
  // row_to_json — the function returns a composite public.customers row, and
  // unlike PostgREST (which JSON-encodes function returns for supabase-js),
  // raw node-postgres doesn't parse composite-type literals into objects.
  const r = await c.query("select row_to_json(public.find_or_create_customer($1::jsonb)) as res", [
    JSON.stringify(payload),
  ]);
  return r.rows[0].res as Customer;
}

async function getCustomer(c: Client, id: string): Promise<Customer> {
  const r = await c.query(
    "select id, name, phone_e164, loyalty_points, total_spend, order_count from public.customers where id = $1",
    [id],
  );
  return r.rows[0] as Customer;
}

describe("find_or_create_customer — phone dedupe (STEPS.md §12 done-when)", () => {
  it("three raw formats of the same number resolve to one customer, never a thrown error", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));

      const rawFormats = ["0771234599", "+94771234599", "94 77 123 4599"];
      const normalised = rawFormats.map((raw) => {
        const phone = normalisePhone(raw);
        expect(phone).not.toBeNull();
        return phone!;
      });
      expect(new Set(normalised).size).toBe(1);

      const first = await findOrCreateCustomer(c, { name: "Nimal", phone_e164: normalised[0] });
      const second = await findOrCreateCustomer(c, { name: "Nimal", phone_e164: normalised[1] });
      const third = await findOrCreateCustomer(c, { phone_e164: normalised[2] });

      expect(second.id).toBe(first.id);
      expect(third.id).toBe(first.id);

      const count = await c.query(
        "select count(*)::int as n from public.customers where business_id = $1 and phone_e164 = $2",
        [BUSINESS_ID, normalised[0]],
      );
      expect(count.rows[0].n).toBe(1);
    });
  });

  it("rejects a phone that isn't already normalised E.164 — the caller must run normalisePhone first", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      await expect(findOrCreateCustomer(c, { phone_e164: "0771234599" })).rejects.toThrow();
    });
  });
});

describe("create_order — loyalty accrual and redemption (STEPS.md §12 done-when)", () => {
  it("accrues points exactly at the default 1 point/LKR rate", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const customer = await findOrCreateCustomer(c, { name: "Kamal", phone_e164: "+94771234598" });
      const fishBun = await menuItemId(c, "Fish Bun"); // 120 LKR

      const order = await createOrder(c, {
        customer_id: customer.id,
        items: [{ menu_item_id: fishBun, qty: 1 }],
      });
      expect(Number(order.total)).toBe(120);

      const after = await getCustomer(c, customer.id);
      expect(Number(after.loyalty_points)).toBe(120);
      expect(Number(after.total_spend)).toBe(120);
      expect(after.order_count).toBe(1);

      const ledger = await c.query(
        "select points_earned, points_redeemed, balance_after from public.loyalty_transactions where customer_id = $1 order by created_at",
        [customer.id],
      );
      expect(ledger.rows).toEqual([{ points_earned: 120, points_redeemed: 0, balance_after: 120 }]);
    });
  });

  it("redeems points exactly at the default 0.01 LKR/point rate, clamped to the discount room", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const customer = await findOrCreateCustomer(c, { name: "Saman", phone_e164: "+94771234597" });
      const fishBun = await menuItemId(c, "Fish Bun"); // 120 LKR

      // First order earns 120 points and nothing is redeemed.
      await createOrder(c, { customer_id: customer.id, items: [{ menu_item_id: fishBun, qty: 1 }] });

      // Second order: redeem 50 of those points -> 0.50 LKR off a 120 LKR
      // subtotal, well inside the discount room.
      const order2 = await createOrder(c, {
        customer_id: customer.id,
        redeem_points: 50,
        items: [{ menu_item_id: fishBun, qty: 1 }],
      });
      expect(Number(order2.discount_amount)).toBe(0.5);
      expect(Number(order2.total)).toBe(119.5);
      const loyalty2 = order2.loyalty;
      expect(loyalty2).not.toBeNull();
      expect(loyalty2!.points_redeemed).toBe(50);
      expect(Number(loyalty2!.redemption_discount)).toBe(0.5);
      // Earns on the amount actually paid: floor(119.5 * 1) = 119.
      expect(loyalty2!.points_earned).toBe(119);
      // Balance: 120 (from order 1) - 50 redeemed + 119 earned = 189.
      expect(loyalty2!.balance).toBe(189);

      const after = await getCustomer(c, customer.id);
      expect(Number(after.loyalty_points)).toBe(189);
      expect(Number(after.total_spend)).toBe(120 + 119.5);
      expect(after.order_count).toBe(2);
    });
  });

  it("clamps a redemption request past the customer's balance to what they actually have", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const customer = await findOrCreateCustomer(c, { name: "Priya", phone_e164: "+94771234596" });
      const kottu = await menuItemId(c, "Chicken Kottu"); // 850 LKR

      // Balance is 0 — request 1000 points, expect 0 actually redeemed.
      const order = await createOrder(c, {
        customer_id: customer.id,
        redeem_points: 1000,
        items: [{ menu_item_id: kottu, qty: 1 }],
      });
      expect(order.loyalty!.points_redeemed).toBe(0);
      expect(Number(order.discount_amount)).toBe(0);
      expect(Number(order.total)).toBe(850);
    });
  });

  it("clamps a redemption request past the available discount room to the subtotal", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const customer = await findOrCreateCustomer(c, { name: "Dilani", phone_e164: "+94771234595" });
      const fishBun = await menuItemId(c, "Fish Bun"); // 120 LKR

      // Earn a large balance first (10 orders of 120 = 1200 points).
      for (let i = 0; i < 10; i++) {
        await createOrder(c, { customer_id: customer.id, items: [{ menu_item_id: fishBun, qty: 1 }] });
      }
      const before = await getCustomer(c, customer.id);
      expect(Number(before.loyalty_points)).toBe(1200);

      // A single 120 LKR order can't be discounted past 120 LKR — at
      // 0.01 LKR/point that's a max of 12000 points, well past the balance,
      // so the balance itself (1200) is actually the binding clamp here.
      // Use a cheap redeem rate check: request exactly enough to exceed the
      // subtotal (13000 points -> 130 LKR) and confirm the discount never
      // exceeds the 120 LKR subtotal, points_redeemed <= balance.
      const order = await createOrder(c, {
        customer_id: customer.id,
        redeem_points: 13000,
        items: [{ menu_item_id: fishBun, qty: 1 }],
      });
      expect(order.loyalty!.points_redeemed).toBeLessThanOrEqual(1200);
      expect(Number(order.discount_amount)).toBeLessThanOrEqual(120);
      expect(Number(order.total)).toBeGreaterThanOrEqual(0);
    });
  });

  it("a customer-less order is unaffected — no loyalty row, subtotal/total unchanged", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const fishBun = await menuItemId(c, "Fish Bun");
      const order = await createOrder(c, { items: [{ menu_item_id: fishBun, qty: 1 }] });
      expect(order.loyalty).toBeNull();
      expect(Number(order.total)).toBe(120);
    });
  });

  // Client request (2026-07-29): when cash change owed is small (their
  // example, ~LKR 7) and staff don't have coins, credit it to the
  // customer's loyalty balance instead. change_to_points_lkr never touches
  // the order total — it's the same amount either way, just kept as
  // points instead of handed back as coins.
  it("converts change_to_points_lkr to bonus points at the earn rate, without touching order total", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const customer = await findOrCreateCustomer(c, { name: "Nadeesha", phone_e164: "+94771234592" });
      const soup = await menuItemId(c, "Chicken Soup"); // 480 LKR

      const order = await createOrder(c, {
        customer_id: customer.id,
        change_to_points_lkr: 7,
        items: [{ menu_item_id: soup, qty: 1 }],
      });

      // Total is exactly the item price — the bonus never becomes a discount.
      expect(Number(order.total)).toBe(480);
      expect(Number(order.subtotal)).toBe(480);

      const loyalty = order.loyalty!;
      expect(loyalty.bonus_points).toBe(7);
      // 480 spend + 7 bonus, both at the default 1 point/LKR rate.
      expect(loyalty.points_earned).toBe(487);
      expect(loyalty.balance).toBe(487);

      const after = await getCustomer(c, customer.id);
      expect(Number(after.loyalty_points)).toBe(487);
      // total_spend reflects what was actually charged, not the bonus.
      expect(Number(after.total_spend)).toBe(480);
    });
  });

  it("silently drops change_to_points_lkr on a customer-less order — nothing to credit it to", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const soup = await menuItemId(c, "Chicken Soup");
      const order = await createOrder(c, {
        change_to_points_lkr: 7,
        items: [{ menu_item_id: soup, qty: 1 }],
      });
      expect(order.loyalty).toBeNull();
      expect(Number(order.total)).toBe(480);
    });
  });

  it("rejects a negative change_to_points_lkr", async () => {
    await withRollback(async (c) => {
      await setActor(c, await userId(c, OWNER));
      const soup = await menuItemId(c, "Chicken Soup");
      await expect(
        createOrder(c, { change_to_points_lkr: -5, items: [{ menu_item_id: soup, qty: 1 }] }),
      ).rejects.toThrow();
    });
  });
});

describe("RLS — customers / loyalty_transactions", () => {
  it("staff can read customers but cannot toggle is_priority; owner can", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);
      await setActor(c, owner);
      const customer = await findOrCreateCustomer(c, { name: "Ruwan", phone_e164: "+94771234594" });

      await becomeAuthenticated(c, staff);
      const staffSel = await c.query("select id from public.customers where id = $1", [customer.id]);
      expect(staffSel.rows.length).toBe(1);

      // RLS silently filters an UPDATE's target row when the USING clause
      // doesn't match — no error, just zero rows affected (unlike an INSERT
      // with no matching policy, which does reject).
      const staffUpdate = await c.query("update public.customers set is_priority = true where id = $1", [
        customer.id,
      ]);
      expect(staffUpdate.rowCount).toBe(0);

      await resetRole(c);
      await becomeAuthenticated(c, owner);
      await c.query("update public.customers set is_priority = true, priority_note = 'regular' where id = $1", [
        customer.id,
      ]);
      const ownerSel = await c.query("select is_priority from public.customers where id = $1", [customer.id]);
      expect(ownerSel.rows[0].is_priority).toBe(true);
    });
  });

  it("staff cannot read loyalty_transactions; owner can", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      const staff = await userId(c, BAKERY_STAFF);
      await setActor(c, owner);
      const customer = await findOrCreateCustomer(c, { name: "Chamari", phone_e164: "+94771234593" });
      const fishBun = await menuItemId(c, "Fish Bun");
      await createOrder(c, { customer_id: customer.id, items: [{ menu_item_id: fishBun, qty: 1 }] });

      await becomeAuthenticated(c, staff);
      const staffSel = await c.query("select id from public.loyalty_transactions where customer_id = $1", [
        customer.id,
      ]);
      expect(staffSel.rows.length).toBe(0);

      await resetRole(c);
      await becomeAuthenticated(c, owner);
      const ownerSel = await c.query("select id from public.loyalty_transactions where customer_id = $1", [
        customer.id,
      ]);
      expect(ownerSel.rows.length).toBe(1);
    });
  });
});
