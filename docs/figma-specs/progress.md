# Progress (Figma node 50:35)

## Progress (determinate bar)

Section shows one Progress pattern at three fill values (30%, 70%, 100%), each on a 280px-wide demo column.

### Track
- Width: fill container (demo width 280px)
- Height: **8px**
- Background: **var(--muted)** (#F6F6F6)
- Border radius: **999px** (fully rounded pill); no border
- `overflow: hidden` (clips fill)

### Fill (indicator)
- Height: 8px, anchored left, width = percentage of track (84/196/280px in demos)
- Background: **var(--primary)** (#2E5630)
- Border radius: 999px

### Value label (inside component, below bar)
- Gap between bar and label: **6px** (component is a vertical flex, items-start)
- Text: percentage string, e.g. "30%"
- Style: Caption/Medium — Inter Medium, **12px / 16px line-height, font-medium, tracking -0.06px** (~-0.5%)
- Color: **var(--muted-foreground)** (#4C4C4C)

### Section chrome (not part of component)
- Section title "Progress": Heading/H3 — Inter Semibold 18/26, tracking -0.18px, var(--foreground) #1A1A1A
- Description: Caption/Small — Inter Regular 12/16, var(--muted-foreground)
- Demo swatches laid out in flex-wrap, gap 20px row / 40px column; per-demo caption ("30%" etc.) in Inter Regular 11/14, muted-foreground

### shadcn/ui mapping
- shadcn `<Progress>`: root → `h-2 rounded-full bg-muted overflow-hidden`; indicator → `bg-primary rounded-full` (default shadcn uses `bg-primary/20` track and square-ish indicator — change track to `bg-muted`)
- Add a value label below: `mt-1.5 text-xs font-medium text-muted-foreground` (6px gap ≈ mt-1.5, 12px Medium)
- States/variants: none shown — single style, only value varies

### Named text styles used
- Heading/H3 (18/26 SemiBold), Caption/Small (12/16 Regular), Caption/Medium (12/16 Medium)

## Dev notes (verbatim from Figma)
"Determinate completion bar for known-length processes (uploads, multi-step sync, quota usage). Track = muted, fill = primary. For unknown length use a Spinner. A11y: role=progressbar with aria-valuenow."

## Code target
components/ui/progress.tsx (shadcn/ui Progress) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
