# Table (Figma node 46:2)

# Table spec (node 46:2)

## Container
- `bg-[var(--card)]`, `border border-[var(--border)]` (#e9e9e9), `rounded-[12px]`, `overflow-clip` (clip so row borders/bg don't break the radius), full width.
- Wide tables: horizontal scroll (`overflow-x-auto` wrapper), cells `whitespace-nowrap` — no reflow.

## Header row
- Height **40px**, `bg-[var(--muted)]` (#f6f6f6), bottom border `var(--border)`.
- Layout: flex, `gap-[12px]`, `px-[12px]`, items-center.
- Header text: **Caption/Medium** — Inter 12px / 500 / lh 16 / tracking -0.06px, color `var(--muted-foreground)` (#4c4c4c).

## Body rows
- Height **48px**, same flex layout (gap 12, px 12), bottom border `var(--border)`.
- States:
  - default: transparent/card bg
  - hover: `bg-[var(--muted)]` (#f6f6f6) — the "zebra"-looking row in the mock is the hover state
  - selected: `bg-[var(--accent)]` (#e9eee9) + checked checkbox

## Checkbox (leading cell)
- 16×16, `rounded-[4px]`.
- Unchecked: `bg-[var(--background)]`, border `var(--input)` (#e9e9e9).
- Checked: bg + border `var(--primary)` (#2e5630), white ~11px check icon centered.

## Cell typography
- ID/code cell (e.g. "Q-190612"): Caption/Small — Inter 12/400/16, `var(--muted-foreground)`, fixed w-110px.
- Primary cell (Lane): Caption/Large — Inter 14/500/20, `var(--foreground)` (#1a1a1a), flex-1.
- Secondary text cell (Type): Body/Small — Inter 14/400/20, `var(--muted-foreground)`, w-130px.
- Money (Total): Inter 14/500/20, `var(--foreground)`, **right-aligned**, tabular-nums, w-90px.
- Status column w-110px.

## Status badge (pill)
- `px-[8px] py-[2px]`, `rounded-full` (999px), text Caption/Medium (12/500/16).
- Variants:
  - Positive ("Confirmed"): bg `var(--status-positive-bg)` #e3fbe3, text `var(--status-positive-fg)` #3f963f
  - Info ("Sent"): bg `var(--status-info-bg)` #e9eee9, text `var(--status-info-fg)` #2e5630
  - Neutral ("Draft"): bg `var(--status-neutral-bg)` #f6f6f6, text `var(--status-neutral-fg)` #4c4c4c

## Section title block (docs only, not part of component)
- Title: Heading/H3 Inter 18/600/26; description Caption/Small 12/400/16 muted-foreground.

## shadcn mapping notes
- Restyle `<Table>`: remove default cell padding pattern → row h-12 (48px), head h-10 (40px) bg-muted, px-3, gap via column padding; text-xs medium muted-foreground heads; rounded-xl bordered card wrapper.
- Selected row: `data-[state=selected]:bg-accent`; hover `hover:bg-muted`.
- Status pills map to a Badge variant set (positive/info/neutral) using the status CSS vars above.

## Dev notes (verbatim from Figma)
"Dense tabular data with header, sortable columns, row selection, and per-row actions. Row states: default, hover (muted), selected (accent + checked). Wide tables scroll horizontally (overflow-x) rather than reflowing; cells use nowrap. Money right-aligned, tabular."

## Code target
components/ui/table.tsx (+ badge.tsx, checkbox.tsx) in atlantic-rms-prototype-main/app
