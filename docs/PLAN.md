# Plan

**Status:** 🟢 v1 live · **Last updated:** 2026-09-11
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/plan/

Part of the Embassy Market Intelligence Suite (see `README.md`). Plan is the "Morning Report" — originally a real financial dashboard modeled on the daily report Matt used in merchandising at a previous job (Walmart), keeping the suite accountable to real numbers instead of projections (unlocked 2026-08-26, the day Matt got QuickBooks financials access). **As of 2026-09-11, Plan is a multi-domain analytics page, not just financial** — see "Page structure: Financial / Campaign tabs" below for why and what changed.

## What it is

Two tabs, `Financial` and `Campaign` (added 2026-09-11 — see "Page structure" below), sharing one page shell (`site/plan/index.html`). The Financial tab is everything that was here before, unchanged:
1. **KPI strip** — Revenue in Range, Clients with Revenue, Avg Revenue/Client, Month-to-Month Delta, YoY Change. All reactive to the filters below.
2. **Month-to-Month Revenue chart** — a Monthly/Weekly/Daily toggle in the chart's own header (added 2026-09-10 — see below) drives both the chart and the collapsible "Monthly figures" table together, plus a corner button that expands the chart into a larger modal and a dashed trend line on every granularity. In Monthly mode: single-hue bar chart with a YoY reference tick + month-over-month labels, plus a table with a YoY column and a click-to-expand detail view per month — companies this month vs. the same month last year, top-5 sellers each year, a win-back list (real prior-year buyers with zero revenue this month, ranked by dollar size), and an "Export one-pager" button that opens a print-ready report for that month in a new tab (added 2026-09-09 — see its own section below). In Weekly/Daily mode: the chart shows one bar per week/day, chronological (the shape of revenue over time); the table becomes a Pareto — every period in the selected range ranked by revenue, same Pareto concept as the Client Sales table's Cumulative Total, applied to time periods (concentration, not shape).
3. **Softgoods vs. Hardgoods** — collapsible, default closed. Revenue mix across apparel/headwear/non-apparel promotional product (all-time, last 6 months, last 90 days), a monthly trend chart, and per-segment leaders/losers by product. See its own section below.
4. **Client Sales (CRM) table** — collapsible, default closed. Sortable, searchable, CSV-exportable. Defaults to grouping by **Industry** (ranked by revenue, expandable into companies) rather than a flat list — a toggle switches to a flat **Company** view. Includes `% of Total` and `Cumulative Total` columns (a real Pareto view when sorted by revenue). Company-family rollups (e.g. "Jack Henry" split across 3 Sage sub-accounts) group into one expandable row without merging the underlying data.
5. **Update Data panel** — collapsible, upload a fresh **Sales by Customer Detail** export (.xlsx/.csv), parsed entirely client-side, always a full rebuild. As of 2026-09-01 this is the manual fallback path — the routine refresh now runs on its own (daily as of 2026-09-09, see below). Processing a file updates the whole page immediately as a local preview (fixed 2026-09-09 — see below), not just a download.

**Monthly Specials Tracking moved to the Campaign tab (2026-09-11)** — Matt: "monthly specials tracking belongs under campaigns anyway." Same live section (this-month/month-after revenue per registered special vs. a same-year baseline), no logic changed, just relocated — see "Campaign tab" below.

Filters (Industry, Account Rep, month range) sit in a collapsible panel, default closed, live summary in the header — same standing rule as every collapsible in this suite. Filters, KPIs, and everything else described above are scoped to the Financial tab only — the Campaign tab (below) has its own separate content and doesn't react to these.

The **Campaign tab** is a different domain entirely: per-campaign email analytics from Sage's mailer feature (distinct from Promote, which is Matt's own ad-hoc campaign builder — see PROMOTE.md). See "Campaign tab" below for the full detail.

## Page structure: Financial / Campaign tabs (added 2026-09-11)

Matt found a real data source — Sage exports per-recipient tracking (opens, clicks, which products someone clicked) for the recurring mailer campaigns Embassy runs. He also mentioned website analytics is coming next, a third domain. Rather than stack another panel onto an already-long single financial page ("plan is getting packed," his words), he chose to restructure into tabs now, before a third domain shows up and forces the same restructure twice.

**The module keeps the name Plan** — matches the suite's own tagline ("Plan keeps it accountable"), which fits financial and campaign accountability equally; only the page's internal structure changed, not its identity in the suite or its URL.

**Mechanism** (`site/plan/index.html`): a `.page-tabs` bar (`#pageTabs`, two `.page-tab` buttons) sits between `<header>` and `.wrap`. Everything that existed before this change is wrapped in `<div class="tab-panel" id="financialTab">` — a pure layout wrap, no logic inside it changed. A sibling `<div class="tab-panel" id="campaignTab">` holds the new content. `switchTab(tab)` toggles which panel is visible, updates the active tab's styling, and reflects the choice in `location.hash` (`#campaign`) — `init()` checks the hash on load, so a direct link to `.../plan/#campaign` opens straight to that tab (verified on both a same-tab navigation and a genuinely fresh tab load — the two behave differently for a hash-only URL change, since a same-document hash change doesn't re-run `init()`, only a real navigation does; this only matters for automated testing, not for how a person actually opens a shared link).

