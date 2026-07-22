# Stepper (Figma node 56:28)

## Stepper — multi-step flow header (Quote Master: Search → Choose rate → Build quote)

**Container:** horizontal flex, `items-center gap-[8px] w-full`, inside a card: `bg-var(--card) border border-var(--border) rounded-[14px] p-[20px]`. Steps alternate with connector lines that flex-fill (`flex-1 h-[2px] min-w-px`).

**Step chip (all states):** flex row, `gap-[8px] items-center`, padding `pl-[8px] pr-[12px] py-[6px]`, `rounded-[10px]`, shrink-0.

**Badge (inside chip):** 24×24 circle (`rounded-full size-6`), centered content.

### Tri-state styles
1. **Done (Search):**
   - Badge: bg `var(--success)` (#51bc51), contains a 13×13 white check icon (SVG asset).
   - Label: `text-[14px] font-medium leading-[20px] tracking-[-0.07px]` (Caption/Large) in `var(--success)`.
   - Chip: no bg/border.
   - Connector after it: `bg-var(--success)`.
2. **Active (Choose rate):**
   - Chip: `bg-var(--accent)` (#e9eee9), `border border-var(--primary)` (#2e5630).
   - Badge: `bg-var(--primary)`, number text `text-[12px] font-medium leading-[16px]` (Caption/Medium) in `var(--primary-foreground)` (#fafafa).
   - Label: Caption/Large (14/20 medium) in `var(--primary)`.
   - Connector after it: `bg-var(--border)` (#e9e9e9).
3. **Upcoming (Build quote):**
   - Chip: no bg/border.
   - Badge: `bg-var(--muted)` (#f6f6f6), number in `var(--muted-foreground)` (#4c4c4c), Caption/Medium.
   - Label: `text-[14px] font-normal leading-[20px]` (Body/Small, regular not medium) in `var(--muted-foreground)`.

### Typography (named styles)
- Done/active labels: Caption/Large — Inter Medium 14/20.
- Upcoming label: Body/Small — Inter Regular 14/20.
- Badge numbers: Caption/Medium — Inter Medium 12/16.
- Section heading: Heading/H3 — Inter SemiBold 18/26; description: Caption/Small — Inter Regular 12/16, `var(--muted-foreground)`.

### Icon
Done step uses a check icon (~13px) inside the green badge; use lucide `Check` at ~13px, white stroke.

### Behavior notes (from designer description)
- Tri-state per step: done (check + green connector), active (primary badge + tinted chip), upcoming (muted).
- **Labels hide below sm** — on mobile show only the badges (e.g. `hidden sm:block` on labels).
- Connectors take equal remaining width between chips.

## Dev notes (verbatim from Figma)
"Multi-step flow header (e.g. Quote Master: Search → Choose rate → Build quote). Tri-state per step: done (check + green connector), active (primary badge + tinted chip), upcoming (muted). Labels hide below sm."

## Code target
Likely a stepper/steps component in the Next.js app, e.g. app/components/stepper.tsx or the Quote Master flow header in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
