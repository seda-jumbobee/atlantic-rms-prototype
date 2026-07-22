# Documentation (Figma node 57:2)

## Documentation page (DS guidance, not a UI component)

This node is a text-only documentation page: page container `bg-var(--background)`, flex-col, gap-36px, padding pt-56 px-64 pb-72. Sections gap-10px. Typography: H1 = Inter SemiBold 24/32 tracking -0.72px (`--foreground`); intro Body/Medium 16/24 (`--muted-foreground`); section headings H2 SemiBold 20/28; body bullets Body/Small 14/20; table header Caption/Large Medium 14/20.

### Mapping table (visual spec)
Card: `bg-var(--card)`, 1px border `var(--border)`, rounded-12px. Header row `bg-var(--muted)`, text `--muted-foreground`, font-medium. Rows: px-16 py-10, gap-12, border-b `var(--border)`; col widths 220px / 240px / flex-1; cell text 14px, first two cols `--foreground`, notes `--muted-foreground`.

### Content rules a developer must apply (the real payload)
Figma→code mapping: Color/primary → var(--primary) → bg-primary/text-primary; Color/muted-foreground → var(--muted-foreground); Color/status-positive-bg → var(--status-positive-bg) (NEW — add to globals.css); Radius/lg → var(--radius-lg) → rounded-lg (10px); Spacing/4 → 16px → p-4/gap-4; Text/Body Base → text-sm + Geist (14/20 default body).

Principles: token-first (never hardcode colors), one semantic status scale (info/positive/warning/negative/neutral — never raw amber/emerald/slate), compose components→patterns→templates.

Accessibility: body text WCAG AA 4.5:1; visible 3px focus ring (ring token) — never remove; min target 32px, size lg (36px+) on touch; icon-only controls need aria-label; role="alert" for errors, role=switch/progressbar, aria-current on active nav/breadcrumb; skeleton pulse & spinner respect prefers-reduced-motion.

Naming: variables slash-grouped (Color/*, Spacing/*, Radius/*...); components PascalCase matching code; data-slot in code anchors Figma-layer mapping.

## Dev notes (verbatim from Figma)
Verbatim "Fix in code (surfaced by the audit)" list:
1. Replace hardcoded amber (59×) & emerald status colors with the warning/success tokens or the new status scale.
2. Add success/warning/destructive-foreground tokens (used here) to globals.css; stop pairing bg-success with literal text-white.
3. Add the status-* scale and refactor the 5 duplicated status maps (status-badge, route-step, invoice, admin pages) to one helper.
4. Replace raw slate/gray neutrals (32×) with muted/border/foreground — esp. quote-output.tsx (won't theme).
5. Standardize text-[10px]/[11px] (43×) to a single caption token (11px).
6. Re-brand dark mode: primary/ring/charts revert to gray in .dark — restore brand hues.
7. Add --shadow-* tokens; tokenize checkbox rounded-[4px], slider bg-white, overlay bg-black/10, switch h-[18.4px].
Also: "* Status tokens are proposed additions — they unify five hardcoded color maps in code."

## Code target
/Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app — globals.css (new status-*, success/warning/destructive-foreground, --shadow-* tokens); components: status-badge, route-step, invoice, admin pages, quote-output.tsx, checkbox, slider, switch, overlay