**Adding Website later**: no rework needed — a third `.page-tab` button, a third `.tab-panel` div, its own render function, called from `switchTab()`'s tab branch. The tab mechanism itself doesn't care how many domains there are.

## Data pipeline (not automated — rerun by hand on a fresh QuickBooks pull)

**Rebuilt 2026-08-28** to read one QuickBooks report instead of two. Original design used **Transaction List by Customer** (invoice-level dates/amounts) + **Income by Customer Summary** (the audited revenue total) together, because gross invoice amounts include sales tax and don't tie to real Income — a real gap, confirmed directly (one invoice: $1,005.99 gross vs. $931.68 Income). That required a tax-correction ratio and a proportional monthly-weighting estimate to reconcile the two.

Matt's actual refresh cadence turned out to be a single QuickBooks report — **Sales by Customer Detail**, run for **All Dates** — scheduled to email him automatically (originally every Monday at 8:00 AM CST; **switched to daily 2026-09-09**, his own choice — see "Automated daily refresh" below); he moves the attachment into a Google Drive folder (`_Rolling Financials`) himself and archives the previous file. Reading a real copy of that file directly (2026-08-28) showed it's **line-item level** (one row per product line on an invoice or credit memo, not one row per invoice) and that its `Amount` column already ties to real Income-account postings — sales tax never posts as its own Income-type line in this report, so there's no gross-vs-Income gap to correct for. Validated against the old two-file pipeline's output: summing `Amount` for Darrow Electric matched to the penny ($2,811.25 both ways), and the whole-book total matched within 0.5% (the small remainder traced to genuinely newer transactions in the fresher file, not a parsing difference). That meant the entire tax-ratio/proportional-weighting mechanism could be **removed**, not just adapted — monthly figures are now exact dated sums.

1. Matt's QuickBooks report **Sales by Customer Detail, All Dates** emails to him automatically (daily, as of 2026-09-09); he moves it into `_Rolling Financials\Sales by Customer Detail.xlsx` and archives the previous file — the one manual step left in this half of the pipeline.
2. The Sage active-client export (`_Active Client List with Notes\ClientRpt.xlsx`) still gets converted to CSV via **Excel COM automation** in PowerShell, same as always — there is no working Python in this environment (`python`/`python3` only resolve to non-functional Windows Store stub aliases).
3. `Phase 5 Market Intelligence - Plan\build_plan_data.ps1` reads the Sales by Customer Detail `.xlsx` **directly via Excel COM** (bulk `Value2` array read, not a CSV round-trip — sidesteps the embedded-newline class of bug below entirely, since the report's free-text `Description` column could carry the same hazard). Keeps only rows where `Transaction type` is Invoice or Credit Memo and `Account type` is Income or Other Income; line items sharing the same (customer, invoice/credit-memo number) get summed into one entry — that's the level order counts, dedup, and the invoices export all operate at.
4. Joins to the Sage client export by exact company-name match.
5. Computes company-family groups (`familyKey`) via a conservative rule: name A "roots" name B only when B starts with A followed by a non-alphanumeric boundary character (space/hyphen/&/comma) — e.g. "Jack Henry" roots "Jack Henry-Golf". Deliberately does **not** group things like "Kubota of Joplin"/"Kubota of Harrison" (neither is a prefix of the other) — under-grouping is the safe failure mode for financial data, over-grouping is not.
6. **Excludes every invoice dated before 2025-04-01** (`$OWNERSHIP_CUTOFF` in the script) — current ownership took over ~summer 2025, and pre-cutoff revenue belongs to the previous owner, not meaningful to report on (Matt, 2026-08-28). This is a real data-layer exclusion, not a UI filter: `totalIncome`, `orderCount`, and every `monthly` entry only ever reflect post-cutoff invoices/credit memos. `lastInvoiceDate` deliberately stays lifetime — still useful to know when a client last showed up at all, even if their current-ownership revenue is $0. **If a data refresh looks like it "lost" 2024 revenue, this is why, not a bug.**
7. Also outputs `plan_invoices.json` (raw invoice/credit-memo-level records — company/num/date/amount, post-cutoff only) → copied to `site/plan/invoices.json`. A useful raw artifact (e.g. a future per-invoice drill-down), though the browser Update Data panel below no longer needs it for dedup — every upload is a full rebuild now, not an incremental merge.
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

**Computed alongside the main customer/invoice aggregation, not a separate read.** `build_plan_data.ps1`'s single pass over Sales by Customer Detail (Section 1) also classifies each line item into a bucket and captures it into `$productRows` when it matches; a second pass over just that (much smaller) list, once the file's true max date is known, resolves the monthly trend and the leaders/losers trailing-90-day windows — the windows can't be resolved until the whole file has been scanned once, so this genuinely needs two passes, but only the second one is over already-filtered data. Output lands in `data.json`'s new top-level `productMix` key (schema below) — same file, same generation, so this section is automatically current every time the pipeline runs, whether that's the automated daily refresh or a manual Update Data upload. The identical logic is ported into the browser panel too (`parseSalesDetailRows`/`computeProductMix` in `index.html`) and cross-validated against the PowerShell output on a real file — they agree to the penny, including which product tops each leaders/losers list.

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

`build_plan_data.ps1` now reads it (`_scratch\productlist.xlsx`, same stable-scratch convention as `clientrpt_sheet1.csv` — a periodically-refreshed reference file, not part of the sales-data refresh cadence) and joins it in for the `desc` field in `leadersLosers`, falling back to the transaction-line Description for any SKU not found in the catalog. Revenue figures are completely unaffected — this only changes which text labels a product.

**Known gap, not yet closed**: this join only happens in the PowerShell pipeline (the automated daily-refresh path and any full manual rebuild). The browser Update Data panel's `computeProductMix` still falls back to transaction-line Description only, since it doesn't have access to the item catalog — accepted for now since the browser panel is the manual fallback, not the routine path, and product-name quality (unlike a dollar figure) isn't a correctness issue, just a display nicety. A clean fix would ship a small `productnames.json` site asset alongside `data.json` (regenerated by the same pipeline run) for the browser panel to lazy-fetch — not built yet.

A draft manual naming key (`Phase 5 Market Intelligence - Plan\product_naming_key_DRAFT.csv`, top 150 products by revenue) was built as a first pass before Matt supplied the real catalog — now superseded by the catalog join for anything already in QuickBooks, but still useful as a place to override a name the catalog itself has wrong or unclear, if that ever comes up. Not currently joined into the pipeline.

## Monthly Specials Tracking (promoted to a live Plan section 2026-09-01, relocated to the Campaign tab 2026-09-11)

Matt provided the specials he ran each month, Jan–Aug 2026 (one line per month, informal text — e.g. "June - 112PM Heather Grey/Flag Hats") plus QuickBooks' own **Product/Service List** export (`Embassy_Product_Service List.xlsx`, saved to `_scratch\productlist.xlsx` — same file the Softgoods/Hardgoods naming join uses above), and asked whether the specials showed a measurable lift in the sales data. It started as a one-time analysis — a published Artifact one-pager plus a matching one-page landscape PDF, both scoped to the fixed Jan–Aug 2026 window — then, same day, Matt asked to "add a tab in Plan for Monthly Specials Tracking," promoting it into a real, permanent section following the same pattern Softgoods/Hardgoods set.

### Live section: how new specials get in

Specials aren't derivable from the sales data itself — nothing marks a transaction as "part of a special." What ran each month lives in **`Phase 5 Market Intelligence - Plan\specials_registry.json`** (kept alongside `build_plan_data.ps1`, not in `_scratch` — it's an authored definitions file, not a periodic export, same category as the naming-key draft). Scoped this way deliberately, not as an in-page form: Matt chose "tell Claude Code each month" over building a browser form, since a form still can't save itself on GitHub Pages (same limitation as the Update Data panel — download files, hand back for a commit) and this way there's genuinely nothing new to maintain beyond what already happens every week.

