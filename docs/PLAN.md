# Plan

**Status:** 🟢 v1 live · **Last updated:** 2026-09-01
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/plan/

Part of the Embassy Market Intelligence Suite (see `README.md`). Plan is the "Morning Report" — a real financial dashboard modeled on the daily report Matt used in merchandising at a previous job (Walmart), keeping the suite accountable to real numbers instead of projections. Unlocked 2026-08-26, the day Matt got QuickBooks financials access.

## What it is

A single-page dashboard (`site/plan/index.html`) with five parts:
1. **KPI strip** — Revenue in Range, Clients with Revenue, Avg Revenue/Client, Month-to-Month Delta, YoY Change. All reactive to the filters below.
2. **Month-to-Month Revenue chart** — single-hue bar chart, hover tooltips, plus a collapsible "Monthly figures" table with a YoY column and a click-to-expand company breakdown per month (who ordered that month vs. the same month last year).
3. **Softgoods vs. Hardgoods** — collapsible, default closed. Revenue mix across apparel/headwear/non-apparel promotional product (all-time, last 6 months, last 90 days), a monthly trend chart, and per-segment leaders/losers by product. See its own section below.
4. **Client Sales (CRM) table** — collapsible, default closed. Sortable, searchable, CSV-exportable. Defaults to grouping by **Industry** (ranked by revenue, expandable into companies) rather than a flat list — a toggle switches to a flat **Company** view. Includes `% of Total` and `Cumulative Total` columns (a real Pareto view when sorted by revenue). Company-family rollups (e.g. "Jack Henry" split across 3 Sage sub-accounts) group into one expandable row without merging the underlying data.
5. **Update Data panel** — collapsible, upload a fresh **Sales by Customer Detail** export (.xlsx/.csv), parsed entirely client-side, always a full rebuild. As of 2026-09-01 this is the manual fallback path — the routine weekly refresh now runs on its own. See "Automated weekly refresh" below.

Filters (Industry, Account Rep, month range) sit in a collapsible panel, default closed, live summary in the header — same standing rule as every collapsible in this suite.

## Data pipeline (not automated — rerun by hand on a fresh QuickBooks pull)

**Rebuilt 2026-08-28** to read one QuickBooks report instead of two. Original design used **Transaction List by Customer** (invoice-level dates/amounts) + **Income by Customer Summary** (the audited revenue total) together, because gross invoice amounts include sales tax and don't tie to real Income — a real gap, confirmed directly (one invoice: $1,005.99 gross vs. $931.68 Income). That required a tax-correction ratio and a proportional monthly-weighting estimate to reconcile the two.

Matt's actual refresh cadence turned out to be a single QuickBooks report — **Sales by Customer Detail**, run for **All Dates** — already scheduled to **email him every Monday at 8:00 AM CST**; he moves the attachment into a Google Drive folder (`_Rolling Financials`) himself and archives the previous week's file. Reading a real copy of that file directly (2026-08-28) showed it's **line-item level** (one row per product line on an invoice or credit memo, not one row per invoice) and that its `Amount` column already ties to real Income-account postings — sales tax never posts as its own Income-type line in this report, so there's no gross-vs-Income gap to correct for. Validated against the old two-file pipeline's output: summing `Amount` for Darrow Electric matched to the penny ($2,811.25 both ways), and the whole-book total matched within 0.5% (the small remainder traced to genuinely newer transactions in the fresher file, not a parsing difference). That meant the entire tax-ratio/proportional-weighting mechanism could be **removed**, not just adapted — monthly figures are now exact dated sums.

