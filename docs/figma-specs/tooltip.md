# Tooltip (Figma node 47:17)

# Tooltip — spec (node 47:17)

Inverted tooltip bubble with a bottom-center arrow. Two examples shown ("Default" with text "Swap origin & destination", "Short" with "⌘K") — same style, no size/color variants.

## Bubble (TooltipContent)
- Background: `var(--foreground)` (#1a1a1a) — inverted
- Text color: `var(--background)` (white)
- Padding: 12px x / 6px y → `px-3 py-1.5`
- Radius: 8px → `rounded-lg`
- No border, no shadow shown
- Max width: ~320px (per designer note); text otherwise hugs content (whitespace-nowrap in short examples)

## Typography
- Style: Caption/Small — Inter Regular 12px / 16px line-height, letter-spacing -0.06px (~-0.5%) → `text-xs leading-4 font-normal tracking-[-0.06px]`

## Arrow
- 12px wide x 7px tall triangle, centered below the bubble, overlapping it by 1px (`mb-[-1px]` on bubble), same foreground color. In shadcn/Radix use the built-in `TooltipPrimitive.Arrow` sized w-[12px] h-[7px] (or default 2.5 size approximation) filled with `fill-foreground`.

## Behavior / states
- Trigger: hover and keyboard focus of an icon or truncated element
- Appears after a short delay (use TooltipProvider `delayDuration`, e.g. ~200-300ms)
- No hover/disabled variants of the bubble itself

## shadcn mapping
TooltipContent classes: `bg-foreground text-background rounded-lg px-3 py-1.5 text-xs leading-4 max-w-[320px]` (replace shadcn default `bg-primary text-primary-foreground rounded-md`). Arrow: `fill-foreground`, size 12x7.

## Accessibility (verbatim designer intent)
- Never put essential-only info in the tooltip
- Must be reachable by keyboard focus

## Dev notes (verbatim from Figma)
"Brief, supplemental label on hover/focus of an icon or truncated element. Inverted (foreground bubble / background text), max ~320px, appears after a short delay. A11y: never put essential-only info here; must be reachable by keyboard focus."

## Code target
components/ui/tooltip.tsx (shadcn TooltipContent)
