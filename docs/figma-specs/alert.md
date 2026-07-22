# Alert (Figma node 48:6)

## Alert (node 48:6)

**Structure:** horizontal flex row — icon (18×18, shrink-0) + text column (flex-1, `flex-col gap-[2px]`) with title + description. Row: `gap-[12px] items-start`, padding `px-[14px] py-[12px]`, `rounded-[10px]`, `border border-[var(--border)]` (#E9E9E9), full width.

**Variants (4):** background changes per variant; border stays `var(--border)`; text colors identical across variants.
- **Info (default):** bg `var(--card)` (white)
- **Success:** bg `var(--status-positive-bg, #e3fbe3)`
- **Warning:** bg `var(--status-warning-bg, #fef6ed)`
- **Destructive:** bg `var(--status-negative-bg, #fce4e4)`

(If the codebase lacks status-bg tokens, use the hexes: #E3FBE3 / #FEF6ED / #FCE4E4.)

**Typography:**
- Title: Caption/Large — Inter Medium 14/20, tracking -0.07px (~-0.5%), color `var(--foreground)` (#1A1A1A) → `text-sm font-medium leading-5`
- Description: Body/Small — Inter Regular 14/20, tracking -0.14px (~-1%), color `var(--muted-foreground)` (#4C4C4C) → `text-sm font-normal leading-5`

**Icon:** 18×18px, one per variant (info / success / warning / destructive glyphs; Figma exported them as images — use lucide equivalents e.g. Info, CheckCircle2, TriangleAlert, CircleAlert). Icon aligns to top of text (`items-start`).

**States:** none shown (no hover/focus/disabled — static alert).

**Diffs from stock shadcn Alert:** grid → simple flex row with 12px gap; radius 10px (not `rounded-lg` default if that differs); padding 14px x / 12px y (stock is `px-4 py-3`); title is 14px medium (not `font-medium tracking-tight` mb); title/description gap 2px; destructive variant keeps foreground/muted-foreground text colors and only tints the background — do not recolor text red; icon size 18px (stock 16px, `size-4` → use `[&>svg]:size-[18px]` or size-4.5).

**Sample copy per variant (Info/Success/Warning/Destructive):** "Rate sources synced" / "Quote sent to customer" / "No vendor on this lane" / "Invoice variance exceeds tolerance", each with a one-line description.

Section header (not part of component): "Alert" in Heading/H3 (Inter SemiBold 18/26) + Caption/Small (12/16) description — that description text is the dev note captured above (also specifies optional action slot and `role="alert"` for errors).

## Dev notes (verbatim from Figma)
"Inline, persistent message tied to a region/page. Variants: info, success, warning, destructive. Icon + title + description (+ optional action). For transient confirmations use Toast; for blocking choices use Dialog. A11y: role=\"alert\" for errors."

## Code target
components/ui/alert.tsx (shadcn/ui Alert)
