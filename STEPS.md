# Build Steps — Rio Bakers Hut

Each step has a paste-ready prompt. Sequential. Do not start a step while the previous one fails tests.

Backend before frontend: the order RPC, RLS and print queue constrain every screen. Building UI first means rebuilding it.

## How to run this

- `CLAUDE.md` is auto-loaded every session. Prompts don't repeat its rules.
- **`/clear` between steps.** State lives in the docs and the repo, not the conversation. Carrying context across steps burns tokens and drifts.
- Run the review prompt (bottom) every 4–5 steps.
- ★ = the two steps that carry the product. Slow down there.

**First message of any session:**

```
Read ARCHITECTURE.md and STEPS.md. Check LOG.md for the last completed step.
Tell me which step is next and anything blocking it. Don't write code yet.
```

---

## 00 — Repo

```
Scaffold: Next.js App Router + TypeScript strict + Tailwind + shadcn/ui,
ESLint, Prettier, Vitest, path aliases, .env.example.

Folder structure per CLAUDE.md §Structure. Empty dirs get .gitkeep.

supabase init. I'll create rio-staging and rio-prod myself and give you the
refs — ask for them, then link staging.

Done when pnpm dev serves and pnpm test runs.
Commit: chore: scaffold project
```

## 01 — Identity schema

```
Read ARCHITECTURE.md §Schema/Identity.

Migration: businesses, profiles, counters, settings. Enums for role and
counter kind. Trigger creating a profile row on auth.users insert.

Seed: one business (Rio Bakers Hut, LKR, Asia/Colombo), two counters
(Bakery, Hot Plate), one owner, two staff.

Note counter_id on a profile is a default for attribution, not a restriction.

Done when the owner can log in and the session resolves to a profile with a role.
Commit: feat(db): add identity schema and auth trigger
```

## 02 — Catalog schema

```
Read ARCHITECTURE.md §Schema/Catalog.

Migration: categories, menu_items, inventory_items, recipe_items.
Enums: stock_type, tax_category.

Traps: base_unit is canonical per inventory item, recipe_items.qty is always
in that unit, no conversion table. Finished goods get a recipe row pointing
at themselves with qty 1.

Seed ~20 menu items with ingredients. Mix requires_kitchen_prep true/false.
Include at least one finished_good and one merchandise item.

Done when a recipe expansion query returns correct quantities for a menu item.
Commit: feat(db): add catalog schema and seed
```

## 03 — Order RPC + stock ledger + print queue ★

```
Read ARCHITECTURE.md §Schema/Orders, §Stock ledger, §Printing, §The order RPC.
This is the core of the system. Nothing above it matters if it's wrong.

Migration: orders, order_items, daily_counters, stock_movements, print_jobs.
Then create_order(payload jsonb) and void_order(order_id, reason).

Traps:
- Lock inventory rows FOR UPDATE ORDER BY inventory_item_id. Unordered locks
  deadlock when both tills sell the same ingredient.
- Compute every price server-side from menu_items.price. Ignore any price in
  the payload entirely.
- daily_seq via the atomic upsert in the doc, not select-then-insert.
- Snapshot name, unit_price, requires_kitchen_prep, tax_category onto the line.
- Kitchen ticket only if a line has requires_kitchen_prep. Payload carries the
  order number and no prices.
- Negative stock is allowed and returns a warning, not an error.

Write the full tests/db suite from CLAUDE.md §Tests. Run against staging.
No UI in this step — test through SQL only.

Done when every DB test passes, including the concurrency cases.
Commit: feat(rpc): add order creation with atomic stock deduction and print queue
```

## 04 — RLS

```
Read ARCHITECTURE.md §RLS.

Helpers: current_business_id(), current_role(), is_owner().
Policies for every table in the matrix. Enable RLS on all of them — check
nothing is left open.

Write negative-case tests: staff selecting from expenses must fail, staff
reading another counter's orders must fail, cross-business reads must fail.

Done when every negative case fails as intended and no table is unprotected.
Commit: feat(db): add row level security policies
```

## 05 — Types + data layer

```
supabase gen types typescript --linked > src/types/database.ts

Build src/lib/queries/* and src/lib/actions/* per CLAUDE.md §Structure.
Supabase server/client/middleware helpers. Auth middleware with role-based
redirect.

src/lib/format.ts: formatLKR, formatQty, formatDate, normalisePhone.
normalisePhone handles 0771234567, +94771234567, 771234567, 94771234567 and
spacing/dashes, returns E.164 or null.

Unit test every formatter. Phone normalisation needs the full table of inputs.

Done when logged-out users redirect to login and all formatter tests pass.
Commit: feat(app): add typed data layer and auth middleware
```

## 06 — Design system

