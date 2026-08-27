# Embassy Market Intelligence Suite — Overall Infrastructure

**Last updated:** 2026-08-27

This is one of six reference docs for the suite: this file (Overall Infrastructure), `FOCUS.md`, `INSPIRE.md`, `PROMOTE.md`, `PLAN.md`, and `TECHNICAL.md` (Technical / Architecture / Troubleshooting). In this repo the other five live in `docs/`; the same six files also live in the Google Drive source folder, one per module's phase folder plus two at the suite root (see "Where things live," below) — keep both copies in sync when either changes.

## What this is

A connected suite of internal tools for Embassy (custom branded apparel/merchandise, four-state B2B market), replacing "the sterile web catalog" with a relationship-first, consultative sales process:

> Focus isolates prospects → Inspire converts inspiration into sales → Promote turns digital attention into orders → Plan keeps it accountable.

Matt Yarbrough joined Embassy in a sales role without a hard-sell background. Rather than force that trait, he's building infrastructure so no single prospect matters too much — Focus and Plan exist to keep the pipeline always stocked with a next lead.

## Module status

| Module | Status | What it does |
|---|---|---|
| **Focus** | ✅ Live | Interactive map isolating prospects/clients across the four-state territory. See `FOCUS.md`. |
| **Inspire** | 🟢 Live | Guided consultative tool — form + earmarkable option gallery, 6-category product model, all 48 industry-rule rows reviewed. See `INSPIRE.md`. |
| **Promote** | 🟢 v1 live, targeting 9/1 | Web rebuild of the desktop Campaign Studio — flyer upload, drafted copy, industry targeting, downloads a real `.eml` for manual review/send in Outlook. See `PROMOTE.md`. |
| **Plan** | 🟢 v1 live | Real financial dashboard ("Morning Report") — CRM sales-by-client, month-to-month revenue, Industry/Pareto rollups, unlocked by real QuickBooks access on 2026-08-26. See `PLAN.md`. |
| **Admin** | 🔵 Not started | Confirmed as real roadmap scope (2026-08-21), not yet speced beyond the name. |
| **Product** | ❌ Dropped | Was a folder of SanMar PDF catalogs — Inspire's product-gallery direction covers this need better. |

Landing page status badges lag slightly behind "live" on purpose — Promote and Plan both show "In Development" with a "Preview →" link rather than the filled-blue "Open" style Focus uses, since both are real v1s Matt should keep testing before treating them as fully final.

## Where things live

**Source files** (all editable content — Python engines, rule JSON, Excel/Word docs, branding assets): `C:\Users\Owner\My Drive\Embassy Market Intelligence\` on Matt's machine, Google-Drive-for-Desktop-mirrored (Mirror mode — a real local folder, not cloud-only), organized as `Phase 0` (Data Sources) through `Phase 5` (Plan), plus `Branding Logos`. This is the **one working copy** — an older standalone `Documents\Embassy Market Intelligence\` folder is retired and shouldn't be referenced.

**Deployed site** (this repository): `https://github.com/j3yarbr/embassy-market-intelligence-plan`, local clone at `C:\EmbassyMapDeploy\embassy-market-intelligence-plan` (short path deliberately, to dodge a Windows git "filename too long" issue). Only `site/` is deployed — it's a separate, purely-static copy of whatever's currently live, not a mirror of the Drive source. See [TECHNICAL.md](docs/TECHNICAL.md) for the deploy pipeline.

**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/ — the Suite Landing Page, linking out to each module (`/focus/`, `/inspire/`, more to come).

**Backlog:** `BACKLOG.md` at the root of the Drive source folder — a plain markdown checklist, organized by module, with a "Recently Completed" log. Check this first when resuming any work.

## Suite-level infrastructure

- **Suite Landing Page** (`site/index.html`): single hub page, status badges per module, navy/blue/white/gray palette (see [TECHNICAL.md](docs/TECHNICAL.md) for the exact palette and branding assets).
- **Favicon / app icons**: the Embassy compass mark (cropped from the full logo, transparent PNG) at `site/favicon.png`, referenced from every page. As of 2026-08-27, every page also ships a real `favicon.ico` (the PNG wrapped in an ICO container — Windows' "Create shortcut" icon generation doesn't reliably use a PNG-only favicon), an `apple-touch-icon` link, and a per-page `manifest.json` — together these are what make a desktop or iPad home-screen shortcut show the real Embassy icon instead of a generic letter. Existing shortcuts made before this fix need to be deleted and re-created to pick it up (the icon gets baked in at creation time).
- **Auto-update banner**: every live page polls a deploy-generated `site/version.json` every 60 seconds and shows a "Refresh" banner if a newer version has shipped while the page was open — deliberately notify-and-let-the-user-choose, not a silent reload, so in-progress form entries don't vanish. See `TECHNICAL.md` for the mechanism.
- **Data pipeline pattern**: Plan and Promote both pull real Sage/QuickBooks data through the same pipeline — Excel COM automation (PowerShell) exports the source `.xlsx` to CSV, a PowerShell build script (`build_plan_data.ps1`, `build_promote_data.ps1`) parses it into a JSON file, which gets copied into the relevant `site/<module>/data.json` and committed. Not live/automatic — rerun by hand whenever the underlying export changes. See `TECHNICAL.md` for why this is PowerShell and not Python.
- **Google Drive connector**: also connected in Claude/Cowork, so sessions without desktop-app access (e.g. iPad) can read the same source content via Drive's API, independent of whether the desktop machine is even on.

## Architecture decision pending: a real backend (auth, database, email)

Several real needs across the suite — access control, Inspire's Saved Cases being device-local, Promote's manual email send, Plan's data requiring a manual re-export cycle — all point at the same underlying gap: the suite is entirely static (GitHub Pages, no server) with no way to keep anything secret, enforce real authorization, or serve live data. **This is scoped in detail but deliberately not started** — Matt's own call (2026-08-26): "doesn't feel like the right time." See `BACKLOG.md`'s Suite-Level section for the full consolidated writeup (the lift, the people, the why) before picking this up. Two real candidates already compared: **Firebase** (Firestore/Auth/Functions) or **Supabase** (Postgres/Auth/Edge Functions — the one that supports real SQL, which matters if ad-hoc querying against the data is a goal).

## Working preferences (how to collaborate on this project)

- Matt prefers working through decisions collaboratively — flag genuine trade-offs and ask, rather than picking silently and presenting a done deal.
- Don't assume urgency on this project. Active sales work takes priority over suite development whenever the two conflict.
- Every collapsible-capable UI element defaults to closed, unless a specific instruction says otherwise — a standing rule across all suite web apps, not scoped to one build.