**Registry entry shape:**
```json
{ "month": "2026-06", "label": "112PM Heather Grey/Flag", "skus": ["HATS_112PM"], "note": "" }
```
`skus` can list more than one code (e.g. a special spanning two SKUs); an empty `skus` array marks an unresolved entry — the tab still lists it, with `note` explaining why (see March's umbrella below), so a gap stays visible rather than silently missing.

**To add next month's special**: tell Claude Code what ran and which product it was. It resolves the plain description to a real SKU via the product catalog (same lookup Softgoods/Hardgoods' naming join uses) and appends an entry — the tab picks it up on the next routine pipeline run, no separate step.

### Computation (`build_plan_data.ps1`, Section 6 — after Product Mix)

Built on the same `$productRows` single pass Product Mix already captures (no second file read): a per-SKU monthly total (`$skuMonthly`) is built from it, then for every registry entry:
- **Baseline** = the average of the *other* months in the **same calendar year** as the special (excluding the special's own month and the month after — same baseline for both columns, so they stay a fair comparison, same rule the original one-off analysis used).
- **Year-scoped, not all-of-history-scoped, on purpose**: averaging across the full ~17 months of post-cutoff history was tried first and rejected — for a low-volume/seasonal product, a long tail of unrelated zero months drags the baseline toward zero and inflates every multiple (found by comparing against the original analysis's hand-validated numbers: the rain pullover's real 0.30x/32.88x came back as an inflated 0.75x/82.2x with a full-history baseline). Year-scoping reproduces the original PDF's numbers exactly for the Jan–Aug 2026 specials and extends the same "typical month this year" logic forward without a hardcoded window.
- **Explicit "not in yet" state**: if the special's own month or the month after isn't in the data yet (e.g. Matt reports a special the same week it ran, before the next data refresh), that column shows "Not in yet" rather than treating it as a real $0 — a genuinely different case from "checked and found nothing."
- **Auto-generated verdict tag** (no hand-writing needed for a new entry): thresholds set against the original analysis's own hand-labeled rows — 2.0x+ in both columns is "Lift both months," 2.0x+ in only one is "Same-month lift only" / "Delayed lift," under 2.0x in both is "No clear lift" (112 Hat's 1.73x/1.63x — real but "not really a spike" in the original human read — deliberately lands here, not in "lift").

