# Architecture — Rio Bakers Hut (BizCore)

Single-tenant now, schema is multi-tenant-ready. Online-only web app. LKR, Asia/Colombo.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind, shadcn/ui |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Migrations | Supabase CLI, remote-only, forward-only |
| Print bridge | Node agent on-site, subscribes to `print_jobs` via Realtime |
| Host | Vercel |

No Docker. No `supabase start`. No `db reset` against a linked project.

## Resolved contradictions

The two source docs disagreed. Rulings:

| Question | Ruling | Source |
|---|---|---|
| Counter split | Bakery Counter + Hot Plate Counter | Flows §2 |
| Menu scoping | **None.** Both counters see the full menu | Flows §2 |
| `counter_id` meaning | Attribution only — which till rang it up. Never a permission | Flows §2 |
| What triggers a kitchen ticket | `requires_kitchen_prep` on the line item | derived |
| `counter_tag` on MenuItem | **Dropped.** Merged into `requires_kitchen_prep` | derived |

Why `counter_tag` is gone: both docs conflated *where sold* with *needs cooking*. Only the second drives behaviour. Client confirmed bakery items "might" need prep (warmed pastries), which makes `is_hot_plate` a lie the moment it happens. One flag, per item, no counter involvement.

## Invariants

Violating any of these is a bug, not a preference.

1. Money is `numeric(12,2)`. Never float, never int-cents.
2. Quantities are `numeric(12,3)` (weights).
3. Prices are computed **server-side** from `menu_items.price`. Client sends `menu_item_id` + `qty` only.
4. Order creation is one RPC, one transaction. Never sequential client inserts.
5. `stock_movements` is append-only. `inventory_items.qty_on_hand` is a denormalised cache updated in the same transaction.
6. Orders are never hard-deleted. Void = status change + reversing stock movements.
7. Tax Report reflects actual recorded revenue. **No adjustment factor, multiplier, or reduction exists anywhere in the codebase.** Lower taxable income comes only from real per-item tax categories and real deductible expenses.
8. RLS is the access boundary. Hiding a tab in React is not access control.
9. Phone numbers stored E.164 only.
10. Every FK to a business-scoped table carries `business_id`.

## Schema

### Identity

```
businesses      id, name, currency, timezone, logo_url, created_at
profiles        id→auth.users, business_id, name, role, counter_id,
                language_pref, active
                role: owner | manager | staff
counters        id, business_id, name, kind, active
                kind: bakery | hot_plate
```

`counter_id` on a profile is a default for order attribution, not a restriction.

### Catalog

```
categories      id, business_id, name, scope, sort_order
                scope: menu | inventory
menu_items      id, business_id, name, price, category_id, image_url,
                available, requires_kitchen_prep, tax_category,
                sort_order, created_at
inventory_items id, business_id, name, category_id, stock_type, base_unit,
                qty_on_hand, low_stock_threshold, unit_cost, barcode, active
                stock_type: ingredient | finished_good | merchandise
recipe_items    id, menu_item_id, inventory_item_id, qty
                unique(menu_item_id, inventory_item_id)
```

**Units.** One canonical `base_unit` per inventory item. `recipe_items.qty` is always in that unit. No conversion table. Flour is stored in `g`, a recipe uses `250`. UI may display kg; storage does not.

**Finished goods unify with ingredients.** A croissant you count on a shelf is an `inventory_item` with `stock_type = finished_good` and a `recipe_items` row pointing at itself, qty 1. A kottu derives from ingredients. Deduction is then one code path with zero branching, and merchandise falls out of the same enum.

### Orders

```
orders          id, business_id, daily_seq, order_number, counter_id,
                created_by, customer_id, source, status,
                subtotal, discount_amount, discount_reason,
                tax_amount, total, payment_method,
                prep_status, prepared_at, prepared_by,
                created_at, completed_at, voided_at, void_reason
                status: open | completed | voided
                prep_status: not_required | pending | prepared
order_items     id, order_id, menu_item_id, name_snapshot, qty,
                unit_price, line_total, requires_kitchen_prep,
                tax_category, notes
daily_counters  business_id, day, last_seq   PK(business_id, day)
```

**Order numbers.** Human-callable, resets daily at Colombo midnight. Allocated atomically inside the RPC:

```sql
insert into daily_counters (business_id, day, last_seq)
values (b, (now() at time zone 'Asia/Colombo')::date, 1)
on conflict (business_id, day)
  do update set last_seq = daily_counters.last_seq + 1
returning last_seq;
```

Displayed 3-digit (`047`). Printed large on **both** the customer receipt and the kitchen ticket — this is what lets the chef match a KOT to a waiting customer, and it closes the open question in Eng Spec §4.5.

**Snapshots.** `name_snapshot`, `unit_price`, `requires_kitchen_prep` and `tax_category` are copied onto the line at order time. Renaming or deleting a menu item must never alter a historical receipt or tax figure.

**Kitchen state is not payment state.** A completed order containing any prep
line starts with `prep_status = pending`. Hot-plate staff mark it `prepared`
from the kitchen queue; this never changes `status`, totals, payment, or
`completed_at`, so clearing the queue cannot remove recorded revenue.

### Stock ledger

```
stock_movements id, business_id, inventory_item_id, delta, reason,
                ref_order_id, ref_user_id, note, created_at
                reason: order_deduction | order_void | purchase |
                        wastage | manual_adjustment | stocktake
```

