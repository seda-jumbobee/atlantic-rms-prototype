# Dropdown menu (Figma node 42:2)

## Dropdown Menu (42:2)

Two variants shown: closed **trigger** and open **content panel**.

### Trigger (closed state)
- 98px wide (hug), **h-36px**, pl-12 pr-10, gap-8, items-center
- bg `var(--background)` (#fff), border 1px `var(--border)` (#e9e9e9), **rounded-[10px]**
- Label "Options": Inter Medium 14/20, tracking -0.07px, color `var(--foreground)` (#1a1a1a) — style **Caption/Large**
- Trailing chevron-down icon 16×16

### Content panel (open state)
- **w-[220px]**, flex-col, **p-1 (4px)**, **gap-[2px]** between items
- bg `var(--popover)` (#fff), border 1px `var(--border)`, **rounded-[10px]**, overflow-clip
- shadow: `0px 4px 6px -1px rgba(0,0,0,0.1)` (≈ shadow-md top layer)

### Menu item
- Row: flex, items-center, **gap-2 (8px)**, **px-2 py-1.5 (8/6px)**, **rounded-[8px]**, full width
- Leading icon **16×16** (size-4), each item has one
- Text: **Body/Small** — Inter Regular 14px / lh 20px, tracking -0.14px

### Item states
| State | bg | text |
|---|---|---|
| Default | transparent | `var(--foreground)` #1a1a1a |
| Highlighted/hover | `var(--accent)` #E9EEE9 | `var(--accent-foreground)` #102A15 |
| Destructive | `var(--status-negative-bg)` #FCE4E4 (shown as active/hover bg) | `var(--destructive)` #C41C1C |

Example items: Edit deal, Duplicate (highlighted), Show economics, Mark recommended, Delete (destructive).

### Separator
- h-px, full width, bg `var(--border)` #e9e9e9 (with the 2px item gap around it; shadcn's `-mx-1 my-1` should be reduced/removed to match p-1 + gap-[2px] container)

### shadcn/Tailwind v4 restyle deltas vs default shadcn DropdownMenu
- Content: `w-[220px] rounded-[10px] p-1 gap-0.5 flex flex-col shadow-md border-border bg-popover`
- Item: `rounded-lg gap-2 px-2 py-1.5 text-sm leading-5` with `size-4` icons
- Highlighted: `focus:bg-accent focus:text-accent-foreground`
- Destructive item: `text-destructive focus:bg-[#FCE4E4] focus:text-destructive` (or a `--status-negative-bg` token)
- Trigger button: `h-9 rounded-[10px] border bg-background pl-3 pr-2.5 gap-2 text-sm font-medium` + `ChevronDown` size-4

Section header uses Heading/H3 (Inter SemiBold 18/26) and Caption/Small (12/16, muted-foreground) — documentation only, not part of the component.

## Dev notes (verbatim from Figma)
"Contextual action/option list anchored to a trigger. Item states: default, highlighted (accent bg), destructive, with-icon, checked, disabled. Also backs Select & command menus. A11y: roving focus, Esc closes, Enter activates." — Example label: "Open menu — default · highlighted · checked · destructive"

## Code target
components/ui/dropdown-menu.tsx
