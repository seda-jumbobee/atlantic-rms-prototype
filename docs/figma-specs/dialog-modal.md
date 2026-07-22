# Dialog / Modal (Figma node 49:2)

## Dialog / Modal (node 49:2, example dialog 81:25)

**Anatomy:** scrim → dialog panel → header (title + description + close icon) → footer actions (Cancel + primary/destructive).

**Overlay/scrim:** `rgba(0,0,0,0.15)` covering the page (lighter than shadcn default `bg-black/80`).

**Panel:**
- Width 400px (`sm:max-w-[400px]`), bg `var(--popover)` (white), radius **14px** (`rounded-[14px]`)
- Shadow: `0px 10px 24px -6px rgba(0,0,0,0.18)`
- No border shown; `overflow-clip`; column flex, no gap between header/footer blocks

**Header block:** row, padding `pt-[18px] pl-[20px] pr-[16px] pb-[6px]`, gap 8px between text column and close icon.
- Text column: flex-col, gap 4px
- Title: Inter Medium 16/24, tracking -0.16px, color `var(--popover-foreground)` (#1a1a1a) — named style **Heading/H4 (Card title)**. (Note: not shadcn's default `text-lg font-semibold` — smaller/medium.)
- Description: Inter Regular 14/20, tracking -0.14px, color `var(--muted-foreground)` (#4c4c4c) — **Body/Small**
- Close: 16×16 icon (X), top-right, aligned to start of header row

**Footer block:** row, `justify-end`, gap 8px, padding `pt-[16px] px-[20px] pb-[20px]`.
- Buttons: height **32px** (h-8), `px-[14px]`, radius **10px** (`rounded-[10px]`), centered content
- Button text: Inter Medium 14/20, tracking -0.07px — **Caption/Large**
- Cancel (outline): bg `var(--background)` (white), 1px border `var(--border)` (#e9e9e9), text `var(--foreground)` (#1a1a1a)
- Destructive/primary: bg `var(--destructive)` (#c41c1c), text `var(--destructive-foreground)` (#fafafa), no border

**Named text styles used:** Heading/H3 (Inter SB 18/26) and Caption/Small (Inter 12/16) are the section's own heading/description; dialog itself uses Heading/H4, Body/Small, Caption/Large.

**shadcn/Tailwind v4 mapping notes:**
- DialogOverlay → `bg-black/15`
- DialogContent → `rounded-[14px] p-0 gap-0 sm:max-w-[400px] shadow-[0px_10px_24px_-6px_rgba(0,0,0,0.18)]` (remove default border if present), with explicit header/footer padding as above
- DialogTitle → `text-base font-medium leading-6 tracking-[-0.01em]`
- DialogDescription → `text-sm text-muted-foreground`
- Buttons → shadcn Button size ~sm: `h-8 px-3.5 rounded-[10px] text-sm font-medium`; variants `outline` and `destructive`
- Example copy: "Delete this quote?" / "Q-190651 will be permanently removed. This can't be undone."

## Dev notes (verbatim from Figma)
"Focused overlay for a task or confirmation that needs acknowledgement; blocks the page via a scrim. Header (title + close) · body · footer actions (primary + cancel). A11y: focus-trap, Esc closes, return focus to trigger, labelled by title."

## Code target
components/ui/dialog.tsx (plus components/ui/button.tsx for footer action variants) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