```
Read DESIGN.md in full.

Tokens into Tailwind config + CSS vars. Self-host Ranade and General Sans as
woff2 via next/font/local — do not link the Fontshare CDN.

Enforce the type scale in code: Ranade Light only at 20px+, Regular below.
Tabular numerals on all money and quantity.

src/components/brand/Logo.tsx — placeholder mark, sized by prop, used
everywhere. Placeholder files in public/brand/.

Patterns: StatCard, DataTable, EmptyState, PageHeader, MoneyText, PrintStatus,
CounterBadge, LowStockBadge, PriorityStar.

Build /kitchen-sink rendering every primitive. Keep it, gate to dev.

Done when kitchen-sink is correct at phone portrait, phone landscape, tablet
and desktop.
Commit: feat(ui): add design tokens and shared components
```

## 07 — App shell

```
Read DESIGN.md §Responsive and §Navigation.

Bottom pill nav in portrait, left rail in landscape and above. Same items,
same order, same active state — rearrange only, never hide.

Role-driven tabs: staff get Orders / Menu / Inventory. Owner and manager get
Dashboard / Orders / Inventory / Finance / More.

Header: title, bell with unread count, counter indicator, profile.
Handle env(safe-area-inset-*) on all four sides. Loading and error boundaries.

Done when rotating the device swaps nav without losing state or scroll position.
Commit: feat(ui): add responsive app shell and role-based navigation
```

## 08 — POS / order screen ★

```
Read DESIGN.md §"The POS screen is dense on purpose" and §Signature.
Highest-traffic screen in the product, used hundreds of times a day.

Category tabs pinned top, item tile grid, search.
Cart: bottom sheet in portrait, pinned side panel in landscape.
Qty steppers, per-line notes, running total always visible.
Customer phone lookup with inline create, loyalty balance, manual redeem.
Counter selector defaulting from the profile.
Confirm calls create_order. Success screen leads with the order number at
display size — this is the design signature, treat it as such.

Traps:
- Optimistic cart updates. The tile responds before any round trip.
- Reduce vertical rhythm to ~60% of DESIGN.md defaults on this screen only.
- Surface print job status inline. A failed kitchen ticket uses --alert with
  a working Reprint and cannot be dismissed.

Done when a full order takes under 20 seconds, works one-handed in portrait,
works propped in landscape, and the kitchen ticket fires only for prep items.
Commit: feat(pos): add order taking screen
```

## 09 — Orders

```
Active / Archived tabs. Filters: counter, source, status, payment, date.
Search by order number, phone, customer name.
Detail drawer: lines, print history, reprint, void with reason.
Supabase Realtime so both tills see each other's orders live.

Done when a void reverses stock correctly and shows in the movement ledger,
and orders appear on the other till without a refresh.
Commit: feat(orders): add order list, detail and void
```

## 10 — Inventory

```
Table with low-stock filter, category filter, search. Add and edit items with
stock_type and base_unit. Per-item stock movement history.

Entry forms for manual adjustment, wastage, purchase and stocktake — all write
to stock_movements, never a direct qty_on_hand update.

Low-stock count feeds the nav badge. Negative stock shows the negative number
in --alert, not clamped to zero.

Done when every stock change appears in the ledger and qty_on_hand reconciles
against the sum of deltas.
Commit: feat(inventory): add stock management and movement ledger
```

## 11 — Menu

```
CRUD with image upload to Supabase Storage. Availability toggle.

requires_kitchen_prep toggle needs plain-language help text — this field
decides whether the chef ever sees the order, and staff must understand it.
Something like "Send this to the kitchen printer. Turn on for anything cooked
or warmed to order."

Recipe builder linking inventory items with quantities in the item's base unit.
Tax category selector.

Done when toggling prep on an item changes kitchen ticket behaviour on the
next order.
Commit: feat(menu): add menu crud and recipe builder
```

## 12 — Customers + loyalty

```
Read ARCHITECTURE.md §Schema/Loyalty.

List with search, priority filter, spend and points columns.
Detail: order history, points ledger, manual is_priority toggle with note.
Priority list combining manual flags and the derived top-spender view.
Settings for earn and redeem rates.

Trap: every phone write goes through normalisePhone. The unique index will
reject duplicates but the UI must handle it cleanly, not throw.

Done when three formats of the same number resolve to one customer and points
arithmetic is exact across earn and redeem.
Commit: feat(loyalty): add customer records and points programme
```

## 13 — Dashboard

```
Today's sales. Orders 2x2: total / completed / pending / cancelled.
Estimated net profit with income and expense split. Today's bookings.
Low-stock summary. Failed-print alert if any exist. Realtime.

Done when every figure matches the underlying tables exactly and a failed
print job surfaces here.
Commit: feat(dashboard): add owner dashboard
```

## 14 — Finance

```
Overview: total income, booking revenue, total expenses, net profit, total
orders. Period selector, default This Month. Revenue-by-day bar chart.

Expenses tab: full ledger — date, category, amount, note, is_tax_deductible,
receipt upload.

Platform Earnings tab: stub with a "confirming scope" empty state. Client
hasn't defined it.

Done when net profit ties out to revenue minus expenses for every period tested.
Commit: feat(finance): add finance overview and expense ledger
```

