# Design — Rio Bakers Hut

**v2 — supersedes the warm-sand direction entirely.** Anything built before the retheme step follows v1 and must be migrated. See STEPS.md §R.

Direction: light neutral canvas, white cards, true-black controls, one luminous blue accent, green for positive. Reference is the travel-planner UI supplied 27 Jul.

## Why blue and green, and where red went

Brand is blue and red. Blue and red at similar saturation vibrate against each other and are genuinely tiring over an eight-hour shift, so they don't share the interface as peers.

- **Blue carries the interface.** Accent, selection, focus, the soft gradient panel.
- **Green carries positive meaning.** Revenue up, in stock, paid, completed. Matches the NeuralShift mark.
- **Red keeps its brand presence by owning alarm.** Errors, voids, failed kitchen tickets, negative deltas. Nowhere else.

Red isn't demoted — it's given the one job where its intensity is an asset instead of a liability. On a blue-and-green screen, red reads as *stop* the instant it appears. That's exactly what a failed kitchen ticket needs.

## Palette

```css
/* neutrals */
--bg:         #F1F2F4;   /* app canvas */
--surface:    #FFFFFF;   /* cards */
--surface-2:  #F7F8FA;   /* recessed tracks, input wells */
--line:       #E5E7EB;   /* hairlines */
--ink:        #0A0B0D;   /* primary text — reads black, softer than #000 */
--ink-2:      #5B6169;   /* secondary */
--ink-3:      #9BA1A9;   /* tertiary, placeholder */
--black:      #000000;   /* icon chips, primary buttons — true black, per reference */
--on-black:   #FFFFFF;

/* blue — accent */
--blue-700:   #0E3FA6;   /* pressed */
--blue-600:   #1657DB;   /* primary accent */
--blue-500:   #2E74F5;   /* hover */
--blue-100:   #D8E4FF;   /* soft panel */
--blue-50:    #EFF4FF;   /* tint, selected row */

/* green — positive. CONFIRM against neuralshift.lk and swap this one value */
--green-600:  #0C9762;
--green-500:  #12B274;
--green-50:   #E3F6ED;

/* red — brand, alarm only */
--red-700:    #B42318;
--red-600:    #D92D20;
--red-50:     #FDECEA;

/* amber — caution */
--amber-600:  #C77A11;
--amber-50:   #FDF3E4;

/* semantic aliases — components use ONLY these */
--accent:      var(--blue-600);
--accent-soft: var(--blue-100);
--accent-tint: var(--blue-50);
--pos:         var(--green-600);
--neg:         var(--red-600);
--warn:        var(--amber-600);
--alert:       var(--red-600);
--alert-bg:    var(--red-50);
--focus:       var(--blue-600);
```

Accent gradient, for the one luminous panel:

```css
--accent-grad: linear-gradient(158deg, #EFF4FF 0%, #C7DAFF 100%);
```

Black text sits on it. It is never used behind small text.

**Components reference semantic aliases only.** Never `--blue-600` directly, never a hex. That discipline is what made this retheme a token swap instead of a rewrite — keep it.

## Type

Existing stack stays: **Ranade** (display, numerals) + **General Sans** (headers, UI). Both self-hosted woff2 via `next/font/local`.

The reference specifies Outfit. General Sans occupies the same geometric-sans register and is already wired, and Ranade at display size gives the order number more character than Outfit would. If you want Outfit anyway it's a single change — swap the two `next/font/local` declarations and the two font-family vars, nothing else moves.

| Role | Face | Weight |
|---|---|---|
| Display, numerals | Ranade | Light 300 |
| Body, dense rows | Ranade | Regular 400 |
| Headers, buttons, labels | General Sans | Semibold 600 |
| Micro-labels, eyebrows | General Sans | Medium 500 |

**Ranade Light floor is 20px.** Below that, Regular. It disappears at 14px on a bright counter screen.

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

`font-variant-numeric: tabular-nums` on all money and quantity. Columns align or they're wrong.

### Sinhala

Neither face carries Sinhala. Fallback `Noto Sans Sinhala`, self-hosted, subset. Needs **~1.4× Latin line-height** — set `[lang="si"]` overrides in the token layer now, not in step 19.

## Space & shape

4px base. Use `2 3 4 6 8 12 16 20 24` only.

| | v2 |
|---|---|
| Radius card | 28px |
| Radius control, tile | 16px |
| Radius pill, chip | 999px |
| Radius badge | 8px |
| Hairline | 1px `--line` |
| Elevation | `0 1px 2px rgba(10,11,13,.04)` on cards. Nothing heavier |

Radii went up from v1. The reference is soft and generous — commit to it, don't split the difference.

## Structural language

Four devices carry the look. Use them consistently or the theme reads as a recolor.

**1. Black icon chip.** Every card leads with a circular true-black chip, 36px (40px on tablet+), white icon inside, top-left. It's how a card announces what it is before you read it. Applies to StatCard, section headers, empty states. Not to table rows.

**2. Pill tabs in a recessed track.** Tab groups sit in a `--surface-2` rounded track; the active tab is a white pill with subtle elevation. Used for Active/Archived, Finance tabs, Reports type, period selectors. Replaces v1's underline tabs everywhere.

**3. The luminous panel.** One `--accent-grad` panel per screen, maximum. It marks the thing the user is there to do:

