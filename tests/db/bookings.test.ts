import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  becomeAuthenticated,
  userId,
  withRollback,
  becomeAnon,
} from "./_client";

const OWNER = "owner@riobakershut.lk";
const BAKERY_STAFF = "bakery@riobakershut.lk";

describe("RLS — bookings", () => {
  it("staff can read and write bookings", async () => {
    await withRollback(async (c) => {
      const staff = await userId(c, BAKERY_STAFF);
      await becomeAuthenticated(c, staff);

      // Write booking
      const r = await c.query(`
        insert into public.bookings (business_id, date, time, party_size, customer_name, phone)
        values ($1, '2026-08-01', '12:00:00', 4, 'John Doe', '555-0100')
        returning id
      `, [BUSINESS_ID]);
      
      const bookingId = r.rows[0].id;
      expect(bookingId).toBeDefined();

      // Read booking
      const sel = await c.query("select * from public.bookings where id = $1", [bookingId]);
      expect(sel.rows.length).toBe(1);
      expect(sel.rows[0].customer_name).toBe("John Doe");
    });
  });

  it("anon cannot read bookings", async () => {
    await withRollback(async (c) => {
      await becomeAnon(c);
      const sel = await c.query("select * from public.bookings");
      expect(sel.rows.length).toBe(0);
    });
  });
});

describe("RLS — brand-assets bucket", () => {
  it("owner can write to brand-assets bucket", async () => {
    await withRollback(async (c) => {
      const owner = await userId(c, OWNER);
      await becomeAuthenticated(c, owner);

      const r = await c.query(`
        insert into storage.objects (bucket_id, name, owner)
        values ('brand-assets', $1 || '/logo.png', $2)
        returning id
      `, [BUSINESS_ID, owner]);
      
      expect(r.rows.length).toBe(1);
    });
  });

  it("staff cannot write to brand-assets bucket", async () => {
    await withRollback(async (c) => {
      const staff = await userId(c, BAKERY_STAFF);
      await becomeAuthenticated(c, staff);

      await expect(
        c.query(`
          insert into storage.objects (bucket_id, name, owner)
          values ('brand-assets', $1 || '/logo-staff.png', $2)
        `, [BUSINESS_ID, staff])
      ).rejects.toThrow();
    });
  });
});
