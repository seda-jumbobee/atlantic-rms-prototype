# Icon tile (Figma node 55:63)

## Icon tile — core primitive

A rounded square containing a centered icon. Used across the app in feature/leg headers and StatCards.

### Anatomy
- Container: flex, items-center justify-center, overflow hidden, **border-radius 10px** (`rounded-[10px]` — not a standard Tailwind step).
- Child icon: centered, exactly half the tile size.

### Sizes (3)
| Size | Tile | Icon |
|---|---|---|
| lg | 40x40 | 20x20 |
| md | 36x36 | 18x18 |
| sm | 32x32 | 16x16 |

Tailwind: `size-10`/`size-9`/`size-8` with icon `size-5`/`size-[18px]`/`size-4`.

### Color variants (2)
1. **Accent variant** (feature/leg headers): background `var(--accent)` (#E9EEE9 in this theme) with a primary-colored icon. Dev note says this is `bg-primary/10` + `text-primary` icon.
2. **Muted variant** (StatCards): background `var(--muted)` (#F6F6F6) with an accent/muted-toned icon.

In the spec examples, the 40px and 36px tiles use the accent background; the three 32px tiles use the muted background.

### Doc-card wrapper context (not part of component, for reference)
The demo swatch row sits in a card: `bg-var(--card)` (white), 1px solid `var(--border)` (#E9E9E9), radius 14px, padding 20px, row gap 16px.

### Typography in the doc block (section labels, not component)
- Title: Heading/H3 — Inter SemiBold 18/26, letter-spacing -0.18px, color `var(--foreground)` (#1A1A1A)
- Description: Caption/Small — Inter Regular 12/16, letter-spacing -0.06px, color `var(--muted-foreground)` (#4C4C4C)

### States
No hover/focus/disabled states shown — static decorative primitive (aria-hidden icon container).

### Suggested implementation
```
iconTile({ size: "sm"|"md"|"lg", variant: "primary"|"muted" })
// base: "flex items-center justify-center rounded-[10px] shrink-0"
// primary: "bg-primary/10 text-primary"
// muted: "bg-muted text-accent" (per dev note; icon rendered as lucide component sized per table)
```
Icons in the Figma are exported bitmaps; in code use the project's icon set (e.g. lucide-react) at the icon sizes above.

## Dev notes (verbatim from Figma)
"Core primitive across the app: a rounded square holding an icon. bg-primary/10 + primary icon (feature/leg headers), or bg-muted + accent icon (StatCards). Sizes 32 / 36 / 40."

## Code target
Likely a shared IconTile primitive in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app (used by feature/leg headers and StatCard components)
