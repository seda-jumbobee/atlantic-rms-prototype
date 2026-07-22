# Toast (Figma node 48:42)

# Toast (sonner)

Single toast component with 5 type variants: **Success, Error, Info, Warning, Loading**. Only the leading status icon changes per type; container and text styles are identical across variants.

## Container
- Width: 320px, horizontal auto-layout, items-center
- Padding: 12px top/bottom, 14px left, 12px right; gap 10px
- Background: `var(--popover)` (#FFFFFF)
- Border: 1px solid `var(--border)` (#E9E9E9)
- Radius: **10px**
- Shadow: drop-shadow `0px 4px 4px rgba(0,0,0,0.10)`

## Content row (left → right)
1. **Status icon** — 18×18px, per type: success check, error, info, warning, loading spinner (Loading type shows spinner)
2. **Label text** — flex-1, wraps/breaks word; style **Caption/Large**: Inter Medium 14px / line-height 20px / letter-spacing -0.07px (-0.5%); color `var(--popover-foreground)` (#1A1A1A). Default label "Notification"
3. **Close icon** — 14×14px, trailing

## States
None shown (no hover/focus variants in the section).

## Section heading styles (docs only, not the component)
- Title: Heading/H3 — Inter SemiBold 18/26, ls -0.18px, `var(--foreground)` #1A1A1A
- Description: Caption/Small — Inter Regular 12/16, ls -0.06px, `var(--muted-foreground)` #4C4C4C

## Implementation notes for shadcn + Tailwind v4 sonner
- Style toasts via sonner `toastOptions.classNames` or unstyled + custom classes: `w-[320px] rounded-[10px] border border-border bg-popover text-popover-foreground py-3 pl-3.5 pr-3 gap-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.1)] text-sm font-medium leading-5 tracking-[-0.005em]`
- Position: **top-right** (per dev note)
- Icons 18px (`size-[18px]`), close button icon 14px
- Behavior per dev note: transient/auto-dismiss; map `toast.success/error/info/warning/loading`; one line + optional action; do not use for critical errors requiring acknowledgement.

## Dev notes (verbatim from Figma)
"Transient, auto-dismissing confirmation (sonner, top-right). Types map to status: success, error, info, warning, loading (spinner). Keep to one line + optional action; never for critical errors that need acknowledgement."

## Code target
components/ui/sonner.tsx (sonner toaster styling; possibly globals.css toast overrides)
