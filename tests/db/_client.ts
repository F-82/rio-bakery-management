import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

export const BUSINESS_ID = "11111111-1111-1111-1111-111111111111";

const CA = readFileSync(
  fileURLToPath(new URL("../../supabase/certs/prod-ca-2021.crt", import.meta.url)),
  "utf8",
);

const POOLER_URL = process.env.SUPABASE_POOLER_URL;

export function newClient(): pg.Client {
  if (!POOLER_URL) {
    throw new Error("SUPABASE_POOLER_URL is not set (see .env.example); DB tests need staging.");
  }
  return new Client({ connectionString: POOLER_URL, ssl: { ca: CA, rejectUnauthorized: true } });
}

/** Run `fn` inside a transaction that is always rolled back — full isolation. */
export async function withRollback<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = newClient();
  await c.connect();
  try {
    await c.query("begin");
    return await fn(c);
  } finally {
    await c.query("rollback").catch(() => {});
    await c.end().catch(() => {});
  }
}

/** Impersonate a profile for the current transaction (auth.uid() reads this). */
export async function setActor(c: pg.Client, uid: string): Promise<void> {
  const claims = JSON.stringify({ sub: uid, role: "authenticated" });
  await c.query("select set_config('request.jwt.claims', $1, true)", [claims]);
}

/**
 * Impersonate a real API request: set the JWT claims AND switch to the
 * `authenticated` SQL role so RLS actually applies (the pooler login role is
 * superuser and bypasses RLS otherwise). Transaction-scoped.
 */
export async function becomeAuthenticated(c: pg.Client, uid: string): Promise<void> {
  const claims = JSON.stringify({ sub: uid, role: "authenticated" });
  await c.query("select set_config('request.jwt.claims', $1, true)", [claims]);
  await c.query("set local role authenticated");
}

/** Switch to the anonymous (logged-out) role. */
export async function becomeAnon(c: pg.Client): Promise<void> {
  await c.query("select set_config('request.jwt.claims', '', true)");
  await c.query("set local role anon");
}

/** Return to the superuser login role (undoes becomeAuthenticated/becomeAnon). */
export async function resetRole(c: pg.Client): Promise<void> {
  await c.query("reset role");
}

export async function userId(c: pg.Client, email: string): Promise<string> {
  const r = await c.query("select id from auth.users where email = $1", [email]);
  if (!r.rows[0]) throw new Error(`no auth user ${email}`);
  return r.rows[0].id as string;
}

export async function menuItemId(c: pg.Client, name: string): Promise<string> {
  const r = await c.query(
    "select id from public.menu_items where business_id = $1 and name = $2",
    [BUSINESS_ID, name],
  );
  if (!r.rows[0]) throw new Error(`no menu item ${name}`);
  return r.rows[0].id as string;
}

export async function inventoryQtyMap(c: pg.Client): Promise<Map<string, number>> {
  const r = await c.query(
    "select id, qty_on_hand from public.inventory_items where business_id = $1",
    [BUSINESS_ID],
  );
  return new Map(r.rows.map((row) => [row.id as string, Number(row.qty_on_hand)]));
}

type LineInput = { menu_item_id: string; qty: number; notes?: string; [k: string]: unknown };

export type CreateOrderResult = {
  order_id: string;
  order_number: string;
  daily_seq: number;
  subtotal: string;
  discount_amount: string;
  total: string;
  kitchen_ticket: boolean;
  low_stock_warnings: Array<Record<string, unknown>>;
  loyalty: {
    points_earned: number;
    points_redeemed: number;
    redemption_discount: string;
    balance: number;
  } | null;
};

/** Call create_order in the current transaction (actor must already be set). */
export async function createOrder(
  c: pg.Client,
  payload: { items: LineInput[]; [k: string]: unknown },
): Promise<CreateOrderResult> {
  const r = await c.query("select public.create_order($1::jsonb) as res", [JSON.stringify(payload)]);
  return r.rows[0].res as CreateOrderResult;
}

/**
 * Fire create_order on its own connection and commit it — used by concurrency
 * tests where real contention (not rollback) is the point.
 */
export async function createOrderCommitted(
  uid: string,
  payload: { items: LineInput[]; [k: string]: unknown },
): Promise<CreateOrderResult> {
  const c = newClient();
  await c.connect();
  try {
    await c.query("begin");
    await setActor(c, uid);
    const r = await c.query("select public.create_order($1::jsonb) as res", [JSON.stringify(payload)]);
    await c.query("commit");
    return r.rows[0].res as CreateOrderResult;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    await c.end().catch(() => {});
  }
}

/**
 * Teardown for committed tests: delete the given orders and their ledger/print
 * rows, then restore every inventory qty_on_hand to `snapshot`. session_replication_role
 * = replica bypasses the append-only trigger (and cascades), so children are
 * deleted explicitly, in FK order.
 */
export async function cleanupCommitted(orderIds: string[], snapshot: Map<string, number>): Promise<void> {
  if (orderIds.length === 0 && snapshot.size === 0) return;
  const c = newClient();
  await c.connect();
  try {
    await c.query("begin");
    await c.query("set local session_replication_role = 'replica'");
    if (orderIds.length) {
      await c.query("delete from public.print_jobs where order_id = any($1)", [orderIds]);
      await c.query("delete from public.stock_movements where ref_order_id = any($1)", [orderIds]);
      await c.query("delete from public.order_items where order_id = any($1)", [orderIds]);
      await c.query("delete from public.orders where id = any($1)", [orderIds]);
    }
    for (const [id, qty] of snapshot) {
      await c.query("update public.inventory_items set qty_on_hand = $1 where id = $2", [qty, id]);
    }
    await c.query("commit");
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    await c.end().catch(() => {});
  }
}