1. Matt's QuickBooks report **Sales by Customer Detail, All Dates** emails to him every Monday 8:00 AM CST; he moves it into `_Rolling Financials\Sales by Customer Detail.xlsx` and archives the previous week's file — the one manual step left in this half of the pipeline.
2. The Sage active-client export (`_Active Client List with Notes\ClientRpt.xlsx`) still gets converted to CSV via **Excel COM automation** in PowerShell, same as always — there is no working Python in this environment (`python`/`python3` only resolve to non-functional Windows Store stub aliases).
3. `Phase 5 Market Intelligence - Plan\build_plan_data.ps1` reads the Sales by Customer Detail `.xlsx` **directly via Excel COM** (bulk `Value2` array read, not a CSV round-trip — sidesteps the embedded-newline class of bug below entirely, since the report's free-text `Description` column could carry the same hazard). Keeps only rows where `Transaction type` is Invoice or Credit Memo and `Account type` is Income or Other Income; line items sharing the same (customer, invoice/credit-memo number) get summed into one entry — that's the level order counts, dedup, and the invoices export all operate at.
4. Joins to the Sage client export by exact company-name match.
5. Computes company-family groups (`familyKey`) via a conservative rule: name A "roots" name B only when B starts with A followed by a non-alphanumeric boundary character (space/hyphen/&/comma) — e.g. "Jack Henry" roots "Jack Henry-Golf". Deliberately does **not** group things like "Kubota of Joplin"/"Kubota of Harrison" (neither is a prefix of the other) — under-grouping is the safe failure mode for financial data, over-grouping is not.
6. **Excludes every invoice dated before 2025-04-01** (`$OWNERSHIP_CUTOFF` in the script) — current ownership took over ~summer 2025, and pre-cutoff revenue belongs to the previous owner, not meaningful to report on (Matt, 2026-08-28). This is a real data-layer exclusion, not a UI filter: `totalIncome`, `orderCount`, and every `monthly` entry only ever reflect post-cutoff invoices/credit memos. `lastInvoiceDate` deliberately stays lifetime — still useful to know when a client last showed up at all, even if their current-ownership revenue is $0. **If a data refresh looks like it "lost" 2024 revenue, this is why, not a bug.**
7. Also outputs `plan_invoices.json` (raw invoice/credit-memo-level records — company/num/date/amount, post-cutoff only) → copied to `site/plan/invoices.json`. A useful raw artifact (e.g. a future per-invoice drill-down), though the browser Update Data panel below no longer needs it for dedup — every weekly upload is a full rebuild now, not an incremental merge.
8. Outputs `plan_data.json` → copied to `site/plan/data.json`.

**A company can now genuinely disappear from the dataset on a routine refresh** — if it has zero Income/Other-Income sales rows in a given week's file, it won't appear in `clientsOut` at all (the old Income-Summary-driven pipeline would still list it at $0). This is correct behavior (no real revenue, no reason to list it), but it means the Update Data panel's dropped-customer warning (below) is worth actually reading, not just a formality.

## Output schema — `data.json` and `invoices.json`

Two files drive everything on the Plan hub. Both are plain JSON, no compression, fetched once on page load (`data.json`) or lazily by the Update Data panel (`invoices.json` isn't fetched on a normal visit).

### `site/plan/data.json`

```json
{
  "meta": {
    "generatedAt": "2026-08-28 11:02",
    "totalClients": 733,
    "matchedClients": 621,
    "unmatchedCount": 112,
    "totalIncome": 4808227.87,
    "months": ["2025-04", "2025-05", ..., "2026-08"]
  },
  "clients": [
    {
      "company": "Darrow Electric",
      "matched": true,
      "industry": "Trades",
      "acctRep": null,
      "acctReps": "",
      "acctStatus": "Active",
      "rating": "0",
      "salesPotential": "1",
      "city": "Springfield",
      "state": "MO",
      "lastInvoiceDate": "2026-08-25",
      "totalIncome": 2811.25,
      "orderCount": 11,
      "monthly": { "2026-08": 177, "2025-09": 1303.45, "...": "..." },
      "familyKey": null
    }
  ],
  "unmatched": ["Civil War Ranch, LLC", "..."]
}
```

**`meta`** — one summary row for the whole book. `months` is the sorted list of every `yyyy-MM` key that appears in any client's `monthly` (drives the chart's x-axis and the Year selector's bounds). `totalIncome`/`totalClients`/`matchedClients` are simple aggregates over `clients[]`, kept in `meta` so the KPI strip and footer note don't need to recompute them from the full array on every load.

**`clients[]`** — one row per company, i.e. one row per QuickBooks customer name in the source file (not per family group — see `familyKey` below). Key fields, and which ones actually drive UI vs. are just carried through:

| Field | Type | Actively drives the UI? | Notes |
|---|---|---|---|
| `company` | string | Yes — primary key everywhere | Exact QuickBooks customer name; also the join key to Sage and to `invoices.json` |
| `matched` | boolean | Yes — "No match" badge, unmatched note, CRM filter | Whether `company` found an exact-name match in the Sage export |
| `industry` | string\|null | Yes — CRM table's default grouping, Industry filter chips | `null` when unmatched; renders as "(Not in Sage)" |
| `acctRep` | string\|null | Yes — Account Rep filter chips, CRM column | Sanitized (`Clean-AcctRep`/JS equivalent strips garbage values from a known Sage CSV-alignment bug) |
| `acctReps` | string\|null | No — carried through, not rendered | Raw/unsanitized Sage value behind `acctRep`; kept for a future audit trail |
| `acctStatus`, `rating`, `salesPotential`, `city`, `state` | string\|null | No — carried through, not rendered today | Straight from Sage; exist because the join fetches the whole `ClientRpt` row, not because the UI uses them yet |
| `lastInvoiceDate` | string ("yyyy-MM-dd") \|null | Yes — CRM table's "Last Invoice" column | **Lifetime**, not scoped to the ownership cutoff — a $0-since-cutoff client can still show a real last-order date |
| `totalIncome` | number | Yes — revenue everywhere (KPI strip, chart, CRM, exports) | **Post-cutoff only** (≥ 2025-04-01), exact sum of Income/Other-Income `Amount` since the 2026-08-28 rebuild — no correction factor applied |
| `orderCount` | number | Yes — CRM column, nurture-list logic | Post-cutoff, counts distinct Invoice-type records only (Credit Memos affect `totalIncome`/`monthly` but aren't counted as an "order") |
| `monthly` | object `{ "yyyy-MM": number }` | Yes — the entire revenue chart and monthly table | Sparse — only months with real activity are keys; a month with no `monthly` entry is treated as $0 in range calculations |
| `familyKey` | string\|null | Yes — CRM table's rollup grouping | Set to the "root" company name when this company is part of a detected family group (e.g. `"Jack Henry"`); `null` for a standalone company. The root company's own `familyKey` equals its own `company` |

**`unmatched`** — just the sorted list of `company` values where `matched` is `false`; a denormalized convenience so the "no match" summary note doesn't have to filter `clients[]` itself.

### `site/plan/invoices.json`

```json
[
  { "company": "Darrow Electric", "num": "460575", "date": "2025-10-27", "amount": 96.9 }
]
```

Flat array, one row per (customer, invoice/credit-memo number) — post-cutoff only, already summed across any underlying line items. Not used by the normal dashboard page load; kept as a raw artifact for future per-invoice drill-down features. `amount` is signed (a Credit Memo record can be negative).

## Softgoods vs. Hardgoods (added 2026-09-01)

Started as a one-off analysis (Matt asked for "a review on the sales by product over time to give a view on the ratio of softgoods to hardgoods"), shipped first as a published one-pager artifact and a matching 1-page landscape PDF, then promoted into a real, permanent Plan section once Matt confirmed he wanted it live rather than a static report — "add a section to Plan to show this and have a new one built each time fresh data is loaded."

**Classification** uses Embassy's own QuickBooks income accounts (the `Account Name` column in Sales by Customer Detail), not guessed from product codes:
- **Softgoods** = `4050 Shirts`, `4040 Jackets`, `4020 Fleece`
- **Headwear** = `4030 Hats` — split into its own third category, not folded into Softgoods or Hardgoods, after Matt asked whether the business was "strong enough" to track it separately: at $1.01M all-time it's the #3 individual product line by revenue (behind Shirts and the general Promotional-income bucket), bigger than Jackets and Fleece combined. Splitting it out surfaced a real finding the binary split couldn't show: headwear's share of revenue has stayed remarkably flat (~21-23%) across all-time/6-month/90-day windows, while hardgoods' growing share is coming directly out of core apparel, not headwear.
- **Hardgoods** = `4001 Promotional income` (the general non-apparel bucket), `4000 BAGS`
- **Excluded** (not a product category): `4010 Embroidery` (a decoration charge), `8200 Shipping income`, `8205 Other income`, `4999 Discounts given`

**What it shows**: three stat tiles (all-time since the ownership cutoff, last 6 months, last 90 days — each a % + $ split across the three segments), a monthly 100%-stacked bar chart (Apr 2025 onward, with the % baked directly into each bar segment — Matt asked for this explicitly after seeing the first version without it), and a **leaders & losers by product** grid: top 3 by revenue and top 3 by biggest decline in each segment, comparing the last 90 days to the 90 days before that.

**Computed alongside the main customer/invoice aggregation, not a separate read.** `build_plan_data.ps1`'s single pass over Sales by Customer Detail (Section 1) also classifies each line item into a bucket and captures it into `$productRows` when it matches; a second pass over just that (much smaller) list, once the file's true max date is known, resolves the monthly trend and the leaders/losers trailing-90-day windows — the windows can't be resolved until the whole file has been scanned once, so this genuinely needs two passes, but only the second one is over already-filtered data. Output lands in `data.json`'s new top-level `productMix` key (schema below) — same file, same generation, so this section is automatically current every time the pipeline runs, whether that's the automated weekly refresh or a manual Update Data upload. The identical logic is ported into the browser panel too (`parseSalesDetailRows`/`computeProductMix` in `index.html`) and cross-validated against the PowerShell output on a real file — they agree to the penny, including which product tops each leaders/losers list.

**`data.json`'s `productMix` shape:**
```json
{
  "maxDate": "2026-08-31",
  "monthly": [{ "month": "2025-04", "soft": 75505.86, "headwear": 0, "hard": 0 }],
  "last90Days": { "soft": 346014.52, "headwear": 157318.77, "hard": 253528.04 },
  "last6Months": { "soft": 758978.64, "headwear": 354431.73, "hard": 515836.62 },
  "allTime": { "soft": 2363066.92, "headwear": 1010938.47, "hard": 1094672.39 },
  "leadersLosers": {
    "currentStart": "2026-06-03", "currentEnd": "2026-08-31",
    "priorStart": "2026-03-05", "priorEnd": "2026-06-02",
    "soft": { "leaders": [{ "product": "Shirts_8000", "desc": "GILDAN 50/50 DRYBLEND S/S T-SHIRT\nBLACK-2X", "current": 24276.17, "prior": 3629.7, "delta": 20646.47 }], "losers": [] },
    "headwear": { "leaders": [], "losers": [] },
    "hard": { "leaders": [], "losers": [] }
  }
}
```
`leaders`/`losers` arrays are capped at 3 each. `product` is the raw QuickBooks Product/Service SKU code; `desc` is that product's Description from its first-seen row (may contain a literal `\n` — QuickBooks sometimes puts the color/size on its own line — the UI collapses it to `" · "` before display).

**A real bug found building this, worth knowing before extending**: rows with a blank Description (checked directly — these turned out to be generic placeholder line items like "Sales", not real identifiable products, $259K worth in one account alone) need to be excluded from the **leaders/losers product list** but must still count toward the **segment mix totals** — that revenue is real, it's just not attributable to a named product. The first version filtered both from the same source list and understated Softgoods by ~$258K until caught by comparing against a known-good manual total. Fixed via a `hasProduct` flag on each captured row: always counted in the mix/monthly totals, only counted toward leaders/losers when `hasProduct` is true.

**Product names now come from the real QuickBooks catalog, not reconstructed transaction text (added 2026-09-01, same day as the section itself).** Matt noticed a real gap: the top headwear seller showed up as simultaneously the #1 leader *and* #1 loser (real signal, not a bug — still the best-seller, but declining), and the raw transaction-line `Description` field alone didn't give a clean, consistent name to anchor that story to (color/size sometimes before the product name, sometimes after — checked directly, 1,231 of 2,537 real products have more than one distinct Description string across their rows). He then provided QuickBooks' own **Product/Service List** export, which has a single clean `Memo/Description` per SKU, set once per item rather than reconstructed from free text. Coverage checked directly: all 2,537 product codes that actually appear in real sales transactions matched a row in this catalog.

`build_plan_data.ps1` now reads it (`_scratch\productlist.xlsx`, same stable-scratch convention as `clientrpt_sheet1.csv` — a periodically-refreshed reference file, not part of the weekly sales cadence) and joins it in for the `desc` field in `leadersLosers`, falling back to the transaction-line Description for any SKU not found in the catalog. Revenue figures are completely unaffected — this only changes which text labels a product.

**Known gap, not yet closed**: this join only happens in the PowerShell pipeline (the automated weekly path and any full manual rebuild). The browser Update Data panel's `computeProductMix` still falls back to transaction-line Description only, since it doesn't have access to the item catalog — accepted for now since the browser panel is the manual fallback, not the routine path, and product-name quality (unlike a dollar figure) isn't a correctness issue, just a display nicety. A clean fix would ship a small `productnames.json` site asset alongside `data.json` (regenerated by the same pipeline run) for the browser panel to lazy-fetch — not built yet.

A draft manual naming key (`Phase 5 Market Intelligence - Plan\product_naming_key_DRAFT.csv`, top 150 products by revenue) was built as a first pass before Matt supplied the real catalog — now superseded by the catalog join for anything already in QuickBooks, but still useful as a place to override a name the catalog itself has wrong or unclear, if that ever comes up. Not currently joined into the pipeline.

## Specials/promotions lift analysis (2026-09-01 — one-off, not a live Plan section)

Matt provided the specials he ran each month, Jan–Aug 2026 (one line per month, informal text — e.g. "June - 112PM Heather Grey/Flag Hats") plus QuickBooks' own **Product/Service List** export (`Embassy_Product_Service List.xlsx`, saved to `_scratch\productlist.xlsx` — same file the Softgoods/Hardgoods naming join uses above), and asked whether the specials showed a measurable lift in the sales data. Unlike Softgoods/Hardgoods, this was **not** built as a live `data.json`/pipeline section — it's a one-time analysis delivered as a published Artifact one-pager plus a matching one-page landscape PDF, both scoped to the fixed Jan–Aug 2026 window.

**Resolving specials to real SKUs**: each special's plain-text description was matched against the item catalog, disambiguating ambiguous ones (visor, tumblers) by checking which candidate product(s) actually had real sales activity in that specific month — empirical, not guessed from the catalog text alone. March's umbrella special stayed genuinely unresolved: three different one-time March orders (Patriot Folding, Ridgeline 46" Arc, Compact Econo Folding, $355–$480 each) are all equally plausible and there's no way to pick one from the data alone.

**Method**: for each resolved special, baseline = the average of the other 6 months in the Jan–Aug 2026 window (excluding the special's own month and the month after, zero-inclusive — same baseline used for both columns so they're a fair comparison). Two separate multiples are always shown per row — **this month** and **month after** — each computed against that same baseline, rather than one "best of" number, so a delayed effect is visible directly instead of hidden inside a single figure. Both the multiple and the incremental dollar amount are shown together, since a large multiple off a near-zero baseline (e.g. the rain pullover's 32.9x) can look more dramatic than its real dollar impact ($3.3K).

**A real methodology bug was caught and fixed the same day**, prompted by Matt asking directly "is the verdict taking into account the month after?": the first version wasn't consistently checking the month-after for every row, and the baseline-averaging itself silently differed row to row (some excluded zero-revenue months from the average, some didn't). One special (PC43 in July) had never been checked for a lag effect at all and was reported as a plain decline — properly checked, it recovers to a real 2.09x lift in August. Fixed with one consistent rule applied identically to every row.

**Headline finding**: 5 of the 9 special components show little or no lift in their own month, then a real spike the month after (e.g. the rain pullover: $31 in March, $3,431 in April) — a likely production/decoration lead-time effect between order and invoice. Best same-month performer: June's 112PM hat (21.5x, +$8,408). Two of Matt's own unprompted "didn't go great" calls (May's visor, August's tumblers) were independently confirmed by the data.

**Display fix**: two rows (April's polo, May's visor) initially showed a bare "—" in whichever column had no baseline to divide by. Checked directly against the full sales history (**back to March 2024**, not just the Jan–Aug 2026 analysis window): both products have **zero sales anywhere in the entire dataset** before their one special month — genuinely new items, not just quiet ones (the one near-exception: MM1005, one of the two April-polo SKUs, has a single $29.12 sale on 2025-12-22, outside the analysis window and immaterial to the result). A bare "—" read as "no data," which was misleading — real revenue existed, there was just nothing to compute a ratio against. Fixed to show the raw dollar figure with a "no baseline" caption in that case, reserving "—" for genuinely $0 months.

**Delivery**: published Artifact (`https://claude.ai/code/artifact/085e6395-3728-4dd6-aa97-427cb8266248`, kept up to date in place through both fixes) and a one-page landscape PDF, generated via headless Edge print-to-pdf against a local static file server — see TECHNICAL.md's "One-off PDF reports" section for the reusable pattern (no working Python in this environment).

**Lesson for any future analysis in this suite**: when a methodology involves "check both X and Y," verify it was actually applied to every row before presenting results — not just the rows where checking Y happened to surface a finding. A second lesson from the display fix: a bare "—" is ambiguous between "no data" and "data exists but nothing to compare it to" — always distinguish those two cases explicitly in any ratio-based display.

## Known, fixed-at-the-root gotcha: `Get-Content | ConvertFrom-Csv` breaks on embedded newlines

`Get-Content` splits a file into lines on every raw newline **before** any CSV-quote-awareness applies — including a newline sitting inside a quoted field. Sage's `GeneralNotes`/`ContactNotes` fields sometimes have these, and QuickBooks' own multi-line memos used to trigger it too before the Sales by Customer Detail rewrite moved that read off CSV entirely (see below). Still relevant for the remaining CSV read (ClientRpt): `Read-CsvSkippingHeaderLines` in `build_plan_data.ps1` reads the file with `-Raw` (one string, real newlines intact), splits off just the header lines by count (safe — those never contain embedded newlines), and feeds the rest through `ConvertFrom-Csv` as one unbroken string so its own quote-aware parser handles the rest. **Apply this pattern to any future CSV parsing in this suite** — the bug is in the `Get-Content | ConvertFrom-Csv` combination itself, not specific to one file.

## Update Data panel (upload a fresh export from the browser)

**Rebuilt 2026-08-28** alongside the pipeline change above — one file input now, no mode toggle. Collapsible panel, default closed. Upload the same **Sales by Customer Detail (All Dates)** export Matt gets weekly, parsed entirely client-side via SheetJS (lazy-loaded from cdnjs, only when the panel is opened) — a JS port of the same logic as `build_plan_data.ps1` (same account-type/transaction-type filtering, same ownership cutoff, same family-rollup algorithm), validated against a real file to match the PowerShell pipeline's own output almost exactly (5,704 invoice/credit-memo records in the browser vs. 5,703 from PowerShell — a one-row rounding-boundary difference, not a real discrepancy).

Since the report is always "All Dates," every upload is a **full rebuild**, not an incremental merge — there's no Overwrite/Append choice to make anymore. Sage-derived fields (industry, acctRep, etc.) for companies already known are carried forward from the currently-loaded `data.json` (this flow doesn't re-upload a fresh Sage export); a genuinely new company gets `matched: false`, same as the existing unmatched-customer pattern.

**This doesn't write anywhere by itself** — GitHub Pages has no backend. Processing produces a preview and two downloadable files (`data.json`, `invoices.json`) that still need to come back for a final commit, same handoff as every other data refresh in this suite. A fully-automatic version (committing straight to GitHub from the browser) was considered and explicitly not built — it would require storing a GitHub write-credential somewhere the page can use it, the same category of tradeoff as the paused Firebase/Supabase decision. See `BACKLOG.md`'s consolidated API section.

**This panel is now the fallback path, not the primary one** — see "Automated weekly refresh" below for what actually runs the routine Monday update.

## Automated weekly refresh (added 2026-09-01)

Matt's real ask, once he saw the manual panel in action: "select a file, upload, and the financials refresh" — no browser step, no downloading two files and handing them back. Since the download-and-commit handoff exists only because a public page can't safely hold a GitHub write-credential, the fix is to have **Claude Code do the publishing itself**, using its own already-granted git access — not a credential embedded in the page.

- **What runs**: `Phase 5 Market Intelligence - Plan\weekly_refresh.ps1`, on a **daily scheduled check** (Claude Code scheduled task `plan-weekly-refresh`, 9:00 AM local). It finds the newest "Sales by Customer Detail" file directly in `_Rolling Financials` (filename isn't perfectly consistent week to week — matches on the report name and takes whichever is newest, not an exact filename), compares it against a marker file (`.last_processed_sales_detail.json`) recording the last file it processed, and does nothing if unchanged.
- **On a new file**: runs `build_plan_data.ps1` against it, then applies the **same >15% customer/revenue-drop safety check** as the browser panel, comparing against what's currently live.
  - **Passes**: commits and pushes `data.json`/`invoices.json` straight to `main` — same branch-then-merge git workflow used throughout this repo — and the site is live within about a minute, no notification (Matt explicitly chose not to be pinged on routine success — auto-block-and-notify, not auto-publish-and-notify, 2026-09-01).
  - **Fails**: does **not** commit or push anything, and sends Matt a push notification naming the exact numbers and file that triggered it. He's the only one running this today, and would rather be pulled in on anything that looks wrong than have bad data go live unattended.
- **Real constraint, not hidden**: scheduled tasks run "while the app is open" — if Claude Code isn't running on Matt's machine at the scheduled time, the check simply fires the next time he opens it, not on a guaranteed cloud clock. Given he's the one physically moving the file into the Drive folder each week anyway, this hasn't been a practical problem, but it's not the same guarantee a real always-on backend would give (see `BACKLOG.md`'s consolidated API section for that longer-term direction).
- **`$scratch` in `build_plan_data.ps1` now points at a stable folder** (`Phase 5 Market Intelligence - Plan\_scratch\`, resolved via `$PSScriptRoot`) instead of a session-specific temp path — required for this to work unattended; also just a more correct default for manual runs.

**Post-upload summary** (checklist added 2026-08-28 in response to Matt testing the earlier two-file panel, then rebuilt again the same day for the single-file rewrite):
- Headline: total customers loaded (and how many are genuinely new, never seen before), old total → new total with the dollar delta.
- Sales rows read, and the min–max date span found in the file (the fastest way to eyeball "is this the file I think it is").
- Invoice/credit-memo records since the ownership cutoff, and the month range they span.
- New customer names (capped at 15 in the message, "+N more" beyond that — a bad-file scenario can otherwise dump hundreds of names inline and bury the warning that matters).
- ⚠ Customers that had revenue before but have **zero** activity in this upload, by name (same 15-name cap) — they're about to be dropped from the dataset entirely, worth a real look before sending the result back for a deploy.
- ⚠⚠ **Safety check**: if the new file has notably fewer customers or notably less total revenue than what's currently loaded (>15% drop either way), a loud warning fires before assuming the file is right — since every upload is a full replace now, a wrong file (an export accidentally scoped to a date range instead of "All Dates," or a stale download) would otherwise silently wipe real history instead of erroring out.

## Default view: current fiscal year, not the full data span

Embassy is a private LLC — fiscal year is the calendar year (Jan-Dec). Both the initial page load and "Clear all filters" default the month-range to Jan of the latest year present in the data through the latest available month (e.g. Jan-Aug '26), via `defaultFiscalYearRange()` in `index.html`. "Revenue in Range" therefore reads as a real year-to-date figure by default, not a blend across the ownership change and multiple partial years. The full data range is still reachable by hand through the month-range selects in the Filters panel.

**The script currently expects the Sales by Customer Detail `.xlsx` and the ClientRpt CSV already sitting in a scratch folder** — update the `$scratch` variable at the top of the script (and rerun the ClientRpt Excel-COM export step if it's stale), then run it. Not yet a single one-command pipeline.

## Known, deliberate data limitation (surfaced in the UI, not hidden)

Around 110 QuickBooks customers with real revenue aren't in the active Sage export as of the last run (112 on the 2026-08-28 rebuild) — some are plain name-format mismatches (a legacy `Unmatched_QB_Customers` sheet already tracked 30 of these), the rest look like genuinely lapsed/never-added accounts. Their revenue is included in every dashboard figure; Industry/Account Rep just render blank, with a "No match" badge in the CRM table and a standing note above the chart. This is intentional — Matt has said he doesn't fully trust Sage to stay current, so the financial data is treated as the more reliable source of "who's actually paying," not Sage's active-client flag.

**A real fix, not just a caveat**: Sage's own `LastOrder`/`LastInvoice` fields are populated for only 7 of 1,948 client records (checked directly). The CRM table's "Last Invoice" column uses the actual max QuickBooks invoice date per customer instead, which is populated for every customer with any invoice activity.

## Rollup aggregation rule (a real bug fixed here, worth knowing before extending)

When rolling up a field (Industry, Account Rep) across multiple underlying records, only show a single shared value if *every* member truly matches — including "everyone is blank." Any real variation, including a mix of blank and assigned, reads as "Multiple," never silently adopts whichever member happened to have a non-blank value. (`commonOrMixed()` in `index.html`.) Found as a real bug: a rollup showed "Kevin Greim" as the Retail industry's account rep, as if uniform, when only a handful of its 23 companies actually had him assigned.

## Account Rep, not Account Owner

Sage's `AcctOwner` column is "Autumn Scroggins" for nearly every client — checked directly, not assumed — so it's useless as a filter or breakdown dimension. `AcctReps` actually varies (Kevin Greim, Matt Yarbrough, Emily Henson, etc.), though sparse (~124 of 731 revenue-bearing clients have one assigned). The build script sanitizes it (`Clean-AcctRep`) since a couple of Sage export rows have embedded newlines in notes fields that shift CSV columns, landing garbage ("TRUE", stray note fragments) in `AcctReps`.

## Known open items

See `BACKLOG.md`'s Plan section for the live list, including: reconciling the 109 unmatched customers, tying a metric to Matt's $5,000-by-2026-10-01 goal, the deferred Analysis tab (Revenue by Industry, Rep leaderboard, Concentration/Pareto, Growth/decline leaderboard — scoped 2026-08-26, explicitly not started), and the open bar-vs-line chart question.

## A real finding that came out of this data (worth knowing, not just the mechanics)

The Client Sales table's default Industry-grouping and the Cumulative Total column exist because of a real strategic conversation, not as a feature for its own sake: with rollups collapsed to one row per real client, it takes only 12 clients to cross 50% of total revenue, and 35.5% of all clients (248 of 698) have ordered exactly once, averaging $610, together just 3.2% of revenue — while 17% of clients who've ordered 10+ times generate 76.3% of everything. This directly prompted the Promote rebuild (see `PROMOTE.md`) and the nurture-list export (134 clients with 4-9 lifetime orders, Matt's highest-leverage follow-up target).