## 15 — Reports

```
Report type selector, date range. Cards: revenue, commission, net revenue,
orders. Breakdowns by counter, by source, by payment. Detail table.
CSV and PDF export.

The by-counter breakdown is new for Rio — it's how the owner compares bakery
against hot plate performance.

Done when the by-counter breakdown sums to total revenue.
Commit: feat(reports): add sales reports with counter breakdown
```

## 16 — Tax report

```
Read ARCHITECTURE.md Invariant 7 before writing a line.

Gross revenue, actual, unmodified. Split by tax_category on the line item.
Itemised deductible expenses where is_tax_deductible. Net taxable income.
Monthly / quarterly / annual. CSV and PDF.

There is no multiplier, adjustment factor, reduction setting or "reported
revenue" field anywhere in this feature. If you find yourself adding one,
stop and flag it.

Done when gross revenue on this report equals the sum of completed order
totals for the period, to the cent.
Commit: feat(tax): add tax report
```

## 17 — Bookings, employees, settings

```
Bookings: CRUD with status, date/time, party size, customer, source.
Employees: directory, roles, counter assignment, invite flow.
Settings: business profile, logo upload replacing the Logo.tsx placeholder,
currency and tax config, loyalty rates, printer config, notifications, language.

Scope for all three is unconfirmed with the client. Build exactly what the
spec lists, nothing speculative.

Done when the owner can change a staff role and it takes effect on that user's
next request.
Commit: feat(app): add bookings, employees and settings
```

## 18 — Print agent

```
Read ARCHITECTURE.md §Printing.

agent/ Node service. Realtime subscription on print_jobs.
Printer interface with two implementations: ConsolePrinter (now) and
EscPosPrinter (once we know the hardware).
Renderers for customer receipt and KOT. KOT carries no prices and leads with
the order number at the largest size the printer supports.
Retry with backoff, status writeback, reprint handling.

agent/README.md: install, config, autostart on the counter machine.

Done when killing the kitchen printer mid-order still completes the order and
surfaces a failure with a Reprint that works.
Commit: feat(print): add on-site esc/pos print agent
```

## 19 — Sinhala

```
Read DESIGN.md §Sinhala.

i18next. Extract every UI string to locale files — fail the build on a
hardcoded string if you can wire that up.
Noto Sans Sinhala subset, self-hosted, with the [lang="si"] line-height
overrides from DESIGN.md.
Switcher in settings, persisted on the profile.

User-entered content (menu names, notes) is not translated. Out of scope.
Numerals: Arabic for now, flagged with the client.

Done when no hardcoded strings remain and the longest Sinhala strings don't
break buttons at any breakpoint.
Commit: feat(i18n): add sinhala language support
```

## 20 — Barcode (phase two)

```
Only after 00-19 ship.

getUserMedia + ZXing on the Inventory screen, "Scan to add" beside "+ Add item".
Match prefills the form, no match opens it blank. Store the barcode on the
record. Manual entry fallback for unreadable codes.

Done when scanning a known barcode prefills the form.
Commit: feat(inventory): add barcode scanning
```

---

## Review prompt

Run every 4–5 steps, in a fresh context:

```
Audit the repo against ARCHITECTURE.md and CLAUDE.md. Report only violations,
no summary of what's fine:

1. git log --oneline -40 — any AI attribution, co-author trailers, emoji?
2. Any float arithmetic on money? Any toFixed outside format.ts?
3. Any inline Supabase calls in components instead of lib/queries?
4. Any table with RLS disabled or no policy?
5. Any multi-step client-side write that should be an RPC?
6. Any hardcoded LKR string, date format, or user-facing string?
7. Any invariant in ARCHITECTURE.md §Invariants now violated?
8. Any screen broken in landscape or at tablet width?

List findings with file and line. Propose fixes, don't apply them yet.
```

## Recovery prompt

When something's wrong and the cause isn't obvious:

```
Don't fix anything yet. Read LOG.md and the last 10 commits. Describe what
the current state actually is versus what STEPS.md says it should be, and
where they diverged. Then propose the smallest correction.
```

---

## Client blockers

Track in LOG.md. None stop the steps above, but they gate launch.

| # | Question | Gates |
|---|---|---|
| 1 | Printer make, model, connection (LAN or USB) | 18 |
| 2 | Points redemption value — 1 pt = 1 LKR is a 100% discount | 12 |
| 3 | Sinhala numerals or Arabic | 19 |
| 4 | Full order source list beyond dine-in | 09 |
| 5 | Scope: Bookings, Employees, Settings | 17 |
| 6 | Platform Earnings — what is it, is it internal | 14 |
| 7 | Brand palette and logo artwork | 06, 17 |
| 8 | Tax filing periods needed | 16 |
| 9 | Which items are zero-rated or exempt | 16 |
