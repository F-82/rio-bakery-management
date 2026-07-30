# Performance Audit — Rio Bakers Hut

**Date:** 2026-07-30
**Method:** Measured, not estimated. Next build, live `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_statements` against `rio-staging`, and network round-trip timing to the Supabase Auth endpoint. No fixes applied in the audit pass.

> Supersedes the earlier estimate-based report. Two of that report's headline claims did not survive measurement: composite indexes **do** exist, and no `<img>` tags drive list views. The real bottleneck is auth round-trips, not assets or indexes.

---

## Headline

The felt slowness is **not** the database and **not** the bundle.

- **DB:** staging is nearly empty (orders ~3–15 rows, customers ~2, menu 147). Every list query returns in <4 ms. All 11 checklist indexes exist; the four RLS helpers are `STABLE`.
- **Bundle:** no chart library (`recharts`/`d3`/`chart.js` absent), and `lucide-react` uses tree-shakeable named imports — no barrel.
- **The actual cost is auth round-trips.** Each authenticated navigation calls `supabase.auth.getUser()` **2–3 times**, each a **measured ~150–310 ms round-trip to GoTrue** (cold: 11.7 s on first hit). Filter/tab changes go through `router.push`, so they re-run the same waterfall — which is why *actions* feel slow too.

Measured GoTrue round-trip (`/auth/v1/user`, warm, server-side portion `ttfb − appconnect`): **~157 / 160 / 200 / 312 ms** across samples; first (cold) request **11.7 s**.

---

## Prioritized fix plan

### P0 — do first (per-navigation latency, every authenticated page)

1. **Stop re-validating the user in every page server component.**
   The proxy (`proxy.ts` → `updateSession`) already calls `getUser()` and redirects if absent, so the explicit `const {data:{user}} = await getUser(); if(!user) redirect('/login')` at the top of 9 pages (`orders, inventory, menu, customers, finance, reports, tax, employees, bookings`) is a redundant serial round-trip that blocks before every `Promise.all`.
   *Fix direction:* remove the page-level guard (rely on the proxy), or pass the already-validated user/claims down. **Saves ~150–310 ms/nav.**

2. **Collapse the profile fetch to one round-trip and fold it into the page's `Promise.all`.**
   `getCurrentProfile()` (`queries/profile.ts`) itself calls `getUser()` **again** plus `profiles.select('*')`. Pages call both `getUser()` and `getCurrentProfile()`, so a third auth hop lands per navigation. `pg_stat_statements` shows the proxy's profile lookup alone at **1,983 calls**.
   *Fix direction:* have the proxy stash `user.id`/role (e.g. request header) and let queries read it, or accept `userId` as an argument so `getCurrentProfile` skips its own `getUser()`. **Saves ~150–310 ms + 1 DB hop/nav.**

3. **Settings page fetches the profile twice.**
   `settings/page.tsx` calls `getCurrentProfile()`, then `getBusinessSettings()` calls `getCurrentProfile()` again → 2× getUser + 2× `profiles.select('*')`, serial, before any data. Pass the profile in. **Saves ~200–400 ms on /settings.**

