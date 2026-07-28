# Build Steps — Rio Bakers Hut

Each step has a paste-ready prompt. Sequential. Do not start a step while the previous one fails tests.

Backend before frontend: the order RPC, RLS and print queue constrain every screen. Building UI first means rebuilding it.

## How to run this

- `CLAUDE.md` is auto-loaded every session. Prompts don't repeat its rules.
- **`/clear` between steps.** State lives in the docs and the repo, not the conversation. Carrying context across steps burns tokens and drifts.
- Run the review prompt (bottom) every 4–5 steps.
- ★ = the steps that carry the product. Slow down there.
- **T0–T3 sit between 09 and 10.** DESIGN.md is at v2; the visual direction changed mid-build. Run the T series before continuing 10.

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

> **Superseded.** This was built against DESIGN.md v1 (warm sand). v2 replaces it — see §R. Kept for history; don't run it again.

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

---

# Re-theme — T0 to T3

**Insert here. Run before resuming 10.** DESIGN.md v2 changes the direction from warm sand to cool neutral with a blue accent, green data, red reserved for state.

Do all four on `feat/retheme`. T1 and T2 are deliberately separate: T1 changes code with no visual change, T2 changes values with almost no code. If a screen breaks after a combined commit you cannot tell which caused it.

## T0 — Audit

```
DESIGN.md has been rewritten. Direction changed from warm sand to cool
neutral, blue accent. Read it, then audit. Do not change any code yet.

git checkout -b feat/retheme

Report on everything built in steps 06-10:
1. Every hardcoded colour — hex, rgb, hsl, or a Tailwind palette class like
   bg-amber-50 / text-stone-600 — outside the token definitions.
2. Every hardcoded font family or weight outside the font config.
3. Every hardcoded radius, shadow or spacing value not on the scale.
4. Any component that assumes a warm canvas — a hardcoded white expected to
   sit on sand, a border tuned for low contrast, a shadow doing work a
   border should do.

Output a table: file, line, current value, token it should use.

Do not edit anything. I want the blast radius before we touch it.
```

## T1 — Normalise

```
Using the T0 table, replace every hardcoded value with the correct token from
the CURRENT palette. Values stay visually identical.

This step must produce zero visual change. Do not touch token values yet —
only the code consuming them.

Verify /kitchen-sink, POS, orders and dashboard render identically before and
after. If anything shifts, you substituted the wrong token.

Commit: refactor(ui): replace hardcoded styles with design tokens
```

## T2 — Swap ★

```
Read DESIGN.md in full. This is v2.

Rewrite the token layer only:
- Tailwind config and CSS vars to the v2 palette
- Fonts: General Sans becomes primary for all UI including body and tables.
  Ranade Light survives only for display numerals at 28px+. Remove Ranade
  from every other role.
- Radii 20/14/999/8, hairline borders, no shadows

Then bring these to the v2 structural language:
- New IconChip component, 32px --ink circle with white glyph
- StatCard gains an IconChip top-left
- Pill tab groups sit on --surface-2
- PrintStatus failed state: --alert-soft fill, --alert border and text
- Context band using --accent-soft where a screen has situational header content

Enforce the red rule from DESIGN.md §"Blue and red never fight" — destructive
actions become text or outline buttons, filled red only inside a confirm modal.

This should be a small diff. If it isn't, T1 missed hardcoded values — stop
and tell me rather than pushing through.

Commit: feat(ui): retheme to cool neutral palette with blue accent
```

## T3 — Verify

```
Walk every screen built so far — kitchen sink, login, shell, POS, orders,
inventory — at phone portrait, phone landscape, tablet, desktop.

Per screen:
- Body text ≥4.5:1 against the new --bg
- Focus rings visible in --accent
- No filled --accent button adjacent to a filled --alert button
- Nothing still reading as warm or sand-toned
- Tabular numerals still aligned in tables
- Order number treatment intact on the POS confirm screen and orders list
- Landscape rail and portrait pill both correct

Fix regressions. Report anything ambiguous instead of guessing.

Commit: fix(ui): resolve retheme regressions
```

Then merge `feat/retheme` and resume below.

---

## 10 — Inventory

Partially built before the re-theme. Re-read DESIGN.md before continuing.

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

---

## R — Retheme

> **Superseded.** This five-sub-step plan (R1–R5) was written before the T0–T3 series above existed. T0–T3 ran instead — audit, normalise, swap, verify — and are done: v2 tokens are live in `globals.css`, structural primitives (IconChip, pill tabs, accent panel) exist, and T3 already covers R5's contrast/alert/focus checks plus fixes R5 doesn't mention (`--alert-strong`/`--neg-strong` for the two token/background pairings that failed 4.5:1). See LOG.md 2026-07-27/28. Kept below for history — don't run it.

