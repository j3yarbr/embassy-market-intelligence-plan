# Promote

**Status:** 🟠 Rebuild queued (behind Inspire) · **Last updated:** 2026-08-21

Part of the Embassy Market Intelligence Suite (see `README.md`). Promote is the Campaign & Outreach Engine — turning digital attention into orders via targeted flyer/email campaigns.

## Current state: a working desktop app

`promote_app.py`, in `Phase 4 Market Intelligence - Promote\` in the Drive source folder — a CustomTkinter desktop app, **"Embassy Campaign Studio v5.16."**

Flow: pick sender + tone → upload a flyer PDF (renders page 1 to PNG) → select industry checkboxes (sourced from `Sage - Industry List.xlsx`) → draft/polish email copy (has a "Gemini Polish" clipboard handoff to gemini.google.com) → set a click-through link → "Launch Campaign" pulls the client list, filters by selected industries + a `MarketingOk` flag, builds an HTML email with the flyer embedded inline, BCCs every matching contact, and hands the `.eml` to Outlook. `Campaign_Matt.eml` in the same folder is a real saved output of this exact flow.

## Decision: rebuild as a web app

To prioritize iPad/phone use, matching Focus and Inspire's pattern. **Queued behind Inspire** — don't start without checking in first.

## Real local dependencies (the actual portability blockers)

Confirmed by reading `promote_app.py` directly — these are what actually need to change for a web rebuild, not the Drive migration (nothing in Promote reads from the Drive-migrated project folder at all):

- **`DEFAULT_CLIENT_LIST` and `INDUSTRY_LIST_XLSX`** read from a UNC network share:
  ```
  \\server-1\shared\Market Intelligence Hub - Matt Yarbrough\Embassy Market Intelligence\Market Intelligence - Data Sources\...
  ```
  (This share path happens to *also* contain a folder literally named "Embassy Market Intelligence" — easy to conflate with the local Drive-mirrored project folder, but it's a completely separate root. Don't conflate the two.)
- **Outlook shell-out**: the desktop UI hands the finished `.eml` directly to a local Outlook install (`C:\Program Files\Microsoft Office\root\Office16\OUTLOOK.EXE` or the x86 path) to send.

## Rebuild plan

- Swap the network-share reads for the **Google Drive connector** — requires placing current/synced copies of `Market Intelligence - Client List from Sage.xlsx` and `Sage - Industry List.xlsx` into Drive first.
- Replace the Outlook handoff with a real transactional email API (Gmail API, SendGrid, etc.).
- **Open question**: Promote's segment picker currently reads a flat Sage industry list; Inspire has its own richer 8-industry taxonomy. Decide whether to unify these before/during the rebuild, or keep them separate — raise this explicitly with Matt rather than picking silently.

See `BACKLOG.md` in the Drive source folder for current status.
