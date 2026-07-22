# Page header (Figma node 55:6)

## Page header pattern

Reusable page-header block: title + description on the left, right-aligned action buttons. Example content: "Deals & CRM" / "Pipeline synced with Kommo — board & table views." with Outline "Export" + Primary "New deal" buttons.

### Layout
- Root: flex row, `items-center justify-between`, full width (demo canvas 1272px inside a card with 20px padding, radius 14px, `bg var(--card)`, 1px border `var(--border)` — the card wrapper is just the spec's showcase container).
- Left group: flex column, gap 2px, hugging content.
- Right group: flex row, gap 8px, `items-start`.
- Responsive rule (from designer note): stacks as column on mobile, becomes row at `sm`.

### Typography
- Title: Heading/H1 style — Inter Semi Bold 24px / 32px line-height, tracking -0.72px, color `var(--foreground)` (#1a1a1a). Tailwind: `text-2xl font-semibold tracking-tight text-foreground`.
- Description: Body/Small — Inter Regular 14px / 20px, tracking -0.14px, color `var(--muted-foreground)` (#4c4c4c). Tailwind: `text-sm text-muted-foreground`.

### Buttons (both size "Large")
Shared: flex center, px-16px, radius 10px, text style Button/Large = Inter Medium 16px / 24px, tracking -0.16px.
- Primary: bg `var(--primary)` (#2e5630), text `var(--primary-foreground)` (#fafafa), height 44px per component definition (rendered at 40px in this header via override — match instance: h-40px).
- Outline: bg `var(--background)` (white), 1px solid border `var(--border)` (#e9e9e9), text `var(--foreground)` (#1a1a1a), height 40px.
Maps to shadcn `Button` variants `default` and `outline`, size ~`lg` (h-10, px-4, rounded-[10px], text-base font-medium).

### States / icons
No hover/focus/disabled states or icons shown in this node.

### Tokens used
--foreground, --muted-foreground, --primary, --primary-foreground, --background, --border, --card — all shadcn-named, bound in the design.

## Dev notes (verbatim from Figma)
"Title + description + right-aligned actions. Stacks column on mobile → row at sm. Opens almost every page."

## Code target
Likely a shared PageHeader component in the Atlantic RMS app (e.g. app/components/page-header.tsx) plus shadcn Button (components/ui/button.tsx) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
