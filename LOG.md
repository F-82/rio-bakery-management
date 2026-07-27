# Log

One line per entry. Newest at bottom. Tags: `done | decision | fix | blocked | note`

No paragraphs. If it needs a paragraph, it belongs in ARCHITECTURE.md.

---

## 2026-07-26

- [decision] counter model follows System Flows doc, not Engineering Spec — Bakery + Hot Plate, both counters see full menu
- [decision] `counter_id` is order attribution only, never a permission — cross-counter rule requires it
- [decision] dropped `counter_tag` from MenuItem, replaced with `requires_kitchen_prep` — client says bakery items may need warming, so item-type and prep-need are separate facts
- [decision] `stock_movements` append-only ledger, `qty_on_hand` denormalised — owner needs to audit why a count is what it is
- [decision] `recipe_items` join table instead of `linked_ingredients[]` — array can't hold quantities
- [decision] one canonical `base_unit` per inventory item, no conversion table
- [decision] finished goods and ingredients share `inventory_items` via `stock_type` — one deduction code path, merchandise falls out free
- [decision] order creation is a single Postgres RPC with `FOR UPDATE` locks ordered by id — two tills will race otherwise
- [decision] prices computed server-side, client sends item id and qty only
- [decision] `print_jobs` as rows, not fire-and-forget — reprint and failure surfacing need state
- [decision] daily order number via atomic upsert on `daily_counters`, resets Colombo midnight, printed on both receipt and KOT
- [decision] phone stored E.164 with unique index — three local formats would otherwise split loyalty balances
- [decision] priority customers are both manual flag and derived view — owner needs both
- [decision] nav differs by role, staff get 3 tabs and owner 5 — nine won't fit a pill and it mirrors RLS
- [decision] bottom nav becomes left rail in landscape — vertical space is scarce there
- [decision] Ranade Light floor is 20px, Regular below that — Light is unreadable at 14px on a bright counter screen
- [decision] `--alert` deliberately breaks the reference palette, reserved for print failure and destructive actions
- [decision] tax report shows actual recorded revenue, no adjustment factor — matches System Flows §5 and Eng Spec §4.3
- [note] request received to show 50% of actual revenue on tax reports. Declined. Sales suppression, exposes the developer, and the true figures sit in the same database. Offered proper tax categorisation and deductible expense tracking instead. Awaiting owner's accountant
- [blocked] printer make/model unknown — building queue with ConsolePrinter, EscPosPrinter later
- [blocked] loyalty redemption rate unconfirmed — earn 1 pt/LKR with redeem at 1 LKR/pt is a 100% discount. Defaulting redeem to 0.01
- [note] `business_id` on all tables despite single-tenant scope — near-zero cost now, painful retrofit later
- [done] 00 scaffold — Next 16 App Router, TS strict, Tailwind v4, shadcn/ui, Vitest, Prettier, supabase init; dev serves, tests + build + lint + typecheck pass
- [decision] shadcn radix component library over new Base UI default — classic well-documented primitives the team expects
- [decision] Next 16.2 + React 19.2 from create-next-app latest — AGENTS.md flags breaking changes, read node_modules/next docs before app code
- [note] create-next-app ran its own git init; folded into a single `chore: scaffold project` commit
- [done] created rio-staging (ref krxbexuuevtsntllynhs, ap-southeast-1) in dj's-org, linked; remote db reachable, migrations empty — step 01 unblocked
- [decision] region ap-southeast-1 (Singapore) — nearest to Colombo, matches the org's existing project
- [blocked] rio-prod not created — org already has 1 project + staging = 2 (free tier cap); prod is #3 and forces a paid plan. Not needed until prod push; awaiting owner go-ahead on billing
- [note] staging keys/db-url in .env.local (gitignored, uncommitted); db password only in .env.local — Supabase can't retrieve it later, save to a password manager
- [done] 01 identity schema — businesses/counters/profiles/settings, user_role + counter_kind enums, on_auth_user_created trigger; pushed to staging, seeded, owner login resolves to profile role=owner
- [decision] profiles carry a composite FK (business_id, counter_id) → counters(business_id, id) — enforces a default counter stays inside its business (Invariant 10)
- [decision] auth trigger reads business/role/counter from user_metadata, defaults to the single business and role=staff — safe default for any future self-signup, profiles.role stays source of truth
- [decision] seed data run via `supabase db query --linked --file` (no psql, direct db host is IPv6-only); auth users via Admin API script so the trigger builds profiles
- [note] RLS still OFF — owner JWT can currently read all profiles. Locked down in step 04
- [done] 02 catalog schema — categories/menu_items/inventory_items/recipe_items, category_scope + stock_type + tax_category enums; pushed to staging, seeded 12 cats / 20 inventory / 21 menu / 65 recipe rows; recipe expansion query returns correct qty incl. finished_good self-ref and scaled deductions
- [decision] finished_good + merchandise share inventory_items with ingredients; their menu item's recipe points at their own inventory row qty 1 — one deduction path (Croissant, Bottled Water, Canned Soda seeded this way)
- [decision] added unique(business_id, name) on menu/inventory items and unique(business_id, scope, name) on categories — idempotent name-keyed seeding + data hygiene
- [decision] recipe_items carries business_id with composite FKs to menu_items/inventory_items(business_id, id) — Invariant 10; qty in the item's base_unit, no conversion table
- [note] seed tax categories are placeholders (1 zero_rated water, 1 exempt roti, rest standard) — real categorisation is client blocker #9, pending accountant
- [done] 03 order rpc + stock ledger + print queue — orders/order_items/daily_counters/stock_movements/print_jobs + create_order/void_order; pushed to staging; 11/11 db tests pass incl. both concurrency cases
- [decision] prices computed server-side in create_order; payload gives only menu_item_id/qty/notes, any price key ignored (verified by test)
- [decision] tax_amount stays 0 — no VAT rate is defined anywhere; the tax report splits actual revenue by tax_category (Invariant 7). A rate would be a client decision, not invented here
- [decision] stock_movements is append-only, enforced by a before-update/delete trigger; test teardown bypasses it per-session with session_replication_role=replica
- [decision] orders gained order_day (Colombo date) so unique(business_id, order_day, daily_seq) can enforce the daily reset — a STABLE tz expression can't be a generated column
- [decision] db test harness uses pg over the IPv4 session pooler (aws-0-ap-southeast-1:5432), TLS verified against committed supabase/certs/prod-ca-2021.crt; actor set via request.jwt.claims; functional tests isolate with BEGIN/ROLLBACK, concurrency tests commit + restore
- [note] loyalty accrual/redemption in create_order deferred to step 12 (customers table); orders.customer_id stored now, FK added later
- [note] deferred db tests to their steps — RLS (staff/expenses, cross-counter) to 04, loyalty phone dedupe to 12
- [done] 04 rls — helpers current_business_id/current_counter_id/current_role/is_owner/is_owner_or_manager; policies on all 14 tables; pushed to staging; 17/17 db tests pass incl. all three negative cases + coverage check (no table rowsecurity=false)
- [decision] created expenses table now (schema per §Money) so its RLS can be enforced+tested this step; step 14 builds finance UI on top
- [decision] deferred customers RLS to step 12 — that table isn't built yet; its matrix policies land with it
- [decision] helpers are SECURITY DEFINER to read profiles without recursing on the profiles policy; the order RPC + print agent bypass RLS (definer/service_role) so staff need no direct write grants
- [decision] staff get no direct INSERT on orders — creation is only via the definer create_order RPC, which is safer than the matrix's literal "insert"; staff direct access is SELECT own-counter-today only
- [decision] added settings.is_public; staff read only public keys (loyalty rates marked public, allow_negative_stock private)
- [decision] current_role() name is reserved in SQL, created quoted as "current_role"()
- [note] db RLS tests must `set local role authenticated` (pooler login is superuser and bypasses RLS); expected-write failures guarded with savepoints so the tx stays usable

