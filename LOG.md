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
