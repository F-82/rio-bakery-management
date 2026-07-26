# Design — Rio Bakers Hut

Direction is set by the supplied reference (warm sand, near-black actions, generous radii). Follow it. Where the reference is a consumer browsing app and this is a till, diverge deliberately — those divergences are listed and justified below.

## Palette

```css
--bg:          #F4EBE2;   /* app background, warm sand */
--surface:     #FCF8F4;   /* cards, sheets */
--surface-alt: #EFE4D9;   /* inset rows, chart fills */
--ink:         #241C17;   /* primary text, primary buttons */
--ink-2:       #6B5C51;   /* secondary text, labels */
--ink-3:       #A09083;   /* placeholders, disabled */
--line:        #E4D7C9;   /* hairlines, borders */

--accent-ink:  #FCF8F4;   /* text on --ink */
--pos:         #3E9B63;   /* revenue up, in stock, paid */
--neg:         #C0493F;   /* revenue down, refunds */
--warn:        #C97A28;   /* low stock, pending */

--alert:       #B3261E;   /* SEE BELOW */
--alert-ink:   #FFFFFF;
--alert-bg:    #FDECEA;
```

**`--alert` deliberately breaks the palette.** The reference's low contrast is beautiful until you need to tell a cashier the kitchen printer just failed and the chef never got the order. Failed print jobs, void confirmations, and destructive actions use `--alert` at full saturation with white text. Everything else stays quiet. This is the one place we're allowed to be loud.

Dark mode: not in v1. Tokens are structured for it later.

## Type

Self-host via `next/font/local` as woff2. Do not link the Fontshare CDN — blocking request plus FOUT.

| Role | Face | Weight |
|---|---|---|
| Display / numerals | Ranade | Light 300 |
| Body, dense rows | Ranade | Regular 400 |
| Headers, buttons, labels, table headers | General Sans | Semibold 600 |
| Micro-labels, eyebrows | General Sans | Medium 500 |

**Ranade Light has a floor of 20px.** Below that it disappears on a bright counter screen with a queue waiting. Anything ≤18px uses Ranade Regular. Same typeface, same character, actually readable at arm's length in daylight.

### Scale

| Token | Size / LH | Face |
|---|---|---|
| `display` | 44 / 48 | Ranade Light |
| `h1` | 28 / 34 | Ranade Light |
| `h2` | 20 / 26 | General Sans Semibold |
| `h3` | 17 / 24 | General Sans Semibold |
| `body` | 16 / 24 | Ranade Regular |
| `body-sm` | 14 / 20 | Ranade Regular |
| `label` | 13 / 18 | General Sans Medium, +0.02em |
| `micro` | 11 / 16 | General Sans Medium, +0.06em, uppercase |
| `num-lg` | 34 / 38 | Ranade Light, tabular |
| `num` | 16 / 22 | Ranade Regular, tabular |

All money and quantity uses `font-variant-numeric: tabular-nums`. Columns must align.

### Sinhala

Neither face has Sinhala glyphs. Fallback stack `Noto Sans Sinhala`, self-hosted, subset. Sinhala needs **~1.4× the line-height** of Latin — set `[lang="si"]` line-height overrides in the token layer now, not in the i18n phase. Test the longest strings; Sinhala UI copy runs longer and will break tight buttons.

## Space & shape

4px base. Use `2 3 4 6 8 12 16 20 24` only.

| | |
|---|---|
| Radius card | 24px |
| Radius input / tile | 16px |
| Radius button | 999px (pill) |
| Radius badge | 8px |
| Hairline | 1px `--line` |
| Elevation | none. Separate with `--surface` on `--bg` |

No drop shadows. The reference gets depth from tone, not shadow.

## Touch

| | Min |
|---|---|
| Any tap target | 44px |
| POS menu tile | 56px tall |
| POS qty stepper | 44 × 44 |
| Primary action bar | 56px |

Spacing between adjacent destructive and non-destructive targets: ≥12px.

## Responsive

