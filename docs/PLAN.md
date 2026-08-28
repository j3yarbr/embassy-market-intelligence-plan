# Plan

**Status:** 🟢 v1 live · **Last updated:** 2026-08-28
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/plan/

Part of the Embassy Market Intelligence Suite (see `README.md`). Plan is the "Morning Report" — a real financial dashboard modeled on the daily report Matt used in merchandising at a previous job (Walmart), keeping the suite accountable to real numbers instead of projections. Unlocked 2026-08-26, the day Matt got QuickBooks financials access.

## What it is

A single-page dashboard (`site/plan/index.html`) with four parts:
1. **KPI strip** — Revenue in Range, Clients with Revenue, Avg Revenue/Client, Month-to-Month Delta, YoY Change. All reactive to the filters below.
2. **Month-to-Month Revenue chart** — single-hue bar chart, hover tooltips, plus a collapsible "Monthly figures" table with a YoY column and a click-to-expand company breakdown per month (who ordered that month vs. the same month last year).
3. **Client Sales (CRM) table** — collapsible, default closed. Sortable, searchable, CSV-exportable. Defaults to grouping by **Industry** (ranked by revenue, expandable into companies) rather than a flat list — a toggle switches to a flat **Company** view. Includes `% of Total` and `Cumulative Total` columns (a real Pareto view when sorted by revenue). Company-family rollups (e.g. "Jack Henry" split across 3 Sage sub-accounts) group into one expandable row without merging the underlying data.
4. **Update Data panel** — collapsible, upload a fresh Transaction List + Income Summary (.xlsx/.csv), parsed entirely client-side, Overwrite or Append mode. See its own section below.

Filters (Industry, Account Rep, month range) sit in a collapsible panel, default closed, live summary in the header — same standing rule as every collapsible in this suite.

## Data pipeline (not automated — rerun by hand on a fresh QuickBooks pull)