Runs once, after 10, before 11. Everything built in 06–10 follows DESIGN.md v1 (warm sand) and moves to v2 (light neutral, blue, green).

**Commit step 10 as-is first**, old theme and all, so the retheme lands as one clean diff over working screens rather than tangling with unfinished work.

Five sub-steps. Run each in its own context, commit each. Don't let it attempt the whole thing in one pass.

### R1 — Tokens

```
DESIGN.md has been fully replaced. Read it — v2, light neutral canvas with a
blue accent and green for positive. Ignore everything you remember about the
warm sand palette.

This sub-step is tokens only. Do not touch components yet.

Replace the palette in the Tailwind config and CSS vars with DESIGN.md
§Palette exactly, including the semantic aliases and --accent-grad.
Update radii per §Space & shape — they went up.
Type stack is unchanged.

Semantic alias names that survived v1: --accent, --pos, --neg, --warn,
--alert, --alert-bg, --focus. Anything referencing those keeps working.
Names that are gone: --surface-alt, --accent-ink, --ink (redefined).

Report which token names changed meaning so I know what to expect visually.
Commit: refactor(ui): replace design tokens with v2 palette
```

### R2 — Hardcoded colour audit

```
Find every colour that isn't a semantic token. This is what decides whether
the retheme is smooth or not.

Grep the whole src/ tree for:
- hex literals
- rgb( and hsl( and oklch(
- Tailwind arbitrary colour values: bg-[#, text-[#, border-[#
- Tailwind default palette classes: bg-amber-, text-stone-, bg-orange-,
  bg-neutral-, bg-slate- etc — anything not routed through our tokens
- inline style props carrying colour

For each hit: replace with the right semantic alias. Where none fits, stop
and tell me rather than inventing one.

Do not change layout or structure in this sub-step. Colour only.

Done when the grep returns nothing outside the token definition file.
Commit: refactor(ui): route all colour through semantic tokens
```

### R3 — Structural primitives

```
Read DESIGN.md §Structural language and §Components.

Three new primitives:
- IconChip — 36px (40 on tablet+) true-black circle, white icon
- TabPills — recessed --surface-2 track, white active pill, replaces every
  underline tab group in the app
- AccentPanel — --accent-grad, radius 28, black text, one per screen max

Then update existing primitives:
- Card: white on --bg, radius 28, minimal elevation, no border
- StatCard: leads with an IconChip
- EmptyState: leads with an IconChip
- Buttons: primary is --black/--on-black pill, secondary --surface-2/--ink,
  destructive --alert/white. Blue is selection and focus only, never a button
  fill — that's what keeps it calm.

Update /kitchen-sink to cover the three new primitives. It's the fastest way
to verify the rest of this step, which is why we kept it.

Done when kitchen-sink is correct at all four breakpoints.
Commit: feat(ui): add icon chip, pill tabs and accent panel primitives
```

### R4 — Screen pass

```
Apply v2 across the screens built so far, one at a time, in this order:
shell → POS → orders → inventory.

Per screen:
- Swap underline tabs for TabPills
- Add IconChips to cards and empty states
- Place exactly one AccentPanel where DESIGN.md §Structural language says it
  goes for that screen — POS gets cart total, inventory gets low-stock summary
  when non-empty. If a screen has two, cut one.
- Left rail spec per §Responsive: 64px, --surface, active icon --ink on an
  --accent-tint rounded square
- Confirm the POS density exception still holds — ~60% vertical rhythm there,
  full generosity elsewhere

Check each screen at phone portrait, phone landscape, tablet, desktop before
moving to the next. Don't batch all four screens then check.

Done when every built screen matches v2 at every breakpoint.
Commit: feat(ui): apply v2 theme across shell, pos, orders and inventory
```

### R5 — Verify

```
No code changes unless something's broken.

1. Contrast: every body text pairing ≥4.5:1, every large text ≥3:1. Report
   failures with the actual ratio.
2. --alert appears only on errors, voids, failed print jobs and negative
   deltas. Nowhere decorative. Red is alarm-only in v2.
3. One AccentPanel per screen, no more.
4. Focus rings visible on every interactive element, using --focus.
5. Failed kitchen ticket still unmissable — this is the state the whole
   colour system is built around. Trigger it and look at it.
6. prefers-reduced-motion still respected.

Then update DESIGN.md if reality diverged from the spec anywhere, and log it.
Commit: chore(ui): verify v2 theme accessibility and semantics
```

---

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
9. Any colour outside the semantic tokens — hex, rgb(), bg-[#, or a Tailwind
   default palette class?
10. Any hardcoded font or radius outside the token layer?
11. Any screen with more than one AccentPanel, or --alert used decoratively?
12. Any filled --alert button sitting next to a filled --accent button?
13. Any font other than General Sans anywhere (Ranade is removed, DESIGN.md §Type)?

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