Append-only. `qty_on_hand` is derivable by summing deltas — the column exists for query speed, and a nightly reconciliation job asserts they agree. Without this the owner cannot answer "why does flour say 3kg when I bought 20."

Negative stock is **allowed** and surfaces a warning. Blocking a real sale because the system thinks flour hit zero is worse than a negative number. Configurable per business in `settings`.

### Printing

```
print_jobs      id, business_id, order_id, target, payload jsonb,
                status, attempts, last_error, created_at, updated_at
                target: customer_receipt | kitchen_ticket
                status: queued | printing | done | failed
```

Print jobs are rows because §4.5 requires failure surfacing and reprint, which means state. Reprint inserts a **new** row against the same order; it never mutates the old one.

`kitchen_ticket` is emitted only if at least one line has `requires_kitchen_prep = true`. Payload contains only those lines, no prices, plus the order number.

**Browsers cannot reach ESC/POS printers.** No raw TCP from JS. A small Node agent runs on the counter machine, subscribes to `print_jobs` via Realtime, renders ESC/POS, updates status. Tell the client early — something has to stay powered on at the shop. WebUSB is Chrome-only and needs a user gesture per session; not viable for a till.

Printer make/model is unknown. Build the queue and a `ConsolePrinter` driver now; the real driver is one interface implementation later.

### Money

```
expenses        id, business_id, date, category, amount, note,
                is_tax_deductible, receipt_url, created_by
```

### Loyalty

```
customers            id, business_id, name, phone_e164, loyalty_points,
                     is_priority, priority_note, total_spend, order_count,
                     first_order_at, last_order_at
                     unique(business_id, phone_e164)
loyalty_transactions id, customer_id, order_id, points_earned,
                     points_redeemed, balance_after, created_at
```

**Phone normalisation is mandatory before insert.** Sri Lankan numbers arrive as `0771234567`, `+94771234567`, `771234567`. Normalise to `+94771234567` or you get three records for one customer and the loyalty balance splits. Unique index enforces it.

**Priority customers** are both manual and derived. `is_priority` is an owner toggle for the regular they want recognised by name. A `priority_customers` view ranks by `total_spend` and `order_count` over a rolling window. Owner needs both; neither alone is enough.

**Rates are settings, not constants:**

| Setting | Default | Note |
|---|---|---|
| `loyalty.earn_points_per_lkr` | `1` | client-specified |
| `loyalty.redeem_lkr_per_point` | `0.01` | **needs owner sign-off** |

At earn 1/LKR, a redemption rate of 1 LKR per point is a 100% discount on everything. `0.01` gives 1% back, which is a normal programme. Confirm before launch.

### Bookings, config

```
bookings        id, business_id, date, time, party_size, customer_id,
                customer_name, phone, status, source, notes
settings        business_id, key, value jsonb   PK(business_id, key)
```

## The order RPC

`create_order(payload jsonb) returns jsonb` — the single most important piece of code in the system.

```
1. Validate payload, resolve profile → business_id, counter_id
2. Resolve menu_items, compute line_total and subtotal SERVER-SIDE
3. Lock affected inventory rows: SELECT ... FOR UPDATE
   ORDER BY inventory_item_id   ← ordering prevents deadlock between tills
4. Allocate daily_seq (atomic upsert above)
5. Insert order + order_items with snapshots
6. Expand recipes → insert stock_movements, update qty_on_hand
7. Loyalty: accrue points; apply redemption if staff flagged it
8. Insert print_jobs (customer_receipt always; kitchen_ticket conditionally)
9. Return { order_id, order_number, total, low_stock_warnings[] }
```

Two tills writing concurrently to the same stock rows without step 3 produces wrong counts within a week of real service.

## RLS

| Table | owner | manager | staff |
|---|---|---|---|
| orders | all | all | insert + read own counter, today |
| order_items | all | all | via order |
| menu_items | write | write | read |
| inventory_items | write | write | read (needs stock to sell) |
| stock_movements | all | all | insert via RPC only |
| expenses | all | read + insert | **none** |
| customers | all | all | read + insert (loyalty lookup) |
| print_jobs | all | all | read + reprint own |
| profiles | all | all | read self |
| settings | write | write | read public keys |

Managers have the owner's operational access, but their app navigation omits
Dashboard. Their Revenue screen exposes revenue and expense entry only; it
does not expose expense totals, net profit, the expense ledger, or platform
earnings.

Staff having zero access to `expenses` is a policy, not a hidden tab.

## Tax Report

Per Flows §5 and Eng Spec §4.3, unmodified:

- Gross revenue = actual sum of completed order totals for the period
- Split by `tax_category` on the line item (standard / zero-rated / exempt)
- Itemised deductible expenses where `is_tax_deductible = true`
- Net taxable income = taxable revenue − deductions
- Date range: monthly / quarterly / annual
- Export CSV + PDF

There is no revenue multiplier, adjustment factor, or reduction setting. If a future request asks for one, it is out of scope — see Invariant 7.

## Deferred

| Item | Why |
|---|---|
| Barcode / QR scan | Flows §4 — phase two, menu-linked flow is primary |
| Offline mode | Client confirmed online-only |
| Multi-tenant UI | Schema ready, no UI until a second client exists |
| Real printer driver | Hardware unknown |