Output lands in `data.json`'s new top-level `specialsTracking` array — one object per registry entry:
```json
{
  "month": "2026-06", "monthAfter": "2026-07", "label": "112PM Heather Grey/Flag",
  "skus": ["HATS_112PM"], "note": "", "unresolved": false,
  "specialVal": 8818.68, "afterVal": 395.28, "baseline": 410.76,
  "specialKnown": true, "afterKnown": true,
  "thisMult": 21.47, "thisIncr": 8407.92, "nextMult": 0.96, "nextIncr": -15.48,
  "tag": "Same-month lift only"
}
```
`thisMult`/`nextMult` are `null` when `baseline` is 0 (a genuinely new product — no prior sales to compare against) or when `specialKnown`/`afterKnown` is `false` (that month isn't in the data yet). The browser Update Data panel's fallback path doesn't recompute this from the freshly uploaded file — it carries forward whatever was already loaded, same accepted-gap category as that panel's product-naming fallback (see above): the panel is the manual fallback, not the routine path, and specials can't be re-derived from a sales file regardless.

**Display**: a table — Month, Special (+ SKU + auto-tag), This Month, Month After — with the same "multiple + incremental $, or raw $ + 'no baseline' caption, or a bare '—' only for genuinely $0" badge logic the original one-off analysis validated (see the Display fix note below).

**Resolving specials to real SKUs**: each special's plain-text description was matched against the item catalog, disambiguating ambiguous ones (visor, tumblers) by checking which candidate product(s) actually had real sales activity in that specific month — empirical, not guessed from the catalog text alone. March's umbrella special stayed genuinely unresolved: three different one-time March orders (Patriot Folding, Ridgeline 46" Arc, Compact Econo Folding, $355–$480 each) are all equally plausible and there's no way to pick one from the data alone.

**Method**: for each resolved special, baseline = the average of the other 6 months in the Jan–Aug 2026 window (excluding the special's own month and the month after, zero-inclusive — same baseline used for both columns so they're a fair comparison). Two separate multiples are always shown per row — **this month** and **month after** — each computed against that same baseline, rather than one "best of" number, so a delayed effect is visible directly instead of hidden inside a single figure. Both the multiple and the incremental dollar amount are shown together, since a large multiple off a near-zero baseline (e.g. the rain pullover's 32.9x) can look more dramatic than its real dollar impact ($3.3K).

**A real methodology bug was caught and fixed the same day**, prompted by Matt asking directly "is the verdict taking into account the month after?": the first version wasn't consistently checking the month-after for every row, and the baseline-averaging itself silently differed row to row (some excluded zero-revenue months from the average, some didn't). One special (PC43 in July) had never been checked for a lag effect at all and was reported as a plain decline — properly checked, it recovers to a real 2.09x lift in August. Fixed with one consistent rule applied identically to every row.

**Headline finding**: 5 of the 9 special components show little or no lift in their own month, then a real spike the month after (e.g. the rain pullover: $31 in March, $3,431 in April) — a likely production/decoration lead-time effect between order and invoice. Best same-month performer: June's 112PM hat (21.5x, +$8,408). Two of Matt's own unprompted "didn't go great" calls (May's visor, August's tumblers) were independently confirmed by the data.

**Display fix**: two rows (April's polo, May's visor) initially showed a bare "—" in whichever column had no baseline to divide by. Checked directly against the full sales history (**back to March 2024**, not just the Jan–Aug 2026 analysis window): both products have **zero sales anywhere in the entire dataset** before their one special month — genuinely new items, not just quiet ones (the one near-exception: MM1005, one of the two April-polo SKUs, has a single $29.12 sale on 2025-12-22, outside the analysis window and immaterial to the result). A bare "—" read as "no data," which was misleading — real revenue existed, there was just nothing to compute a ratio against. Fixed to show the raw dollar figure with a "no baseline" caption in that case, reserving "—" for genuinely $0 months.

**Original one-off delivery** (kept as a point-in-time snapshot, not updated further now that the live tab exists): a published Artifact (`https://claude.ai/code/artifact/085e6395-3728-4dd6-aa97-427cb8266248`) and a one-page landscape PDF, generated via headless Edge print-to-pdf against a local static file server — see TECHNICAL.md's "One-off PDF reports" section for the reusable pattern (no working Python in this environment). Its Jan–Aug 2026 figures match the live tab's exactly (same year-scoped baseline method) — the live tab is the one that keeps moving as new months and specials are added.

**Lesson for any future analysis in this suite**: when a methodology involves "check both X and Y," verify it was actually applied to every row before presenting results — not just the rows where checking Y happened to surface a finding. A second lesson from the display fix: a bare "—" is ambiguous between "no data" and "data exists but nothing to compare it to" — always distinguish those two cases explicitly in any ratio-based display.

## Monthly figures: SKU deep-dive and one-pager export (added 2026-09-09)

Matt was looking at the Monthly figures table's September row — company breakdowns for this month vs. the same month last year, already live — and asked for two more things, explicitly to (1) adjust tactics, (2) reach customers who bought the same month last year but haven't this year, (3) find what's not working: an exportable one-pager, and "top 5 skus for the month for each calendar year." Both are now built directly into the expand-row detail, not a separate report.

**Data**: `build_plan_data.ps1`'s new `skuMonthly` section (right after Product Mix's leaders/losers, reusing the same `$productRows` — no second file read) computes **every SKU with real revenue, for every month**, not capped to a top-N. A capped list was tried first and rejected: it can't answer "what did last year's #3 seller do this year" once that SKU has fallen out of the current month's visible ranks — exactly the case that matters for a decline table. Uncapped costs data.json ~500KB (773KB vs. 290KB capped at top 15, checked directly) — acceptable for a business dashboard on a normal connection. Same `hasProduct`-only, Shipping/Other-income/Discounts/Embroidery-excluded rule as Product Mix and Monthly Specials Tracking.

**A real bug found while building this**: Monthly Specials Tracking (built earlier the same week) already used the variable name `$skuMonthly` internally for a completely different shape (`{sku: {month: total}}`, its own baseline computation) — since PowerShell script-level scope is flat, that section ran *after* mine and silently overwrote the new `{month: [sellers]}` structure before it ever reached `data.json`. Caught by inspecting the raw JSON directly rather than trusting the in-memory object (the bug was invisible from PowerShell's own variable inspection, since `$skuMonthly.Count` looked right the whole time — only the actual serialized keys gave it away). Fixed by renaming the Specials Tracking one to `$specialsSkuMonthly`. **General lesson**: a long procedural script with no functions/modules will eventually pick the same obvious variable name twice — when adding a new top-level computed field, grep the whole file for the exact name first, and verify by reading the actual serialized output, not just the in-memory value right after computing it.

**UI** (`site/plan/index.html`): expanding a month now shows, below the existing company lists — top-5 sellers this month vs. top-5 sellers the same month last year (`topSkusForMonth`), and a win-back section (`winBackForMonth`): real companies with revenue in the prior-year month and none this month, ranked by what they spent, capped at 12 shown with a "+N more" note (same `MONTH_DETAIL_LIMIT` convention as the company lists). Client-side, not filter-scoped beyond whatever Industry/Rep filter is already active.

**Export**: an "Export one-pager" button per expanded month builds the same report (KPI strip, decline table, top-sellers table, win-back list) as a self-contained HTML string (`buildMonthReportHtml`) and opens it in a new tab via a Blob URL — styled for `@page{size:letter landscape}` print, with a visible "Print / Save as PDF" button plus an auto-triggered `window.print()` on load. This is a genuine self-service export: no server round-trip, no re-asking Claude Code for a file each month, works for any month as soon as it has data. **A real gotcha hit while building this**: the generated report string contained a literal `</script>` (inside a small inline script that auto-triggers print) — since HTML parsing happens before JS parsing, the *browser's HTML parser* closed the outer `<script>` tag the instant it saw that substring anywhere in the page source, even embedded inside a JS string, truncating the entire rest of the file and throwing `SyntaxError: Invalid or unexpected token` on page load. Fixed with the standard split-string trick (`"<scr" + "ipt>...` / `"</scr" + "ipt>"`) so the literal contiguous text never appears in the HTML source. **Apply this to any future case where JS needs to emit a `<script>` tag as a string** — it's not specific to this feature.

**Browser Update Data panel**: unlike `specialsTracking` (needs the external registry file, so it's carried forward stale), `skuMonthly` is fully derivable from `productRows` alone — `computeSkuMonthly()` recomputes it for real on every upload, not just carried forward. One accepted gap: no item-catalog access in the browser, so names fall back to the transaction-line Description instead of the clean QuickBooks catalog name, same as Product Mix's leaders/losers already has.

## Monthly/Weekly/Daily toggle: chart + Pareto table, expand modal, trend line (added 2026-09-10)

Matt asked to add "a day by day pareto along with the month to month... same concept just daily view," first built as a toggle inside the collapsed Monthly figures table panel. He then clarified: "I really just wanted the image above updated to a daily toggle... need the chart more than the table" — the toggle needed to live on the always-visible **Month-to-Month Revenue chart**. Same session, he asked for three more things once he saw the daily bars: an expand button on the chart, "it's a bit wild maybe a regression line," and "a weekly tab, same requirements as the daily one just rolled weekly." All four (toggle relocation, expand, trend line, weekly) shipped together.

**Toggle** (`#chartGranularityToggle`, in the chart's own header, same chip-row pattern as the CRM table's Group: Industry/Company toggle): **Monthly / Weekly / Daily**, one toggle driving both the chart and the Monthly figures table together via `state.revenueGranularity` — the two views can never disagree about which mode is showing.

**Two different reads of the same period-level data, on purpose**:
- **The chart** (`renderPeriodChart`, called through `renderChartByGranularity`) stays **chronological** — one bar per day or week, in date order, same visual language as the existing monthly bar chart. Shows the *shape* over time — spikes, lulls, trend.
- **The table** (`renderPeriodPareto`, in the collapsible "Daily/Weekly figures — Pareto (table view)" panel) stays **ranked by revenue descending** with % of Total / Cumulative % — the actual Pareto concept Matt named, showing revenue *concentration*. "Same concept" = the Client Sales table's existing Cumulative Total pattern, applied to periods instead of companies.

Daily/weekly bars and rows both drop the monthly chart's YoY reference tick and month-over-month labels — a single day (or week) compared to the same period last year, or the one before, is too noisy to be a useful read (a $50 Tuesday after a $1 Monday is a meaningless "+4900%"). The classic Pareto *chart* shape (bars + a plotted cumulative-% line on a second axis) was deliberately not built either way — a second y-axis is the #1 dataviz anti-pattern in this suite's own skill guidance, and the existing CRM Pareto view is already a plain table, not a chart.

**Weekly bucketing**: Monday-start business weeks, keyed by that Monday's date (`weekStartKey()`). A week overlapping the filtered range's edge only sums the days that actually fall inside the range (each invoice date is filtered to the range *before* bucketing into a week), so nothing outside the selected months leaks in.

**Shared computation, generalized from the original daily-only version**: `data.json`'s `clients[].monthly` is only month-granularity, so day/week revenue needs real per-invoice dates — from `invoices.json`, **not** fetched on a normal page load (lazy raw artifact, cached once via `loadInvoicesOnce()`). `getPeriodRows(months, filtered, period)` is the one shared fetch-and-aggregate helper (`period` is `"daily"` or `"weekly"`) used by the chart, the Pareto table, and `exportPeriodCsv` — returned in ascending order; the Pareto table and CSV export re-sort it descending by amount, the chart uses the ascending order directly.

**Trend line**: a simple least-squares linear regression (`linearRegression()` over bucket index → value) drawn as a dashed line (`trendLineSvg()`) on every granularity, monthly included — same y-axis/scale as the bars themselves (not a second axis, so this is a legitimate same-scale overlay, unlike a real Pareto chart's cumulative-% line). Requested after Matt saw the daily bars and called them "a bit wild."

**Expand button**: a corner icon on the chart card (`#chartExpandBtn`) opens a full-viewport modal (`#chartModal`) containing a larger version of the exact same chart (`viewBox="0 0 1000 420"` vs. the inline chart's `220`, `60vh` rendered height). `renderChartByGranularity(months, filtered, "expanded")` — the same function used for the inline chart — takes a `target` parameter that swaps which SVG/tooltip/title/legend elements it writes into, so the compact and expanded charts are never two implementations to keep in sync, just two render targets for the same code. Closes on the × button, a backdrop click, or Escape.

**Verified, not just built**: the weekly Pareto total reconciles exactly with the "Revenue in Range" KPI tile (36 weeks, cumulative reaching 100% at the same dollar figure as the KPI) — same reconciliation check already done for daily. Toggling back to Monthly restores the original chart/table/legend/title exactly; the expanded modal renders the currently-selected granularity correctly and stays in sync if the user switches granularity while it's open.

**Scope kept deliberately narrow**: no per-day/per-week expand/drill-down (companies, SKUs, win-back) on either the chart or the table.

## Known, fixed-at-the-root gotcha: `Get-Content | ConvertFrom-Csv` breaks on embedded newlines

`Get-Content` splits a file into lines on every raw newline **before** any CSV-quote-awareness applies — including a newline sitting inside a quoted field. Sage's `GeneralNotes`/`ContactNotes` fields sometimes have these, and QuickBooks' own multi-line memos used to trigger it too before the Sales by Customer Detail rewrite moved that read off CSV entirely (see below). Still relevant for the remaining CSV read (ClientRpt): `Read-CsvSkippingHeaderLines` in `build_plan_data.ps1` reads the file with `-Raw` (one string, real newlines intact), splits off just the header lines by count (safe — those never contain embedded newlines), and feeds the rest through `ConvertFrom-Csv` as one unbroken string so its own quote-aware parser handles the rest. **Apply this pattern to any future CSV parsing in this suite** — the bug is in the `Get-Content | ConvertFrom-Csv` combination itself, not specific to one file.

## Update Data panel (upload a fresh export from the browser)

**Rebuilt 2026-08-28** alongside the pipeline change above — one file input now, no mode toggle. Collapsible panel, default closed. Upload the same **Sales by Customer Detail (All Dates)** export QuickBooks emails Matt on its own schedule, parsed entirely client-side via SheetJS (lazy-loaded from cdnjs, only when the panel is opened) — a JS port of the same logic as `build_plan_data.ps1` (same account-type/transaction-type filtering, same ownership cutoff, same family-rollup algorithm), validated against a real file to match the PowerShell pipeline's own output almost exactly (5,704 invoice/credit-memo records in the browser vs. 5,703 from PowerShell — a one-row rounding-boundary difference, not a real discrepancy).

Since the report is always "All Dates," every upload is a **full rebuild**, not an incremental merge — there's no Overwrite/Append choice to make anymore. Sage-derived fields (industry, acctRep, etc.) for companies already known are carried forward from the currently-loaded `data.json` (this flow doesn't re-upload a fresh Sage export); a genuinely new company gets `matched: false`, same as the existing unmatched-customer pattern.

**This doesn't write anywhere by itself** — GitHub Pages has no backend. Processing produces a preview and two downloadable files (`data.json`, `invoices.json`) that still need to come back for a final commit, same handoff as every other data refresh in this suite. A fully-automatic version (committing straight to GitHub from the browser) was considered and explicitly not built — it would require storing a GitHub write-credential somewhere the page can use it, the same category of tradeoff as the paused Firebase/Supabase decision. See `BACKLOG.md`'s consolidated API section.

**Confirmed and explicitly paused, not just unbuilt (2026-09-10)**: after the live-render fix above made the preview clearly work, Matt named the actual unresolved requirement directly — "if i upload data i want it to publish and go live," not a preview that still needs a manual send-back or the automated path to actually reach the site. Asked him directly whether he wanted the existing automated daily-refresh made faster/more responsive, or a real server-side publish endpoint (the only way to let the browser button itself publish without embedding a write-capable credential in a public page). **His answer: pause entirely, keep using the automated daily refresh (or ask Claude Code directly for an instant publish) until this gets built "in a more durable way."** Logged in `BACKLOG.md`'s Plan section and cross-referenced from the consolidated API section — not started.

**This panel is now the fallback path, not the primary one** — see "Automated daily refresh" below for what actually runs the routine update.

**Real bug found and fixed 2026-09-09, not just a UX gap**: `runRebuild()` computed the full new dataset (for the download buttons) but never applied it to the page's own `DATA` object or re-rendered anything — the KPI tiles, chart, and CRM table kept showing the *old* numbers even right after a successful process, only the small summary checklist reflected the new file. Matt processed a real file and reported "even when data is loaded it doesn't refresh or update," with screenshots showing the summary card correct but the chart stale beneath it. Fixed: `runRebuild()` now sets `DATA = out` and re-runs `renderUnmatchedNote()`/`renderProductMix()`/`renderSpecialsTracking()`/`renderAll()`, so the whole page reflects the uploaded file immediately. Paired with a fixed bottom banner (`showPreviewBanner()`, same visual pattern as the existing "newer version available" banner) making clear this is a **local, unpublished preview** — nothing is live for anyone else until the downloaded files come back for a real deploy — with a "Discard preview" button that reloads the real live data.

**A real UX gap, found and fixed 2026-09-09**: the panel's own copy never actually said any of this — it just walked through "upload → download a JSON → send it back," reading like the only option. Matt found the panel, used it as expected, and asked directly why he had to download files manually instead of the site just updating. Fixed with an in-panel callout above the file picker (`.data-note` styling, same warm-tint treatment as the unmatched-customers note) pointing to the automated path first, explaining this one is a fallback, and only then walking through why it can't publish on its own. **General lesson**: a feature being *documented* as a fallback in `PLAN.md`/memory doesn't mean the person using the actual page knows that — the page itself has to say so, especially for a panel that's still the most prominent, easiest-to-find "update the data" affordance on the page.

## Automated daily refresh (added 2026-09-01 as weekly, renamed 2026-09-09)

Matt's real ask, once he saw the manual panel in action: "select a file, upload, and the financials refresh" — no browser step, no downloading two files and handing them back. Since the download-and-commit handoff exists only because a public page can't safely hold a GitHub write-credential, the fix is to have **Claude Code do the publishing itself**, using its own already-granted git access — not a credential embedded in the page.

**Renamed from "weekly" to "daily" 2026-09-09**: the *check* itself was always daily (the scheduled task ran once a day from the start) — what changed is the *source data's* cadence. Matt moved QuickBooks' own "Sales by Customer Detail" export from weekly (Mondays) to daily, so a fresh file can now show up in `_Rolling Financials` any day, not just once a week. Renamed the script (`weekly_refresh.ps1` → `daily_refresh.ps1`), the scheduled task (`plan-weekly-refresh` → `plan-daily-refresh`, same 9:00 AM cron, task recreated rather than just relabeled since taskIds aren't renameable), and every "week"/"Monday"-worded reference in both. No logic changed — the file-detection/safety-check/deploy mechanism already worked at any cadence; only the labeling was wrong once the underlying habit shifted.

- **What runs**: `Phase 5 Market Intelligence - Plan\daily_refresh.ps1`, on a **daily scheduled check** (Claude Code scheduled task `plan-daily-refresh`, 9:00 AM local). It finds the newest "Sales by Customer Detail" file directly in `_Rolling Financials` (filename isn't perfectly consistent day to day — matches on the report name and takes whichever is newest, not an exact filename), compares it against a marker file (`.last_processed_sales_detail.json`) recording the last file it processed, and does nothing if unchanged.
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

## Campaign tab: Sage mailer-campaign analytics (added 2026-09-11)

**Source data**: `_SAGE Monthly Special Campaigns\*.xls`, one file per mailer campaign Sage has sent, Matt exports these himself from Sage. Investigated directly (Excel COM, since these are legacy `.xls` — reads transparently like any other format Excel COM already handles in this suite): one row per recipient (~1,050/campaign, the whole active list every time), columns `Email Address, First Name, Last Name, Company, Acct Rep, [5 unused Custom Fields], CRMContact, Sent, SentTimestamp, Delivered, DeliveredTimestamp, Opened, OpenedTimestamp, Clicked, ClickedTimestamp, ClickedDetail, Bounced, Unsubscribed`. **No metadata rows in the file itself** — campaign date and name only exist in the filename (`"M.D.YYYY Campaign Name.xls"`, e.g. `4.10.2026 Spring Polo Sale.xls`; one date can have two files — `8.5.2026 August Tumbler Special 1.xls` / `8.5.2026 Take 2 - August Tumbler Special 2.xls` — so campaign identity is `date|name`, not date alone).

**`ClickedDetail` is the standout field** — not just a click flag, it names the *exact product(s)* each recipient clicked (`"Product - Camo Premium Modern Trucker; Product - RICHARDSON Printed Five-Panel Trucker Cap"`), real per-contact, per-product interest. It also mixes in non-product links (`website.html`, `facebook.html`) — a real bug caught while building this: filtering by *excluding known non-product strings* let `facebook.html` show up as the #1 "product" with 73 clicks. Fixed by inverting the logic — only count entries that actually carry the `"Product - "` prefix, discard everything else, rather than blacklisting specific strings that could grow every time a new link type shows up in a future campaign.

**Real cross-validation found while mapping this out**: both August Tumbler sends got zero clicks — independently matches what Monthly Specials Tracking already found for that same special (weak revenue, "too little data to call"). Two different data sources agreeing isn't a coincidence to wave off.

**Pipeline** (`Phase 5 Market Intelligence - Plan\build_campaign_data.ps1`, same Excel-COM pattern as `build_plan_data.ps1`): reads **every** `.xls` in the folder fresh on each run — no marker-file/skip-unchanged like the financial pipeline. That's deliberate, not an inconsistency: a campaign's open/click numbers keep changing for days after a send if Matt re-exports an updated snapshot under the same filename, so "unchanged since last run" isn't a safe signal to skip on here. Parses date+name from each filename (`^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(.+)$`).

Writes `site/plan/campaigns.json` (separate file from `data.json`, same reasoning as `invoices.json` — keeps the main payload independent, this is fetched lazily only when the Campaign tab is first opened, not on a normal page load):
```json
{
  "generatedAt": "2026-09-11 09:09",
  "campaigns": [
    { "date": "2026-09-01", "name": "September Special - Camo & Quarter-Zips", "fileName": "9.1.2026 ....xls",
      "recipients": 1048, "sent": 1048, "delivered": 956, "opened": 278, "clicked": 47, "bounced": 92, "unsubscribed": 0,
      "openRate": 29.1, "clickRate": 4.9 }
  ],
  "productClicks": [
    { "product": "Camo Premium Modern Trucker", "clicks": 44, "campaignCount": 1 }
  ],
  "campaignDetail": {
    "2026-09-01|September Special - Camo & Quarter-Zips": [
      { "email": "...", "company": "4 State Fence Company", "acctRep": "Kevin Greim", "opened": true, "clicked": true, "clickedProducts": ["Camo Premium Modern Trucker", "RICHARDSON Printed Five-Panel Trucker Cap"] }
    ]
  }
}
```
`campaignDetail` only keeps recipients who **opened or clicked** — not the full ~1,050/campaign, since a "delivered, nothing else" row isn't useful to browse and the summary counts already cover it. Keyed by the same `date|name` compound key as campaign identity, since two sends can share a date.

**Refresh**: `campaign_refresh.ps1` (wrapper, mirrors `daily_refresh.ps1`'s git branch → commit → merge → push flow) runs `build_campaign_data.ps1`, diffs `campaigns.json` against what's live, commits+pushes if changed. **No block-and-notify safety check** like the financial refresh has — this data isn't financial-stakes, a bad read just shows odd numbers on the tab rather than risking a wrong dollar figure going live. Scheduled task `plan-campaign-refresh`, daily check (same cadence choice Matt made for the financial refresh).

**UI**: KPI strip (Campaigns Tracked, Avg Open Rate, Avg Click Rate, Best Open Rate) → campaign table (Date/Campaign/Delivered/Opened/Clicked/Bounced/Unsubscribed, most-recent-first, click a row to expand) → expand-row detail (who clicked what, who opened without clicking — reuses the Monthly figures table's expand-row visual pattern from the Financial tab) → a product-interest leaderboard aggregated across every campaign.

**Explicitly not built yet, flagged as real fast-follows, not silently skipped**:
- Cross-referencing campaign contacts against Plan's client revenue to build a "clicked but hasn't ordered it" list — Sage's `Company` field on these rows isn't guaranteed to name-match Plan's QuickBooks-sourced client names, the same fuzzy-match problem already documented elsewhere in this suite (see the Rollup aggregation / Known limitation sections above), and needs its own real investigation rather than a guessed join.
- Any direct hand-off of an engaged-contact list into Promote's campaign builder.

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
