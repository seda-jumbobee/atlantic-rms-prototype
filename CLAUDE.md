# Atlantic RMS prototype — project memory

- **User-facing naming:** "Rate Quote" (route `/quote-master`, code says QuoteMaster) and "Custom Route" (route `/route-builder`, code says RouteBuilder). Internal identifiers intentionally unchanged.

- **Design system:** synced 1:1 with the Figma file `RMS New` (`efgMLVK7m16t9Ey3ReIDCl`, page "Ui kit" `32:68`). **Read [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) before styling anything** — it maps every Figma component/node-id to its code file and lists all tokens.
- Token-first: use semantic Tailwind utilities (`bg-primary`, `text-muted-foreground`, `text-status-positive-fg`, `text-caption`…), never raw palette colors (`amber-*`, `slate-*`) or hex.
- Status chips of any kind (quote status, deal stage, source, invoice, route step) use `StatusBadge` from `components/status-badge.tsx` with one of 5 tones: neutral · info · positive · warning · negative.
- Brand (since 2026-07-22): **indigo primary `#282aab`** (hover `#20248f`, active `#14166d`) + **orange secondary `#ff4c00`**; sidebar = indigo surface, active item `bg-sidebar-active` (`#4a4fcf`, lighter than the surface). Figma primitives live in the "Brand Primitives" collection (`brand/primary/*`, `brand/secondary/*`, `feedback/*`, `neutral/*`); old greens are `deprecated/*`.
- Font: Inter (`--font-inter` via next/font); mono = Geist Mono. Type ramp in DESIGN-SYSTEM.md.
- Dev server: `npm run dev` (Node via nvm: `~/.nvm/versions/node/v24.18.0/bin`), http://localhost:3000, mock login via the Manager/Procurement buttons.
- Mock data in `lib/data/*` is read-only demo content; restyling belongs in `components/*` and `app/globals.css`.
