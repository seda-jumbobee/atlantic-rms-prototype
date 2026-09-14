# Atlantic RMS — Rate Management Solution (Prototype)

Interactive, demo-data prototype of the **Rate Management Solution** for **Atlantic Project Cargo** (sister brands JumboBee, Atlantic Express). This repo is a **design handoff**: a fully clickable Next.js app to refine the interface directly in-product (e.g. with Claude Design / v0 / shadcn) — not a production build.

**Live demo:** https://rms-atlantic-prototype.vercel.app

**Evaluation accounts** — `manager@jumbobee.com` (sales) and `admin@jumbobee.com` (Procurement).
Passwords are shared separately, not committed here. These two require their real password; the
other seeded demo accounts still accept any non-empty one.

> Prototype only: data is fully mocked, there is no backend, and auth is a client-side mock. The demo is de-indexed (`robots.txt` disallow-all + `noindex`).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000   (Node 20 recommended)
```

- **Sign in:** any `@atlanticprojectcargo.com` / `@jumbobee.com` / `@atlanticexpresscorp.com` address
  that matches a seeded account. There are no demo shortcut buttons on the login screen.
- **Roles** come from the account, and there is no in-app role switcher: sign in as
  `admin@jumbobee.com` for Procurement, `manager@jumbobee.com` for sales. The **Administration** nav
  section and the cost/margin figures appear only for Procurement.

Tech: **Next.js 15** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4** · **shadcn/ui** (Radix) · **Leaflet** (maps). Fonts: **Satoshi** (UI) / **Geist Mono** (figures & codes).

---

## For designers — where the look lives

| What | Where |
|------|-------|
| **Design tokens** (colors, radius, sidebar, brand) | `app/globals.css` — CSS variables in `:root` / `.dark` + `@theme inline`. Primary is brand indigo `#232572` with an amber `#FFB051` secondary; the sidebar is a light shell surface. Contrast figures are recorded beside the tokens they justify. Change these to re-skin globally. |
| **UI primitives** (buttons, cards, tables, dialogs, selects…) | `components/ui/*` — shadcn/ui source you fully own. Restyle here or add variants. |
| **App chrome** | `components/app-sidebar.tsx`, `components/app-topbar.tsx`, `components/logo.tsx` |
| **Domain components** (freight-specific UI) | `components/quote/*` (leg-stage visualization, result cards, charge grid, editor, PDF/output), `components/commodity-picker.tsx`, `components/location-combobox.tsx`, `components/map-preview.tsx` (Leaflet), `components/route/*` |
| **Icons** | `lucide-react` |
| **Fonts** | `app/layout.tsx` (Geist) |

**Iterating with AI design tools:** every screen is a real React component, so you can point Claude Design / v0 / `npx shadcn add` at these files and refine in place. Keep edits inside `components/*` and `app/globals.css`; the mock-data layer (`lib/data/*`) and page routes can stay as-is while you restyle.

**Known design to-dos (stakeholder feedback):** the Quote Master commodity widget (`components/commodity-picker.tsx`) needs a cleaner layout for the optional *Unit condition / Loading method / Container* dropdowns; general visual-polish pass across the admin tables.

---

## Project structure

```
app/
  (auth)/         login, register (corporate-email only, closed registration)
  (app)/          authenticated shell (sidebar + topbar); every feature page:
    page.tsx            RMS Home (Quote Master widget + stats + recent)
    quote-master/       3-step wizard: search → choose rate → build quote
    route-builder/      multi-leg composer + Leaflet map + routing provider
    templates/          saved quote templates
    calculators/[id]/   13 calculators (shipping-lines, trucking, roro, …)
    deals/[id]/         CRM pipeline, margins (admin), invoice comparison, operations
    history/            quotes + calculations
    admin/              vendors, rate-library, data-sources, front-review,
                        invoices, reports, request-log, users, integrations
  robots.ts       noindex (disallow all)
components/        UI primitives (ui/) + domain components
lib/
  data/           ALL mock/seed data (ports, carriers, equipment, vendors,
                  rates, deals, calculators, templates, …)
  types.ts        domain model
  quote-engine.ts rate/quote assembly logic
```

## Notes
- **Mock data only** — `lib/data/*`. No API calls, no database. Records are realistic demo data, not live.
- **Roles** — `components/session-provider.tsx` (client-side mock). Admin = Procurement Manager.
- **Not for production** — contains company-specific demo content; treat as internal.
