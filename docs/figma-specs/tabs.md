# Tabs (Figma node 45:31)

# Tabs (node 45:31)

Two variants: **Segmented** (default shadcn-style pill tabs on a muted track) and **Line** (underline tabs).

## Shared trigger typography (both variants)
- Inter Medium 14px / line-height 20px / letter-spacing -0.07px (Figma text style **Caption/Large**) → Tailwind: `text-sm font-medium leading-5 tracking-[-0.07px]`
- Active label: `var(--foreground)` (#1a1a1a)
- Inactive label: `var(--muted-foreground)` (#4c4c4c)
- Labels whitespace-nowrap; icons supported alongside label.

## Segmented variant (TabsList + TabsTrigger)
- Trigger: padding `px-[12px] py-[6px]` (→ 32px tall with 20px line-height), `rounded-[8px]`, column flex, items-center.
- Active trigger: `bg-var(--background)` (white pill) + shadow `drop-shadow(0 1px 1px rgba(0,0,0,0.06))` → Tailwind `shadow-[0_1px_1px_rgba(0,0,0,0.06)]`; text foreground.
- Inactive trigger: transparent bg, same padding/radius, text muted-foreground.
- Track (TabsList): muted background pill per description ("pill on muted track") — use `bg-muted` container; track container itself not captured in this node's export.

## Line variant
- Trigger: column flex, `gap-[6px]`, `pt-[4px] px-[8px]`, no radius/bg/shadow.
- Underline: full-width bar `h-[2px]` below the label.
  - Active: underline `bg-var(--foreground)` (#1a1a1a).
  - Inactive: underline present but transparent (reserves space, no layout shift).
- Active label foreground, inactive muted-foreground (same as segmented).

## States shown
Only Default and Active per variant (no explicit hover/focus/disabled in the frame).

## Section header (for DS docs page, not the component)
- Title "Tabs": Inter SemiBold 18/26, tracking -0.18px, foreground (Heading/H3).
- Description: Inter Regular 12/16, tracking -0.06px, muted-foreground (Caption/Small).

## shadcn restyle notes
- TabsTrigger: `rounded-[8px] px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_1px_rgba(0,0,0,0.06)]`
- Add a `variant="line"` style: `border-b-2 border-transparent px-2 pt-1 pb-0 data-[state=active]:border-foreground data-[state=active]:text-foreground`, list without bg.
- Keep Radix keyboard behavior (arrows + Home/End) per annotation.

## Dev notes (verbatim from Figma)
"Switch views within the same context. Two variants: segmented (pill on muted track) and line (underline). Active = foreground + emphasis; inactive = muted-foreground; supports icons. A11y: arrow keys move, Home/End jump."

## Code target
components/ui/tabs.tsx (shadcn Tabs — TabsList/TabsTrigger), likely used in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
