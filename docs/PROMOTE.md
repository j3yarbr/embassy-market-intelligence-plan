# Promote

**Status:** 🟢 v1 live, targeting 9/1 · **Last updated:** 2026-09-11
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/promote/

Part of the Embassy Market Intelligence Suite (see `README.md`). Promote is the Campaign & Outreach Engine — turning digital attention into orders via targeted flyer/email campaigns. Rebuilt as a web app 2026-08-27, prompted directly by the concentration/one-and-done-client findings surfaced in Plan (see `PLAN.md`'s last section) — Matt connected "we need to work smarter, not just cold-walk-in more" to finally prioritizing this rebuild, with a hard 9/1 deadline.

## Original desktop app (still exists, kept as reference — not deleted)

`Phase 4 Market Intelligence - Promote\promote_app.py` — a CustomTkinter desktop app. Its own title string says **"v1.1"**; the old README/memory both said "v5.16," which was wrong — corrected 2026-08-27 by reading the actual source, not trusting stale notes. Two things worth knowing that weren't obvious from the UI: **"Draft Email" is local string-template logic, not a real AI call**, and **"Gemini Polish" just copies a prompt to the clipboard and opens gemini.google.com** for manual pasting — neither needed an AI API integration in the rebuild, both were trivial to port as plain JS.

Flow: pick sender + tone → upload a flyer PDF (renders page 1 to PNG) → select industry checkboxes → draft/polish email copy → set a click-through link → "Launch Campaign" filters the Sage client list by industry + `MarketingOk`, builds an HTML email with the flyer embedded inline, BCCs every matching contact, hands the `.eml` to a local Outlook install. `Campaign_Matt.eml` in the same folder is a real saved output of this exact flow — used as the structural reference for the rebuild's `.eml` generation.

## Web rebuild — what actually changed

**Data source**: swapped the two UNC network-share reads (`\\server-1\shared\...`) for a JSON export of the Sage client list, same Excel-COM → CSV → JSON pattern as Plan's pipeline (`Phase 4 Market Intelligence - Promote\build_promote_data.ps1` → `site/promote/data.json`). Filters to clients with a usable email (`ContactEmail` → `ContactEmail2` → `GenEmail` fallback) and `MarketingOk=TRUE`: 1,314 marketable contacts across 46 real Industry values, from the same `ClientRpt.xlsx` export Plan uses.

**Sender list**: moved to `site/promote/senders.json` (7 names/`@embassygear.com` emails) — edit that file directly when staff changes, not the app code.

**PDF rendering**: client-side via **pdf.js** (loaded from cdnjs, no backend needed). Renders page 1 to a `<canvas>`, `.toDataURL('image/png')` produces the embeddable image. Verified working end-to-end with a real PDF upload.

**Send mechanism — the real architectural decision, discussed explicitly with Matt, not picked silently**: campaigns still send manually via a downloaded `.eml`, same as the desktop app. `buildEml()` in `index.html` constructs a real `multipart/alternative` → `multipart/related` MIME message by hand (matching the nested structure Python's `EmailMessage.add_alternative()`/`add_related()` produces) — HTML body base64-encoded, flyer PNG embedded inline via `Content-ID`, `X-Unsent: 1` header so the file opens as an editable draft in Outlook rather than a sent/received message. Verified structurally correct against the real `Campaign_Matt.eml` reference file, including a full base64 decode round-trip check on a real generated file, not just eyeballed.

**Why manual send, not a real email API**: Matt's team is described as "not tech savvy" and prefers things "old school" — they trust that a campaign visibly shows up in Outlook before it sends. A real email-sending API (Gmail API, SendGrid, etc.) would remove that visible confirmation and, more importantly, needs a real backend to hold credentials safely — same shape as the currently-paused Firebase/Supabase auth decision (see `README.md`'s Suite-level architecture note and `BACKLOG.md`'s consolidated API section). Not realistic for the 9/1 deadline regardless. Revisit only if/when that backend decision gets made for other reasons.

## Flyer builder — added 2026-08-27, alongside PDF upload

Matt's idea while testing: don't require an existing flyer PDF, offer a build-one-in-app path too. Scoped with him first — three options laid out (simple template fill-in / free-form canvas / AI-generated from a prompt), he picked the template fill-in as the fastest and most predictable.

A toggle switches between "Upload PDF" (unchanged) and "Build a Flyer": 3 templates (Bold Banner, Split Focus, Minimal Center), each rendered entirely client-side on a `<canvas>` — headline/subheadline/contact-line fields update the preview live, the real Embassy compass logo (`../favicon.png`) draws into every template. The rendered canvas feeds `state.flyerBase64` exactly like a PDF upload does, so it goes through the identical `.eml`/Test Mode pipeline with no changes needed downstream. `renderFlyerTemplate()` is the entry point; add a new template by adding a case there and an entry to `FLYER_TEMPLATES`.

## Test Mode — added 2026-08-27, on by default

Matt asked how recipient emails get pulled in, worried about accidentally BCC-ing real clients while testing. The real mechanism: `data.json` (built from `ClientRpt.xlsx`) is already live on the deployed page the moment it's pushed — picking any industry in the UI puts real emails in the Bcc line immediately, well before anyone opens the file or hits Send in Outlook.

Rather than rely on "be careful," **Test Mode makes it structural**. `matchingClients()` is the single choke point every recipient-related function goes through — when Test Mode is on (the default), it returns `[]` unconditionally and `recipientEmails()` falls back to the 7 internal `@embassygear.com` addresses from `senders.json`, regardless of which industries are selected. Verified directly: selected Manufacturing (121 real contacts) with Test Mode on, launched a real campaign, and confirmed the downloaded `.eml`'s Bcc line held only the 7 internal addresses. Subject line also gets a `[TEST]` prefix while it's on. A banner (green "Test Mode: ON" / amber "LIVE MODE" warning) makes the current state unmistakable before every launch.

**When extending this file**: any new function that needs the recipient list should call `recipientEmails()`, never read `DATA.clients` directly — that's what keeps Test Mode airtight.

## Plan special-tracking on launch — added 2026-09-11

Matt's stated long-term target for how the suite's specials tracking should work: "User inputs flyer into Promote to create campaign -> campaign is logged into Plan with the important details and financial tracking begins." This is step one toward that — Promote's campaign creation is the natural front door (it already has the flyer), the gap was that launching never captured *which product* a campaign was about, so there was nothing to hand off to [[project-plan-module|Plan's Monthly Specials Tracking]].

