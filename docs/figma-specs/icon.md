# Icon (Figma node 73:33)

## Icon (component set, node 73:33)

A single `Icon` component with one variant property `name`, 16 variants total. Each variant is a flat 16×16px vector glyph — no background, border, radius, padding, or text.

**Variants (name values):** `search` (default), `chevron-down`, `chevron-up`, `arrow-right`, `check`, `x`, `plus`, `sparkles`, `calendar`, `layout-dashboard`, `route`, `layout-template`, `calculator`, `briefcase`, `history`, `building`.

These names map 1:1 to **lucide-react** icons (`Search`, `ChevronDown`, `ChevronUp`, `ArrowRight`, `Check`, `X`, `Plus`, `Sparkles`, `Calendar`, `LayoutDashboard`, `Route`, `LayoutTemplate`, `Calculator`, `Briefcase`, `History`, `Building`) — the standard shadcn/ui icon library. Implement with lucide rather than exported SVG assets.

**Sizing:** container and vector are both exactly 16×16px → Tailwind `size-4` (lucide default is 24; pass `className="size-4"` or `size={16}`).

**Color:** glyphs are rendered as flattened vectors in the Figma set (no variable binding surfaced); icons inherit context color in usage — implement with `stroke="currentColor"` (lucide default) so parent text color (e.g. `text-foreground`, `text-muted-foreground`, `text-primary-foreground` inside buttons) drives the icon color. Lucide stroke width default (2px at 24 → ~1.33px at 16) matches.

**Structure per variant:** `div.relative.size-[16px]` > `div.absolute.left-0.top-0.size-[16px]` > full-bleed vector. No states (hover/focus/disabled) defined at the icon level.

**Recommended code shape:**
- Don't build a custom Icon wrapper unless one exists; use lucide-react components directly with `className="size-4"` (Tailwind v4), or a thin `Icon` map component keyed by the 16 names above if design–code parity naming is desired.
- Icon-only asset export is unnecessary; the Figma vectors are lucide glyphs.

**No designer annotations/dev-note text** was present inside this node — it contains only the icon variants themselves.

## Dev notes (verbatim from Figma)
(none)

## Code target
Icon usage across shadcn/ui components (lucide-react); e.g. app components importing from "lucide-react" — no dedicated icon file needed
