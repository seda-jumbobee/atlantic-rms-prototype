# Navigation — sidebar item (Figma node 47:36)

## Navigation — sidebar item

Primary app-nav item for a permanently dark sidebar rail. Two states shown (Default, Active), each with a leading icon and optional count badge.

### Container (both states)
- Row, flex, `items-center`, gap **8px**
- Padding: **16px** horizontal (`var(--16px)`), **12px** vertical (`var(--12px)`)
- Width 220px in the spec frame (in code: full-width of the rail)
- Border radius **8px**, no border

### States
- **Default:** bg `var(--sidebar)` (#102A15). Label: Inter Regular **14/20**, tracking -0.14px (Body/Small), color `var(--sidebar-foreground)` (#FAFAFA).
- **Active / hover:** bg `var(--sidebar-accent)` (#405544). Label switches to Inter **Medium 500** 14/20, tracking -0.07px (Caption/Large), same `var(--sidebar-foreground)` color.

### Icon
- 16×16 leading icon, `shrink-0`, colored to match foreground (#FAFAFA); same in both states.

### Count badge (optional)
- Pill: bg `var(--sidebar-primary)` (#4C7935), radius **999px**, padding **6px** x / **1px** y, centered content, `shrink-0`, right-aligned (label takes `flex-1`)
- Text: Inter Regular **11px / 14px** line-height, tracking -0.055px, color `var(--sidebar-primary-foreground)` (#FAFAFA), `whitespace-nowrap`
- Identical in Default and Active states.

### shadcn/Tailwind mapping
Uses shadcn sidebar tokens directly: `bg-sidebar`, `hover/active: bg-sidebar-accent`, `text-sidebar-foreground`, badge `bg-sidebar-primary text-sidebar-primary-foreground`. Suggested classes: item `flex items-center gap-2 px-4 py-3 rounded-lg text-sm leading-5 text-sidebar-foreground` (+ `font-medium bg-sidebar-accent` when active); icon `size-4`; badge `rounded-full bg-sidebar-primary px-1.5 py-px text-[11px] leading-[14px] text-sidebar-primary-foreground`.

### Named text styles referenced
- Body/Small: Inter 400, 14/20 (default label)
- Caption/Large: Inter 500, 14/20 (active label)
- Caption/Small: Inter 400, 12/16 (section annotation)
- Heading/H3: Inter 600, 18/26 (section title)

## Dev notes (verbatim from Figma)
"Primary app nav (permanently-dark rail). Item states: default, hover/active (sidebar-accent bg), with icon + optional count badge. Collapses to icon-rail ≥md and an off-canvas drawer on mobile."

## Code target
Likely a sidebar/nav component in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app (e.g. components/app-sidebar or shadcn sidebar usage)