**New optional panel, "Track as a Plan Special"** (same collapsible `.panel` pattern as Target Industries), off by default — checking it exposes: Month (defaults to the current month), Special Label, Tracking Type (SKU vs storewide Category — mirrors the `sku`/`category` split just added to `specials_registry.json`, see `PLAN.md`), and either a SKU list or a regex match pattern depending on type. Deliberately does **not** gate the main Launch button — a campaign that isn't a tracked special (most of Promote's own ad hoc outreach) launches exactly as before if the section is left untouched.

**On Launch, when tracking is on**: validated first (month + label + the type-appropriate field, checked *before* anything downloads — an incomplete tracking entry shouldn't leave a campaign half-launched), then a second file downloads alongside the `.eml`: a ready-to-use `specials_registry.json`-shaped entry (`specials_registry_entry_<month>.json`). **This is still prepare-and-hand-off, not a live write** — same constraint as the Update Data panel and every other "no backend" spot in this suite (see `README.md`'s Suite-level note, `BACKLOG.md`'s consolidated API section). Matt hands the file off (or just says he launched it) to get it merged into the real registry.

**Explicitly scoped narrow, real open question still unanswered**: whether Promote is meant to become the front door even for the recurring SAGE-mailed monthly specials (which today originate from a supplier email + a separate flyer, not Promote), or stays a parallel path for Matt's own ad hoc campaigns while SAGE keeps running independently. Matt's answer so far: "I want to build ad hoc or upload if i didn't build, but the default is to go through promote and promote drives what is in the specials analysis section" — read as Promote being the *default* origination point, with the existing chat-driven/manual registry path staying as the fallback for anything not built here (a SAGE-only send, etc.) — not as Promote taking over SAGE's actual sending mechanism. Revisit if that reading turns out wrong once this gets used for real.

## Recipient filter switched from MarketingOk to EmailMarketing — 2026-09-11

Came up while scoping a curated-outreach-list feature for Plan's Campaign tab (see `PLAN.md`/`BACKLOG.md`) — Matt asked what "has email marketing as a yes" actually means in the data, since Sage carries two different opt-in-shaped fields. Checked the real breakdown before touching anything: `MarketingOk` (client-level, what this pipeline filtered on until now) is TRUE for 1,935 of 1,937 contacts (99.9%) — effectively not discriminating anything. `EmailMarketing` (contact-level) is the field actually used for real opt-outs: 30 explicit 0s. Of the 1,316 clients the old filter emailed, **29 had `EmailMarketing` not set to 1** despite being included — real people whose per-contact preference disagreed with the client-level flag Promote was honoring.

Matt's call: switch to `EmailMarketing`. `build_promote_data.ps1`'s filter now checks `EmailMarketing.Trim() -eq "1"` instead of `MarketingOk`. Result: **1,287 marketable clients**, down from 1,316 — those 29 people stop being emailed. Nobody who passed both flags loses anything (every `EmailMarketing=1` contact already passed `MarketingOk` too).

**Real operational bug also fixed while in this script**: `$scratch` was hardcoded to a session-specific Claude Code temp path from whenever the script was first written — same bug class already found and fixed in Plan's `build_plan_data.ps1` (see `TECHNICAL.md`). It silently meant this script couldn't run at all outside that one original session. Now `$PSScriptRoot`-relative (`Phase 4 Market Intelligence - Promote\_scratch\`, mirroring Plan's own `_scratch` convention) — copy a current `clientrpt_sheet1.csv` there before running. Also swapped its `Get-Content | ConvertFrom-Csv` read for the `-Raw`-then-split pattern, since this file's `GeneralNotes`/`ContactNotes` free-text fields can carry the same embedded-newline hazard already documented at length in Plan's history.

## Known open items

See `BACKLOG.md`'s Promote section for the live list. The one real open question: **the `.eml`-download-and-open flow hasn't been tested on iPad** — opening a downloaded `.eml` into Mail/Outlook may not be as smooth on iPad as on a Windows PC, and "workable by 9/1" implies iPad use. Test this early. Also open: the old "unify Promote's flat Sage industry list with Inspire's 8-category taxonomy" question — still unresolved, not blocking (Promote's industries are the real Sage `Industry` field, same source Plan and Focus now use).
