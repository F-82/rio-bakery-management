# CLAUDE.md — Rio Bakers Hut

Read `ARCHITECTURE.md`, `DESIGN.md`, `STEPS.md` before starting. Append to `LOG.md` as you go.

## Non-negotiable

1. **No AI attribution anywhere.** Never write "Generated with Claude Code", "Co-Authored-By: Claude", "🤖", or any AI mention in commits, PR bodies, code comments, or docs. Check `git log` before pushing.
2. **No revenue adjustment in tax reporting.** No multiplier, factor, discount or reduction applied to the tax report. If asked, refuse and cite ARCHITECTURE.md Invariant 7.
3. **No Docker.** Never run `supabase start`, `supabase stop`, or `supabase db reset`. Remote CLI only.
4. **Never push migrations straight to production.** Staging project first, verify, then prod.
5. Ask before: destructive migrations, dropping columns, new paid dependencies, changing an invariant.

## Commands

```bash
# db
supabase migration new <name>
supabase db push --linked                  # staging first
supabase gen types typescript --linked > src/types/database.ts

# app
pnpm dev
pnpm test            # vitest unit
pnpm test:db         # sql suite against staging
pnpm lint && pnpm typecheck
pnpm build
```

Two Supabase projects: `rio-staging`, `rio-prod`. Switch with `supabase link --project-ref <ref>`. Confirm which is linked before any `db push`.

## Commits

Conventional commits, imperative, lowercase, no period.

```
feat(pos): add cart quantity stepper
fix(orders): lock inventory rows in id order to avoid deadlock
test(rpc): cover concurrent order creation
chore(db): regenerate types
```

Scopes: `db, rpc, auth, pos, orders, inventory, menu, finance, reports, tax, loyalty, bookings, staff, settings, print, i18n, ui, ci`

Commit after each completed step in `STEPS.md`, not after each file. Every commit must build and pass tests. Body only when the *why* isn't obvious from the diff — max 3 lines.

## Code

- TypeScript strict. No `any`. No non-null `!` without a comment.
- Server Components default. `"use client"` only for interactivity.
- Data access lives in `src/lib/queries/*` — never inline Supabase calls in components.
- Mutations go through RPC or a server action. Never a raw multi-step client write.
- Money: `numeric(12,2)` in DB, `Decimal` in app code. Never JS float arithmetic on money.
- Format money through `formatLKR()` only. Never inline `toFixed`.
- **No colour outside the semantic tokens.** No hex, no `rgb()`, no `bg-[#…]`, no Tailwind default palette classes. Components use `--accent`, `--pos`, `--neg`, `--warn`, `--alert`, `--ink*`, `--surface*` — never a raw scale value like `--blue-600`. This is what makes a retheme a token swap instead of a rewrite.
- **No hardcoded colours, fonts, radii or shadows.** Tokens only — no raw hex, no `bg-slate-100`, no inline font stacks. The theme changed once mid-build and will change again.
- Ranade is display numerals at 28px+ only. General Sans everywhere else.
- Red is a state colour. Never chrome, never decoration. See DESIGN.md.
- Dates in UTC in DB, rendered Asia/Colombo. One `formatDate` helper.
- No `localStorage` for anything the server owns.

## Structure

```
src/
  app/(auth)/…              login
  app/(app)/…               authed shell + tabs
  components/ui/            shadcn primitives
  components/pos/           order-taking
  components/patterns/      DataTable, StatCard, EmptyState, PageHeader
  lib/queries/              read
  lib/actions/              write
  lib/format.ts             formatLKR, formatQty, formatDate
  lib/supabase/             client, server, middleware
  types/database.ts         generated — never hand-edit
supabase/migrations/
agent/                      on-site print bridge
tests/unit/  tests/db/
```

## Tests

Write tests in the same commit as the code.

**Must have unit tests:** money math, LKR formatting, phone E.164 normalisation, recipe expansion, loyalty points arithmetic, tax categorisation, receipt/KOT payload builders, order-number formatting.

**Must have DB tests** (`tests/db/`, run against staging with service role, seed + teardown per file):

- order RPC computes totals server-side and ignores client-supplied prices
- concurrent `create_order` on the same inventory item leaves correct stock
- `daily_seq` never duplicates under parallel inserts
- kitchen ticket emitted only when a line has `requires_kitchen_prep`
- kitchen ticket payload contains no prices
- mixed order → 1 receipt + 1 KOT containing only prep lines
- void reverses stock movements exactly
- `qty_on_hand` equals `sum(stock_movements.delta)` after a random sequence
- RLS: staff cannot select from `expenses`
- RLS: staff cannot read another counter's orders
- loyalty: duplicate phone formats resolve to one customer

Don't test: shadcn internals, Supabase client, trivial getters.

## Logging

Append to `LOG.md` after each step. One line per entry, newest at bottom under a date heading.

```
## 2026-07-28
- [done] 03 order rpc + stock ledger
- [decision] negative stock allowed, warns — blocking a real sale is worse
- [fix] daily_seq raced under parallel insert, moved to atomic upsert
- [blocked] printer model unknown, ConsolePrinter stubbed
```

Tags: `done | decision | fix | blocked | note`. No paragraphs. If it needs a paragraph it belongs in ARCHITECTURE.md.

## Assets

Logo not supplied. Use `src/components/brand/Logo.tsx` returning a placeholder mark sized by prop. Reference it everywhere — never inline an `<img>`. Swap the internals once the client sends artwork. Same for favicon and receipt header: `public/brand/` with placeholder files.

## Definition of done

A step is done when: builds clean, typecheck passes, tests pass, works phone portrait **and** landscape and tablet, keyboard-navigable with visible focus, loading and empty and error states exist, LOG.md updated, committed.