# Card (Figma node 45:2)

## Card (nodeId 45:2, specimen 81:20)

**Container**
- `bg: var(--card)` (white), `border: 1px solid var(--border)` (#e9e9e9), `rounded-[14px]`, `overflow-clip`, column flex. Specimen width 340px (demo only).
- Designer note: outline should read as a 1px ring, foreground/10 — border-based surface separation in light mode.

**Header** (title + description + optional action slot)
- Row, `gap-2`, `px-4 pt-4 pb-3`, items-center.
- Left column: flex-1, `gap-[2px]`.
  - Title: Heading/H4 (Card title) — Inter Medium 16/24, tracking -0.16px, `text-[var(--card-foreground)]` (#1a1a1a).
  - Description: Body/Small — Inter Regular 14/20, tracking -0.14px, `text-[var(--muted-foreground)]` (#4c4c4c).
- Optional action shown as a status badge pill: `bg-[var(--status-positive-bg)]` (#e3fbe3), text `var(--status-positive-fg)` (#3f963f), Caption/Medium (Inter Medium 12/16), `px-2 py-[2px] rounded-full`.

**Content**
- Column, `gap-2`, `px-4 pt-1 pb-4`, full width.
- Rows: `flex justify-between` key/value pairs, both 14/20 (Body/Small).
  - Key: Regular, `var(--muted-foreground)`.
  - Value: Medium (Caption/Large style: Inter Medium 14/20), `var(--foreground)`.

**Footer (muted band)**
- `bg-[var(--muted)]` (#f6f6f6), `border-t 1px var(--border)`, `px-4 py-3`, row, `gap-2`, `justify-end`, full width.
- Buttons inside, both `h-8 px-3 rounded-[10px]`, label Inter Medium 14/20:
  - Outline: `border 1px var(--border)`, text `var(--foreground)`.
  - Primary: `bg-[var(--primary)]` (#2e5630), text `var(--primary-foreground)` (#fafafa).

**shadcn mapping**
- Card: `rounded-[14px] border bg-card` (no shadow shown), remove default py-6 — spacing is per-part.
- CardHeader: `px-4 pt-4 pb-3 gap-0.5`; CardTitle → `text-base font-medium leading-6 tracking-tight`; CardDescription → `text-sm text-muted-foreground`; CardAction slot holds the badge.
- CardContent: `px-4 pt-1 pb-4 space-y-2`.
- CardFooter: `bg-muted border-t px-4 py-3 justify-end gap-2`.
- Buttons match Button size sm (h-8 px-3, rounded-[10px]), variants outline / default.
- Token names --card, --card-foreground, --border, --muted, --muted-foreground, --primary, --primary-foreground map 1:1 to shadcn; status badge needs custom --status-positive-bg/fg (#e3fbe3 / #3f963f).

No hover/focus/disabled states or icons shown; single variant only.

## Dev notes (verbatim from Figma)
"Surface that groups related content. Parts: Header (title + description + optional action), Content, Footer (muted band). Outline = 1px ring (foreground/10) — surfaces separate by border in light mode. Compose StatCard, quote cards, etc. from it."
Specimen label: "Header + Content + Footer"

## Code target
components/ui/card.tsx