Mobile-first, but landscape and tablet are first-class — staff will prop a tablet on the counter.

| Class | Condition | Nav | POS | Tables |
|---|---|---|---|---|
| `phone-p` | <768, portrait | bottom pill | grid + cart bottom sheet | card list |
| `phone-l` | <900, landscape | left rail, icons only | grid 55 / cart 45 | card list |
| `tablet` | 768–1199 | left rail, icons only | grid 60 / cart 40 | real table |
| `desktop` | ≥1200 | left rail, icon + label | grid 65 / cart 35 | real table |

**Bottom nav dies in landscape.** Vertical space is the scarce axis there; a 64px bar plus a header leaves nothing. Switch to a left rail on any landscape viewport. Same nav items, same order, same active state.

Other landscape rules:
- Header collapses to 44px, page title inline with actions
- Bottom sheets become right-side drawers
- Modals cap at 560px wide, vertically centred, never full-screen
- Respect `env(safe-area-inset-*)` on all four sides — notch is on the side in landscape

Never hide functionality at a breakpoint. Rearrange only.

## Navigation

Nine tabs do not fit a pill. Solve with roles, not a "More" menu.

**Staff** — 3 tabs: `Orders` · `Menu` · `Inventory`
**Owner / manager** — 5 tabs: `Dashboard` · `Orders` · `Inventory` · `Finance` · `More`

`More` sheet: Menu, Bookings, Employees, Reports, Tax, Settings.

Both fit comfortably and it mirrors the RLS boundary — staff literally cannot load Finance, so it should not be in their nav.

Badges: Inventory shows low-stock count, Orders shows pending count. Bell in header shows unread. Badge is a filled dot with a numeral, `--warn` for stock, `--alert` for failed prints.

## The POS screen is dense on purpose

The reference's airy list is right for scanning five favourites. It is wrong for picking from sixty items during a morning rush.

On the order screen only: reduce vertical rhythm to ~60% of the reference. Category tabs pinned top, scrollable tile grid, cart always visible or one tap away, running total permanently on screen. Keep the colours, radii and type — drop the whitespace.

Every other screen gets the reference's full generosity.

Cart feedback must be instant and local. Optimistic add, no spinner, no round trip before the tile responds.

## Signature

**The order number.** Rio calls numbers out across a counter, so the number is the one thing the design should make unmissable.

Set in Ranade Light at `display` size — the only place the Light weight runs at full size — appearing identically on the confirm screen, the customer receipt, the kitchen ticket, and as the leading column of the orders list. Same treatment every time, so `047` is recognisable whether it's on a thermal slip in the chef's hand or on the till.

This is also functional: it closes the KOT-to-receipt matching question in the spec.

## Component notes

| Component | Notes |
|---|---|
| `StatCard` | label `micro`, value `num-lg`, delta chip `--pos`/`--neg`. Never a gradient |
| `DataTable` | table ≥768, card list below. One shared column config |
| `EmptyState` | icon, one line of what goes here, one primary action. Never "No data found" |
| `PrintStatus` | queued / printing / done / **failed**. Failed uses `--alert` with a Reprint button inline. Cannot be dismissed until resolved |
| `CounterBadge` | Bakery / Hot Plate on every order row. Attribution, not a filter on what's orderable |
| `LowStockBadge` | `--warn`. Negative stock shows the negative number in `--alert`, not zero |
| `PriorityStar` | on customer rows. Filled = manual `is_priority`, outline = derived top-spender |

## Copy

Sentence case throughout. Active voice. An action keeps its name end to end — a button that says "Complete order" produces a toast that says "Order completed".

Errors say what happened and what to do: "Kitchen printer didn't respond. The order is saved — tap Reprint or hand the ticket over." Not "An error occurred."

Empty states invite: "No orders yet today. Take the first one." Not "No records."

## Floor

Non-negotiable per screen: visible keyboard focus, `prefers-reduced-motion` respected, contrast ≥4.5:1 for body text, works one-handed in portrait, works propped in landscape, no layout shift on load.