1. Matt exports two QuickBooks reports to `Downloads\`: **Transaction List by Customer** and **Income by Customer Summary**.
2. Both, plus the Sage active-client export (`_Active Client List with Notes\ClientRpt.xlsx`), get converted to CSV via **Excel COM automation** in PowerShell (`New-Object -ComObject Excel.Application`) — there is no working Python in this environment (`python`/`python3` only resolve to non-functional Windows Store stub aliases), so every data-export step in this suite goes through PowerShell + Excel COM, not pandas/openpyxl.
3. `Phase 5 Market Intelligence - Plan\build_plan_data.ps1` parses the Transaction List's Invoice-type lines only (Payments are excluded — summing both would double-count revenue) into per-customer, per-month gross totals, then distributes each customer's *audited* Income-by-Customer total across months using those gross-amount proportions as weights. This matters: gross invoice amounts include sales tax and don't tie to "Income" (confirmed directly — one real invoice was $1,005.99 gross vs. $931.68 Income, an ~8% gap consistent with regional sales tax). Weighting this way means every client's monthly figures still sum exactly to the audited total.
4. Joins to the Sage client export by exact company-name match (622 of 731 QuickBooks customers matched an active Sage record on the 2026-08-26 run).
5. Computes company-family groups (`familyKey`) via a conservative rule: name A "roots" name B only when B starts with A followed by a non-alphanumeric boundary character (space/hyphen/&/comma) — e.g. "Jack Henry" roots "Jack Henry-Golf". Deliberately does **not** group things like "Kubota of Joplin"/"Kubota of Harrison" (neither is a prefix of the other) — under-grouping is the safe failure mode for financial data, over-grouping is not.
6. **Excludes every invoice dated before 2025-04-01** (`$OWNERSHIP_CUTOFF` in the script) — current ownership took over ~summer 2025, and pre-cutoff revenue belongs to the previous owner, not meaningful to report on (Matt, 2026-08-28). This is a real data-layer exclusion, not a UI filter: `totalIncome`, `orderCount`, and every `monthly` entry only ever reflect post-cutoff invoices. `totalIncome` is computed as the post-cutoff gross invoice total × a tax-correction ratio derived from that client's *full* invoice history (keeps the sales-tax correction described above without letting pre-cutoff dollars leak into the current-ownership total). `lastInvoiceDate` deliberately stays lifetime — still useful to know when a client last showed up at all, even if their current-ownership revenue is $0. **If a data refresh looks like it "lost" 2024 revenue, this is why, not a bug.**
7. Also outputs `plan_invoices.json` (raw invoice-level records — company/num/date/amount, post-cutoff only, ~5,600 rows) → copied to `site/plan/invoices.json`. Lazy-loaded by the Update Data panel only, not fetched on a normal page visit.
8. Outputs `plan_data.json` (~280KB, spanning 2025-04 onward) → copied to `site/plan/data.json`.

## Known, fixed-at-the-root gotcha: `Get-Content | ConvertFrom-Csv` breaks on embedded newlines

`Get-Content` splits a file into lines on every raw newline **before** any CSV-quote-awareness applies — including a newline sitting inside a quoted field. QuickBooks auto-generates multi-line memos for "Paid via QuickBooks Payments" confirmations (25 instances in the 2026-08-28 export), and Sage's `GeneralNotes`/`ContactNotes` fields sometimes have them too. Either one silently corrupts the row immediately after it, which can misattribute or drop that transaction/client row entirely — found 2026-08-28 while validating the Update Data feature's browser-based parser (reads the raw `.xlsx` directly, no CSV round-trip, immune to this) against the existing pipeline; it caught ~140 invoices the old pipeline was silently missing. **Fixed at the root**, not patched around: `Read-CsvSkippingHeaderLines` in `build_plan_data.ps1` reads the file with `-Raw` (one string, real newlines intact), splits off just the header lines by count (safe — those never contain embedded newlines), and feeds the rest through `ConvertFrom-Csv` as one unbroken string so its own quote-aware parser handles the rest. Applied to all three CSV reads (Income Summary, Transaction List, ClientRpt). **If you're comparing screenshots from before vs. after 2026-08-28, the numbers will differ — that's this fix, not a data regression** (Jan-Aug '26 Revenue in Range moved from $2,090,554 to $2,240,080).

## Update Data panel (upload a fresh export from the browser)

Collapsible panel, default closed. Upload a Transaction List by Customer + Income by Customer Summary (`.xlsx` or `.csv`), parsed entirely client-side via SheetJS (lazy-loaded from cdnjs, only when the panel is opened) — replicates the same parsing/business logic as `build_plan_data.ps1` (same ownership cutoff, same tax-correction math, same family-rollup algorithm, ported to JS and validated to reproduce matching totals against a real file).

- **Overwrite mode**: full recompute using only the uploaded files. Sage-derived fields (industry, acctRep, etc.) for companies already known are carried forward from the currently-loaded `data.json` (Matt isn't re-uploading a fresh Sage export in this flow) — a genuinely new company gets `matched: false`, same as the existing unmatched-customer pattern.
- **Append mode**: merges new invoices into the existing dataset (lazy-loaded from `invoices.json`), **deduped by QuickBooks invoice number** so a re-uploaded wide-date-range export doesn't double-count revenue for months already present. Only customers present in the newly uploaded Income Summary get recomputed; everyone else carries forward unchanged. Note: the tax-correction ratio in append mode is computed from available post-cutoff invoices only (not true lifetime gross, since `invoices.json` only ever stores post-cutoff rows) — a reasonable approximation, not identical to a from-scratch PowerShell rebuild, since the sales-tax rate doesn't meaningfully vary by window.

**This doesn't write anywhere by itself** — GitHub Pages has no backend. Processing produces a preview (customers updated, invoices added/skipped-as-duplicate, old vs. new total) and two downloadable files (`data.json`, `invoices.json`) that still need to come back for a final commit, same handoff as every other data refresh in this suite. A fully-automatic version (committing straight to GitHub from the browser) was considered and explicitly not built — it would require storing a GitHub write-credential somewhere the page can use it, the same category of tradeoff as the paused Firebase/Supabase decision. See `BACKLOG.md`'s consolidated API section.

## Default view: current fiscal year, not the full data span

Embassy is a private LLC — fiscal year is the calendar year (Jan-Dec). Both the initial page load and "Clear all filters" default the month-range to Jan of the latest year present in the data through the latest available month (e.g. Jan-Aug '26), via `defaultFiscalYearRange()` in `index.html`. "Revenue in Range" therefore reads as a real year-to-date figure by default, not a blend across the ownership change and multiple partial years. The full data range is still reachable by hand through the month-range selects in the Filters panel.

**The script currently expects the three source CSVs already exported to a scratch folder** — rerun the Excel-COM export step first with fresh paths, update the `$scratch` variable at the top of the script, then run it. Not yet a single one-command pipeline.

## Known, deliberate data limitation (surfaced in the UI, not hidden)

109 QuickBooks customers with real revenue aren't in the active Sage export as of the last run — some are plain name-format mismatches (a legacy `Unmatched_QB_Customers` sheet already tracked 30 of these), the rest look like genuinely lapsed/never-added accounts. Their revenue is included in every dashboard figure; Industry/Account Rep just render blank, with a "No match" badge in the CRM table and a standing note above the chart. This is intentional — Matt has said he doesn't fully trust Sage to stay current, so the financial data is treated as the more reliable source of "who's actually paying," not Sage's active-client flag.

**A real fix, not just a caveat**: Sage's own `LastOrder`/`LastInvoice` fields are populated for only 7 of 1,948 client records (checked directly). The CRM table's "Last Invoice" column uses the actual max QuickBooks invoice date per customer instead, which is populated for every customer with any invoice activity.

## Rollup aggregation rule (a real bug fixed here, worth knowing before extending)

When rolling up a field (Industry, Account Rep) across multiple underlying records, only show a single shared value if *every* member truly matches — including "everyone is blank." Any real variation, including a mix of blank and assigned, reads as "Multiple," never silently adopts whichever member happened to have a non-blank value. (`commonOrMixed()` in `index.html`.) Found as a real bug: a rollup showed "Kevin Greim" as the Retail industry's account rep, as if uniform, when only a handful of its 23 companies actually had him assigned.

## Account Rep, not Account Owner

Sage's `AcctOwner` column is "Autumn Scroggins" for nearly every client — checked directly, not assumed — so it's useless as a filter or breakdown dimension. `AcctReps` actually varies (Kevin Greim, Matt Yarbrough, Emily Henson, etc.), though sparse (~124 of 731 revenue-bearing clients have one assigned). The build script sanitizes it (`Clean-AcctRep`) since a couple of Sage export rows have embedded newlines in notes fields that shift CSV columns, landing garbage ("TRUE", stray note fragments) in `AcctReps`.

## Known open items

See `BACKLOG.md`'s Plan section for the live list, including: reconciling the 109 unmatched customers, tying a metric to Matt's $5,000-by-2026-10-01 goal, the deferred Analysis tab (Revenue by Industry, Rep leaderboard, Concentration/Pareto, Growth/decline leaderboard — scoped 2026-08-26, explicitly not started), and the open bar-vs-line chart question.

## A real finding that came out of this data (worth knowing, not just the mechanics)

The Client Sales table's default Industry-grouping and the Cumulative Total column exist because of a real strategic conversation, not as a feature for its own sake: with rollups collapsed to one row per real client, it takes only 12 clients to cross 50% of total revenue, and 35.5% of all clients (248 of 698) have ordered exactly once, averaging $610, together just 3.2% of revenue — while 17% of clients who've ordered 10+ times generate 76.3% of everything. This directly prompted the Promote rebuild (see `PROMOTE.md`) and the nurture-list export (134 clients with 4-9 lifetime orders, Matt's highest-leverage follow-up target).
