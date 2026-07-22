# Breadcrumb (Figma node 47:2)

## Breadcrumb — spec (node 47:2, component instance 81:23)

Trail of link items separated by chevron icons, with the last item styled as the current page.

### Layout
- Container: horizontal flex, `items-center`, **gap 6px**, no padding, no background, no border/radius.
- Item height comes from line-height (20px); overall row ~20px tall.

### Items
- **Link items** ("Home", "Deals"): text style **Body/Small** — Inter Regular, 14px, weight 400, line-height 20px, letter-spacing -0.14px (~-1%). Color: **var(--muted-foreground)** (design value #4c4c4c). `whitespace-nowrap`.
- **Current page item** ("Q-190612"): **Caption/Large** — Inter **Medium (500)**, 14px, line-height 20px, letter-spacing -0.07px. Color: **var(--foreground)** (#1a1a1a). Not a link; use `aria-current="page"`.

### Separator
- Chevron icon in a **14x14px** frame between items (exported asset; a chevron-right glyph — lucide `ChevronRight` at `size-3.5` matches intent). Inherits/renders in muted-foreground tone.

### States
- None shown in the frame (no hover/focus variants drawn).

### shadcn/ui mapping
Matches shadcn `Breadcrumb` closely. Restyle:
- `BreadcrumbList`: `gap-1.5` (6px), `text-sm text-muted-foreground`, tracking tight (~-0.01em).
- `BreadcrumbLink`: `font-normal text-muted-foreground`.
- `BreadcrumbPage`: `font-medium text-foreground`.
- `BreadcrumbSeparator`: ChevronRight, `size-3.5` (14px).
- Truncation: designer note says to truncate long trails with an ellipsis item (`BreadcrumbEllipsis`).

### Named text styles used
- Body/Small: Inter 400 14/20, ls -1%
- Caption/Large: Inter 500 14/20, ls -0.5%
- (Section header uses Heading/H3 18/26 SB and Caption/Small 12/16 — documentation chrome, not part of the component.)

## Dev notes (verbatim from Figma)
Section description (gray caption under title, verbatim): "Shows location in the hierarchy and lets users jump back up. Chevron separators; last item = current page (not a link, aria-current). Truncate long trails with an ellipsis item."

Example caption label (verbatim): "Home / Deals / current"

## Code target
components/ui/breadcrumb.tsx (shadcn/ui Breadcrumb) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