> P0 net: a typical navigation drops from ~3 serial auth round-trips to ~1 (the proxy's). On the measured ~200 ms/call that is roughly **400–600 ms off every screen change and every filter/tab change.**

### P1 — realtime and scaling correctness

4. **Scope realtime subscriptions and stop re-subscribing on render.**
   `pg_stat_statements` #1 is the logical-replication WAL poller: **658 s total, 76.3% of all DB exec time, 108,189 calls** — driven by whole-table subscriptions in `DashboardShell` and `OrdersList` (no `filter: business_id=eq…`, RLS-scoped only). Separately, `OrdersList.tsx:107` deps `[filter, counters]` are fresh refs each render, so the channel tears down and reconnects on every parent render.
   *Fix direction:* add server-side `filter` on `business_id` to each `.on(...)`; memoize/stabilize the `OrdersList` effect deps (or key by primitive filter string).

5. **Delete the orphaned `DashboardClient.tsx`.**
   Imported by no page (grep: self-reference only); a full duplicate of the dashboard subscription logic. Dead code, removes a second copy of the broad subscription pattern.

6. **Wrap RLS helper calls as `(SELECT fn())`.**
   Policies in `20260726200104_rls.sql` call `current_business_id()` / `is_owner_or_manager()` / `current_role()` **bare**; EXPLAIN confirms per-row Filter evaluation. Helpers are already `STABLE`, but wrapping turns them into a once-per-query InitPlan. ~0 impact at current row counts; material once `orders`/`order_items` grow. **Needs a migration → staging first per CLAUDE.md.**

### P2 — scaling hygiene (near-zero impact today, real at volume)

7. **Add `.limit()`/pagination** to unbounded lists: `getInventoryItems`, `getMenuItems`, `getEmployees`, `getBookings`, and the report/tax/finance range queries (`getOrdersForReport`, `getTaxOrders`, `getTaxCategoryLines`, `getExpenses`).
8. **Replace the two "pull 1,000 rows to DISTINCT in JS" queries** (`getOrderSources`, `getExpenseCategories`) with `SELECT DISTINCT`/an RPC.
9. **Trim `select('*')`** in `getEmployees`, `getBusinessSettings` (pulls jsonb `settings.value`), `getCurrentProfile[Context]`, `getBookings`.
10. **Phone search can't use its index:** `customers.phone_e164` is covered only by `(business_id, phone_e164)`, and the app does `phone_e164 ILIKE '%term%'` (leading wildcard). If phone search gets slow at volume, add a `text_pattern_ops` / trigram index.

### P3 — resilience (not latency)

11. **No `error.tsx` exists anywhere** in `src/app`. Add error boundaries so a failed query renders a state instead of bubbling.
12. **Missing `loading.tsx`** on `/`, `/(auth)/login`, `/kitchen-sink` (all 12 `(owner)/*` routes have one).

---

## Findings table (ordered by estimated ms saved per interaction)

| # | Finding | Layer | Evidence | Est. ms saved |
|---|---------|-------|----------|---------------|
| 1 | Page server components re-call `getUser()` after the proxy already validated | Next/auth | 9 pages; measured getUser ~150–310 ms; blocks before `Promise.all` | ~150–310 ms/nav |
| 2 | `getCurrentProfile()` does its own `getUser()` + `profiles.select('*')` | Next/auth | `profiles.ts:711`; proxy profile lookup = 1,983 calls | ~150–310 ms + 1 DB hop/nav |
| 3 | Settings fetches profile twice serially | Next/auth | `settings/page.tsx` + `getBusinessSettings` | ~200–400 ms on /settings |
| 4 | Whole-table, unfiltered realtime subscriptions | Realtime/DB | WAL poller 658 s, 76.3% exec, 108k calls | DB CPU; scales badly |
| 5 | `OrdersList` re-subscribes every render | Realtime | `OrdersList.tsx:107` deps `[filter, counters]` | reconnect churn |
| 6 | Orphaned duplicate `DashboardClient.tsx` | dead code | imported by no page | 0 runtime |
| 7 | RLS helpers called bare, not `(SELECT fn())` | DB/RLS | migration + EXPLAIN Filter | ~0 now, scales |
| 8 | Unbounded list queries | Supabase | inventory/menu/employees/reports/tax/finance | ~0 now, scales |
| 9 | 1,000-row pulls for DISTINCT | Supabase | `getOrderSources`, `getExpenseCategories` | small, scales |
| 10 | `select('*')` in list/context paths | Supabase | employees, settings, profile, bookings | small |
| 11 | No `error.tsx`; 3 routes missing `loading.tsx` | Next | 0 error boundaries in `src/app` | resilience |

---

## Answers to each probe

1. **loading.tsx:** all 12 `(owner)/*` have one. Missing: `/`, `/(auth)/login`, `/kitchen-sink`. **No `error.tsx` anywhere.**
2. **Nav triggers:** primary nav (`AppShell`, `DashboardShell`) uses `<Link>` (prefetched). All 13 `router.push` calls are same-route searchParam/filter updates — appropriate, but each still forces a full RSC round-trip including the auth waterfall (#1–2).
3. **Waterfalls:** every page does serial `getUser()` → `Promise.all`. `dashboard`: `Promise.all(3)` then dependent `getTodaysPrintJobs` (1 legit hop). `finance`: getUser → `await getCurrentProfile` → `Promise.all(2)` (3 layers). `settings`: profile fetched twice serially. `employees`: getUser → getTranslation → getCurrentProfile → `Promise.all(2)`.
4. **Client `useEffect` fetch:** 6 detail drawers fetch on open via browser client (lazy-load-on-click, defensible; could be server detail routes). Low priority.
5. **Middleware getUser per request:** yes — `updateSession` calls `getUser()` (round-trip, deliberate over `getClaims()`) + `profiles.select('active, role')` on every matched request.
6. **Bundle / First Load JS:** could not measure per-route First Load JS — build runs on **Turbopack (Next 16.2.12)**, which omits the size column (all 17 routes print `ƒ`, no table). No inflators found (no chart lib; lucide named imports). Needs `next build --webpack` or `@next/bundle-analyzer` for numbers.
7. **`select('*')`:** `bookings`, `employees`, `profile(×2)`, `settings`. `getMenuItems` list pulls `image_url` (URL string).
8. **N+1:** none server-side — `getTodaysPrintJobs` uses `.in(orderIds)`; loyalty ledger uses an embed join; recipes/detail fetched only inside on-open drawers.
9. **No limit/pagination:** inventory, menu, employees, bookings, and all report/tax/finance range queries.
10. **`count: 'exact'`:** none (grep clean).
11. **Realtime:** filtered to table+event but not `business_id` (RLS-scoped); cleanup present on all three; `OrdersList` re-subscribes on render.
12. **Indexes:** all 11 checklist columns covered (verified via `pg_indexes`). `customers.phone_e164` → `customers_business_id_phone_e164_key`; `inventory_items.business_id` → composite unique. Caveat: phone index is `(business_id, phone_e164)`, unusable by `ILIKE '%term%'`.
13. **STABLE:** all five helpers (`current_business_id`, `current_role`, `current_counter_id`, `is_owner`, `is_owner_or_manager`) — verified in `pg_proc`.
14. **RLS call style:** bare, never `(SELECT fn())`.
15. **pg_stat_statements top:** #1 realtime WAL poller (76.3%, 658 s); #2 `create_order` RPC (7.9%, 123 ms mean); #3 `pg_timezone_names` (7.5%, 431 ms mean, Supabase internal); rest catalog/introspection. Only app query in the top 15: the proxy's `profiles.active` lookup (1,983 calls, 0.69 ms mean).
16. **EXPLAIN (staff role, RLS on):** orders list — `Index Scan using orders_business_created_at_idx`, exec **3.3 ms**, planning **13.1 ms** (planning dominates on tiny data), RLS as per-row Filter. Inventory list — `Index Scan`, **0.36 ms**. Owner orders list — **1.1 ms**.

## Gap
Per-route First Load JS is unmeasured (Turbopack limitation). Run `next build --webpack` or add `@next/bundle-analyzer` to close it.
