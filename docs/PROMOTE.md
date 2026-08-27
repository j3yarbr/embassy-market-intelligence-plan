# Promote

**Status:** 🟢 v1 live, targeting 9/1 · **Last updated:** 2026-08-27
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

## Test Mode — added 2026-08-27, on by default

Matt asked how recipient emails get pulled in, worried about accidentally BCC-ing real clients while testing. The real mechanism: `data.json` (built from `ClientRpt.xlsx`) is already live on the deployed page the moment it's pushed — picking any industry in the UI puts real emails in the Bcc line immediately, well before anyone opens the file or hits Send in Outlook.

Rather than rely on "be careful," **Test Mode makes it structural**. `matchingClients()` is the single choke point every recipient-related function goes through — when Test Mode is on (the default), it returns `[]` unconditionally and `recipientEmails()` falls back to the 7 internal `@embassygear.com` addresses from `senders.json`, regardless of which industries are selected. Verified directly: selected Manufacturing (121 real contacts) with Test Mode on, launched a real campaign, and confirmed the downloaded `.eml`'s Bcc line held only the 7 internal addresses. Subject line also gets a `[TEST]` prefix while it's on. A banner (green "Test Mode: ON" / amber "LIVE MODE" warning) makes the current state unmistakable before every launch.

**When extending this file**: any new function that needs the recipient list should call `recipientEmails()`, never read `DATA.clients` directly — that's what keeps Test Mode airtight.

## Known open items

See `BACKLOG.md`'s Promote section for the live list. The one real open question: **the `.eml`-download-and-open flow hasn't been tested on iPad** — opening a downloaded `.eml` into Mail/Outlook may not be as smooth on iPad as on a Windows PC, and "workable by 9/1" implies iPad use. Test this early. Also open: the old "unify Promote's flat Sage industry list with Inspire's 8-category taxonomy" question — still unresolved, not blocking (Promote's industries are the real Sage `Industry` field, same source Plan and Focus now use).