| Screen | Panel |
|---|---|
| POS | Cart total + confirm |
| Order success | The order number |
| Dashboard | Today's sales |
| Inventory | Low-stock summary when non-empty |

Two panels on one screen means neither is the point. Cut one.

**4. White on grey.** Cards are pure white on `--bg`. Separation comes from tone, not borders or shadow. Don't outline a white card on grey — it's already separated.

## Touch

| | Min |
|---|---|
| Any tap target | 44px |
| POS menu tile | 56px tall |
| Qty stepper | 44 × 44 |
| Primary action bar | 56px |
| Gap between destructive and adjacent target | 12px |

## Responsive

Mobile-first. Landscape and tablet are first-class — staff prop a tablet on the counter.

| Class | Condition | Nav | POS | Tables |
|---|---|---|---|---|
| `phone-p` | <768, portrait | bottom pill | grid + cart sheet | card list |
| `phone-l` | <900, landscape | left icon rail | grid 55 / cart 45 | card list |
| `tablet` | 768–1199 | left icon rail | grid 60 / cart 40 | table |
| `desktop` | ≥1200 | left rail, icon + label | grid 65 / cart 35 | table |

**Bottom nav dies in landscape.** Vertical space is the scarce axis; a 64px bar plus a header leaves nothing. Left rail from any landscape viewport up — which is also what the reference does, so the two directions agree.

Rail spec: 64px wide, `--surface`, icons `--ink-2`, active icon `--ink` on a `--accent-tint` rounded square. Profile avatar bottom, then settings, then sign out.

Other landscape rules:
- Header collapses to 44px, title inline with actions
- Bottom sheets become right-side drawers
- Modals cap 560px, centred, never full-screen
- `env(safe-area-inset-*)` on all four sides — the notch is on the side in landscape

Never hide functionality at a breakpoint. Rearrange only.

## Navigation

Nine tabs don't fit a pill. Solved by role, not a More menu.

**Staff** — `Orders` · `Menu` · `Inventory`
**Owner / manager** — `Dashboard` · `Orders` · `Inventory` · `Finance` · `More`

More sheet: Menu, Bookings, Employees, Reports, Tax, Settings.

Mirrors the RLS boundary — staff can't load Finance, so it isn't in their nav.

Badges: filled dot with numeral. `--warn` for low stock, `--alert` for failed prints, `--accent` for pending orders.

## The POS screen is dense on purpose

The reference is airy because it's a browsing surface. A till is a speed tool.

On the order screen only: vertical rhythm at ~60% of the values above. Category pills pinned top, scrollable tile grid, cart always visible or one tap away, running total permanently on screen. Keep the palette, radii and type — drop the whitespace.

Menu tiles are white cards with the item name in `h3` and price in `num`. No image on the tile below tablet — images slow scanning and the staff know the menu.

Every other screen gets full generosity.

Cart feedback is instant and local. Optimistic add, no spinner, no round trip before the tile responds.

## Signature

**The order number.** Rio calls numbers across a counter, so the number is what the design should make unmissable.

Ranade Light at `display` size on the `--accent-grad` panel — the only place Light runs at full size, and the only luminous panel on that screen. Identical treatment on the confirm screen, the customer receipt, the kitchen ticket, and as the leading column of the orders list. `047` is recognisable whether it's on a thermal slip in the chef's hand or on the till.

Functional as well as visual: it's what matches a KOT to a waiting customer.

## Components

| Component | v2 notes |
|---|---|
| `Card` | White, radius 28, hairline-free, minimal elevation |
| `IconChip` | **New.** 36/40px true-black circle, white icon. Leads every card |
| `TabPills` | **New.** Recessed `--surface-2` track, white active pill. Replaces underline tabs |
| `AccentPanel` | **New.** `--accent-grad`, radius 28, black text. One per screen |
| `StatCard` | IconChip, `micro` label, `num-lg` value, delta chip `--pos`/`--neg` |
| `DataTable` | Table ≥768, card list below. Shared column config |
| `EmptyState` | IconChip, one line of what belongs here, one primary action |
| `PrintStatus` | queued / printing / done / **failed**. Failed uses `--alert` with inline Reprint, not dismissable until resolved |
| `CounterBadge` | Bakery / Hot Plate on every order row. Attribution, not a filter |
| `LowStockBadge` | `--warn`. Negative stock shows the negative number in `--alert`, never clamped to zero |
| `PriorityStar` | Filled = manual `is_priority`, outline = derived top spender |

Buttons: primary is `--black` with `--on-black`, pill. Secondary is `--surface-2` with `--ink`. Destructive is `--alert` with white. Accent-blue is for selection and focus, not for buttons — that's what keeps the blue calm.

## Copy

Sentence case. Active voice. An action keeps its name end to end: a button reading "Complete order" produces a toast reading "Order completed".

Errors say what happened and what to do: "Kitchen printer didn't respond. The order is saved — tap Reprint or hand the ticket over." Not "An error occurred."

Empty states invite: "No orders yet today. Take the first one." Not "No records."

## Floor

Per screen: visible keyboard focus using `--focus`, `prefers-reduced-motion` respected, body contrast ≥4.5:1, one-handed in portrait, propped in landscape, no layout shift on load.