## 2026-07-27

- [done] 05 typed data layer + auth middleware — database.ts generated from staging; lib/supabase/{client,server,middleware}; src/proxy.ts; lib/queries/profile.ts, lib/actions/auth.ts; lib/format.ts (formatLKR/formatQty/formatDate/normalisePhone); 21/21 unit tests pass; lint/typecheck/build clean
- [decision] Next 16 renamed middleware.ts→proxy.ts (function `proxy`, not `middleware`) — root file is src/proxy.ts; CLAUDE.md's "lib/supabase/middleware.ts" is Supabase's own helper-file convention, unrelated to the Next file name, kept as-is
- [decision] session refresh uses getUser() not getClaims() — getUser() revalidates directly against Auth and doesn't depend on the project having asymmetric JWT signing keys configured, which staging's status is unconfirmed
- [decision] formatLKR/formatQty built on Intl.NumberFormat (en-LK), formatDate on Intl.DateTimeFormat pinned to Asia/Colombo — no new formatting dependency; Decimal only converted to number at the display boundary, never for arithmetic
- [note] LKR currency format renders a non-breaking space (U+00A0) between "LKR" and the amount, not a regular space — tests assert against the literal NBSP
- [decision] proxy also checks profiles.active and signs out + redirects deactivated staff — flagged because no RLS policy currently checks `active` (helpers only key off business_id/role), so today a deactivated staff member's JWT still passes RLS; this proxy check is a UX guard, not the fix. Real fix is an RLS change, out of scope here
- [decision] minimal functional (unstyled) /login and authed "/" landing built now so the redirect has a real destination — full design/nav lands in steps 06–07, not duplicated here
- [note] verified the full auth round trip against rio-staging: unauthenticated → /login (307), authenticated → away from /login (307), authed "/" renders the real owner profile (name + role) via getCurrentProfile(). Used a non-destructive admin magic-link grant to get a real session rather than guessing/rotating the seeded owner's password
- [decision] pinned @supabase/ssr@0.12.3, @supabase/supabase-js@2.110.8, decimal.js@10.6.0 to the exact resolved versions rather than carets
- [done] 06 design tokens + shared components — Rio palette/type-scale/radius tokens in globals.css; Ranade + General Sans self-hosted via next/font/local; Logo.tsx + public/brand placeholders; StatCard/DataTable/EmptyState/PageHeader/MoneyText/PrintStatus/CounterBadge/LowStockBadge/PriorityStar; /kitchen-sink dev reference; lint/typecheck/test/build clean
- [decision] downloaded real Ranade + General Sans woff2 files directly from Fontshare's own free-tier API (api.fontshare.com/v2/fonts/download/...) rather than stubbing placeholder fonts — their EULA permits web/app use free of charge; only self-hosting via next/font/local is disallowed is *their* CDN, not the font files themselves. License text committed alongside each family in src/fonts/*/LICENSE.txt
- [decision] type scale (display/h1/h2/h3/body/body-sm/label/micro/num-lg/num) implemented as Tailwind v4 `@utility` classes bundling face+weight+size+line-height — enforces Ranade Light's 20px floor structurally (only display/h1/num-lg use it) instead of relying on call-site discipline
- [decision] radius tokens (badge/tile/card) aliased onto Tailwind's existing default scale (rounded-lg=8px, rounded-2xl=16px, rounded-3xl=24px) rather than a new proportional scale — those defaults already land exactly on DESIGN.md's three values; button pill uses built-in rounded-full
- [decision] `[lang="si"]` sets `--leading-scale: 1.4`, consumed by every type-scale utility's line-height calc — wired now per DESIGN.md so step 19 doesn't have to touch the token layer
- [decision] dark mode tokens structurally present (`.dark` block, same variable names) but values identical to light — DESIGN.md says not in v1, this just keeps the toggle safe to flip later without a redesign
- [fix] shadcn Button had no "use client" — passing onClick from a Server Component (kitchen-sink) crashed with a 500 ("Event handlers cannot be passed to Client Component props"). Marked Button client; kitchen-sink's two interactive demos (EmptyState action, failed PrintStatus reprint) moved into their own small client component since an inline closure still can't cross the server/client boundary as a prop
- [fix] StatCard had no `min-w-0` on its grid item or the value/delta row — a long tabular-nums value (non-breaking space from formatLKR, so it can't line-break) plus the delta chip forced the card to overflow its grid column. Added `min-w-0` + `flex-wrap` on the row and `truncate` on the value as a last-resort safety net
- [decision] shadcn destructive variant (both Button and Badge) rewritten from the generated muted `/10` tint to full-saturation `--alert` — DESIGN.md is explicit that alert deliberately breaks the quiet palette and must not be subtle
- [note] contrast check against DESIGN.md's 4.5:1 floor: ink/ink-2/accent-ink/alert-ink/alert all pass comfortably (5.4–15.9:1). `--pos` (2.9:1), `--neg` (4.2:1), `--warn` (2.8:1) fail as plain text on `--bg`/`--surface` — these are the exact spec'd hex values, not changed unilaterally. Treating as a usage constraint (icons/chip backgrounds/bold-large text only, never small plain body text) rather than silently altering the palette; flagged to the owner for a call on whether to add darker text-only variants
- [decision] kitchen-sink exempted from the proxy's auth gate (no session data involved) but still calls `notFound()` when `NODE_ENV==='production'` — verified 404 against a real `next build && next start`, not just reasoned about
- [decision] phone-l (900px landscape) and desktop (1200px) custom breakpoints from DESIGN.md's responsive table deferred to step 07 — nothing in this step's components needs them; DataTable's "table ≥768" already matches Tailwind's default `md`
- [done] 07 responsive app shell + role-based nav — src/lib/nav.ts (role→tabs, More sheet items, page-title lookup); Nav/Header/MoreSheet under app/(app)/_components; layout.tsx wires profile+counter context; loading.tsx + error.tsx boundaries; stub pages for all 10 nav destinations; "/" now redirects to the role's home tab. Verified live against staging with real owner + staff sessions: staff see exactly Orders/Menu/Inventory with a "Bakery" counter badge, owner sees Dashboard/Orders/Inventory/Finance/More with no counter badge; lint/typecheck/test/build clean
- [decision] DESIGN.md's four-row responsive table (phone-p/phone-l/tablet/desktop) collapses to two real CSS rules for the nav, since phone-l/tablet/desktop all render the identical rail shape: bottom pill only below 768px in portrait; left rail for any landscape viewport or width>=768; labels appear at width>=1200. Implemented as plain `@media` rules in globals.css (`.app-nav`), not chained Tailwind variant utilities — the width+orientation combination doesn't compose cleanly as utility classes, and getting the cascade/specificity right matters more here than utility-first purity
- [decision] Nav is one component mounted for every breakpoint; the bottom-bar↔rail switch is CSS-only, never a JS breakpoint check swapping components — this is what actually satisfies "rotating the device swaps nav without losing state," since a JS-driven remount would reset it
- [decision] Header collapses to 44px on `orientation:landscape` only (not width-based like the nav) per DESIGN.md's literal wording — a portrait tablet keeps the full-height header even though its nav is already in rail form
- [fix] `layout.tsx` (Server Component) was calling `getPrimaryNavItems(role)` and passing the resulting array — which embeds lucide icon component references — as a prop into the client `Nav`. Component/function references can't cross the server/client boundary as data (only rendered elements can), so this 500'd with "Functions cannot be passed directly to Client Components." Fixed by passing the plain `role` string instead and computing the icon-bearing item list inside the client component
- [fix] shadcn's generated `sheet.tsx` referenced `size="icon-sm"` on its close button, a Button variant removed in step 06 when enforcing the 44px tap-target floor — switched it to `size="icon"` (44px)
- [fix] MoreSheet's landscape-vs-portrait detection called `setState` synchronously inside `useEffect` on mount, flagged by the react-hooks lint rule (cascading-render risk) — rewritten on `useSyncExternalStore`, the correct primitive for subscribing to `matchMedia`, with a `false` server snapshot
- [decision] More sheet items resolve via a direct import of `MORE_SHEET_ITEMS` inside the (already-client) MoreSheet component, not passed as a prop — sidesteps the same icon-serialization problem by construction
- [decision] bell's unread count and the Inventory/Orders nav badge counts are structurally supported (optional props, badge only renders when truthy) but left unwired — no notifications table or live low-stock/pending-order query exists yet; wiring arrives with steps 09/10 and whatever step defines notifications
- [decision] profiles→counters embed uses the plain `counters(name, kind)` nested select despite the composite FK (business_id, counter_id)→counters(business_id, id) — PostgREST resolved it without an explicit constraint-name hint since there's only one relationship path; confirmed live (staff session correctly returned "Bakery")
- [note] "rotating the device swaps nav without losing state" verified via code review (single mounted component, CSS-only breakpoint switch, no conditional unmount anywhere in the tree) and live role/redirect checks against staging — not device-tested, no browser automation available in this environment
