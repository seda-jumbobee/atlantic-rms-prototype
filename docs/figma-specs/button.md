# Button (Figma node 38:6)

# Button spec (Figma 38:6)

6 variants (Primary, Secondary, Outline, Ghost, Destructive, Link) x 3 sizes (Small, Medium, Large). Font: Inter Medium 500 in all variants.

## Sizes (shared across variants)
| Size | Height | Padding-x | Radius | Text |
|---|---|---|---|---|
| Small | 32px | 10px | 8px | 14px / lh 20px / tracking -0.07px (Button/Medium style) |
| Medium | 40px | 12px | 10px | 14px / lh 20px / tracking -0.07px |
| Large | 44px | 16px | 10px | 16px / lh 24px / tracking -0.16px (Button/Large style) |

Note: Outline+Large is drawn at h 40px in Figma (likely inconsistency; other Large = 44px). Content centered (flex items-center justify-center), label nowrap.

## Variants
- **Primary**: bg `var(--primary)` (#2E5630), text `var(--primary-foreground)` (#FAFAFA). No border.
- **Secondary**: bg `var(--secondary)` (#F6F6F6), text `var(--secondary-foreground)` (#1A1A1A).
- **Outline**: bg `var(--background)` (white), 1px solid border `var(--border)` (#E9E9E9), text `var(--foreground)` (#1A1A1A).
- **Ghost**: transparent bg, no border, text `var(--foreground)` (#1A1A1A).
- **Destructive**: soft style — bg `var(--status-negative-bg)` (#FCE4E4, ~destructive/10), text `var(--destructive)` (#C41C1C). NOT solid red.
- **Link**: transparent bg, text `var(--primary)` (#2E5630); no underline shown in spec.

## shadcn/Tailwind v4 mapping
- Sizes: `sm: h-8 px-2.5 rounded-lg text-sm`, `default(md): h-10 px-3 rounded-[10px] text-sm`, `lg: h-11 px-4 rounded-[10px] text-base`.
- `font-medium`, tracking approx `-tracking-[0.005em]` (14px) / `-0.01em` (16px); leading 20/24px.
- Destructive: `bg-destructive/10 text-destructive` (or a --status-negative-bg token) instead of default solid destructive.
- Focus ring per dev note: ring token at 3px (`focus-visible:ring-[3px] ring-ring`).
- Icon-only buttons require aria-label; min touch target 32px, prefer lg on touch.

## States
No hover/focus/disabled/active states are drawn in the Figma node — only the focus-ring guidance from the dev note. Keep shadcn defaults otherwise (derive hover as slight darken/opacity).

Named text styles: Button/Medium (Inter Med 14/20), Button/Large (Inter Med 16/24); section header uses Heading/H3 (SB 18/26) and Caption/Small (Reg 12/16) — those are doc chrome, not part of the component.

## Dev notes (verbatim from Figma)
"Primary action trigger. One primary per view; secondary/outline for lower emphasis, ghost for inline/toolbar, destructive for irreversible actions, link for navigation. A11y: min 32px target (use lg/36px on touch); icon-only needs aria-label; focus ring = ring token @ 3px."

## Code target
components/ui/button.tsx (shadcn/ui Button — buttonVariants cva)
