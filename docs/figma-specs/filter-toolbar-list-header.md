# Filter toolbar & list header (Figma node 56:2)

## Filter toolbar & list header (component `FilterToolbar`, node 87:151)

**Layout**
- Section shown inside a demo card: `bg-var(--card)`, border 1px `var(--border)` (#E9E9E9), radius **14px**, padding **20px**, full width.
- Toolbar row: `flex flex-wrap items-center content-center gap-2` (8px gap), full width. A flexible spacer (`flex-1`) splits left controls from right controls — left: search + facet selects; right: "Clear all", result count, sort select. On mobile the controls wrap via flex-wrap (no breakpoint changes needed).

**Controls (search box + all selects share one style)**
- Height **36px** (h-9), radius **10px**, `bg-var(--background)` (white), border 1px `var(--input)` (#E9E9E9), padding-left **12px**, padding-right **10px**, internal `gap-2` (8px), fixed widths in the mock: search 220px, Status 150px, Manager 160px, Sort 140px.
- Text: Body/Small — Inter Regular **14/20**, tracking -0.14px. Placeholder text ("Search…") uses `var(--muted-foreground)` (#4C4C4C); selected values ("Status: All", "Manager: All", "Sort: Price") use `var(--foreground)` (#1A1A1A).
- Icons **16×16**: search glyph leading in the search input; chevron-down trailing in each select.

**Right-side text items**
- "Clear all": Caption/Large — Inter Medium 14/20, color `var(--primary)` (#2E5630). Per the note, rendered **only when filters are modified**. Acts as a text/link button (no border/background).
- Result count ("24 results"): Body/Small 14/20 Regular, `var(--muted-foreground)`.

**Section header (docs framing, not part of the component)**
- Title: Heading/H3 — Inter SemiBold 18/26, `var(--foreground)`; description: Caption/Small — Inter Regular 12/16, `var(--muted-foreground)`; 4px gap, 14px gap to demo card.

**Named text styles used**: Heading/H3 (18/26 SB), Body/Small (14/20 R), Caption/Large (14/20 Med), Caption/Small (12/16 R).

**No hover/focus/disabled states shown** in this node.

**shadcn mapping**: Input and SelectTrigger both become `h-9 rounded-[10px] border-input bg-background px-3 text-sm`; Select value `text-foreground`, placeholder `text-muted-foreground`; chevron `size-4`; toolbar `flex flex-wrap items-center gap-2` with `flex-1` spacer; "Clear all" as ghost/link button `text-sm font-medium text-primary`, conditionally rendered.

## Dev notes (verbatim from Figma)
Search + facet selects on the left; result count, “Clear all” (shown only when modified) and a sort select on the right. Above every list/table. On mobile the controls wrap (flex-wrap).

## Code target
Likely a shared toolbar/list-header component in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app (shadcn Input + Select composition rendered above list/table views)
