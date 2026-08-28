# Technical Information / Architecture / Troubleshooting

**Last updated:** 2026-08-27

Part of the Embassy Market Intelligence Suite (see `README.md`). Cross-cutting technical reference — deploy mechanics, known gotchas, and things that will burn real time if you don't know them going in.

## Tech stack overview (read this first if you're new to the codebase)

**Focus is the one module that's real Python** — `market_intelligence_engine.py`, compiled to a Windows `.exe` via PyInstaller. Pulls data with pandas, builds the map with Folium (a Python library that *generates* a JavaScript/Leaflet map as its output). Editing Focus's logic means editing Python. See `FOCUS.md`.

**Everything else — Inspire, Plan, Promote, the landing page — is not Python at all.** Each is a single `.html` file containing three things stacked together, the standard way any website is built, no framework (no React, no build tool), no compiling:

- **HTML** — the skeleton: what buttons, tables, and boxes exist on the page.
- **CSS**, in a `<style>` block near the top of the file — the visual styling (the navy/blue palette, spacing, fonts). Change how something *looks*, this is what you touch.
- **JavaScript**, in `<script>` block(s) — the actual logic. Not a thin wireframe — this is real working code: Inspire's recommendation engine, Plan's revenue rollup math and Pareto calculations, Promote's PDF rendering and hand-built MIME email construction. All of it runs live in the browser when the page loads; nothing is hidden server-side, because there is no server.

Save the file, refresh the browser, see the change — that's the entire edit/test loop for these four.

**The "lookups" are real and kept separate on purpose.** Things like Inspire's option lists, Plan/Promote's client data, or Promote's sender list live in their own small `.json` files, fetched by the JavaScript at page load. This split is deliberate: a business change (add a decoration method, change a sender's email) becomes a data edit, not a code edit.

**PowerShell is backstage tooling, not part of the live app.** It's what pulls numbers *out* of Excel/Sage/QuickBooks exports and turns them into the `.json` files Plan and Promote read (see "Data export pipeline," below). Only touched when refreshing data from a new export, never when using the app itself.

**If you want to change something yourself, concretely:**

| You want to change... | You'd edit... |
|---|---|
| How something looks (colors, layout) | CSS, in the `<style>` block of that module's `index.html` |
| What options/values exist (a sender, a decoration method) | The relevant `.json` data file — no code |
| How something behaves (the logic itself) | JavaScript, in the `<script>` block of that `index.html` |
| Focus's map generation itself | Python, `market_intelligence_engine.py` |
| How Sage/QuickBooks data gets pulled in | PowerShell, `build_plan_data.ps1` / `build_promote_data.ps1` |

All plain text, editable in anything from Notepad to VS Code — no build step for anything but Focus.

## Deploy pipeline

- **Repo**: `https://github.com/j3yarbr/embassy-market-intelligence-plan`, local clone at `C:\EmbassyMapDeploy\embassy-market-intelligence-plan` (short path deliberately — the default deep temp/scratchpad paths hit "Filename too long" errors with git on Windows).
- **Workflow**: `.github/workflows/pages.yml`, triggers on any push to `main`. No build step — it just uploads whatever's in `site/` to GitHub Pages via `actions/upload-pages-artifact` + `actions/deploy-pages`. Also writes `site/version.json` (commit SHA + UTC timestamp) right before the upload step, which powers the auto-update banner (below).
- **Branch workflow**: short-lived feature branches for active work, merged to `main` via `--no-ff` once verified locally, branch deleted. Don't use permanent per-module branches — GitHub Pages only ever serves one branch, and the whole point of the Suite Landing Page is that every module needs to be live simultaneously.
- **Git identity** is configured globally on this machine (Matt Yarbrough / matt@embassygear.com) and Git Credential Manager already caches a GitHub credential — pushes work with no interactive prompt.

## Site structure

```
site/
  index.html          ← Suite Landing Page (hub)
  favicon.png          ← Embassy compass mark, cropped from the full logo, 512x512
  favicon.ico           ← same mark wrapped in an ICO container (added 2026-08-27, see below)
  manifest.json          ← web manifest for the landing page's own icon/shortcut behavior
  version.json            ← gitignored, regenerated fresh by the workflow on every deploy
  focus/                   ← Folium-generated index.html, data.json, cluster_callback.js, manifest.json
  inspire/                  ← hand-written index.html, data.json, manifest.json
  plan/                      ← index.html, data.json, manifest.json (see PLAN.md for the data pipeline)
  promote/                    ← index.html, data.json, senders.json, manifest.json (see PROMOTE.md)
```

Every module folder has its own `manifest.json` (name/short_name/icons, pointing back at the shared `../favicon.png`) — needed per-page, not shared, since each is really its own app-like page in the suite.

A `site/core/` folder (shared nav/branding/CSS) is reserved for once it's clearly worth extracting common code across 5 modules of mostly-duplicated header/palette/banner boilerplate — not done yet, flagged in `BACKLOG.md`.

## Real favicon.ico / apple-touch-icon / manifest.json (added 2026-08-27)

A plain `<link rel="icon" type="image/png">` is enough for a browser tab, but **not** enough for a Windows desktop shortcut or an iPad home-screen icon — both fell back to a generic letter avatar until this was added. Every page now ships four lines in `<head>`:

```html
<link rel="icon" type="image/png" href="../favicon.png">
<link rel="shortcut icon" type="image/x-icon" href="../favicon.ico">
<link rel="apple-touch-icon" href="../favicon.png">
<link rel="manifest" href="./manifest.json">
<meta name="theme-color" content="#152840">
```

`favicon.ico` was built by wrapping the existing 512x512 PNG in a minimal ICO container (a valid, widely-supported technique — modern Windows/browsers accept a single embedded PNG marked at the "256" size slot even though the real image is larger). No image-editing tool needed; built directly via a `System.IO.BinaryWriter` in PowerShell, not ImageMagick or similar (none installed on this machine).

**Existing shortcuts/home-screen icons made before this fix won't update on their own** — the icon gets baked into the shortcut (Windows `.lnk`) or the iOS home-screen entry at creation time. Delete and re-create to pick up the new icon; a source-file change alone won't retroactively fix one already made.

**Focus-specific**: these four lines get wiped on every Folium rebuild along with the favicon link, banner, and back button — see `FOCUS.md`'s known-gap section.

## Data export pipeline (Plan, Promote — the pattern to follow for future modules)

There is **no working Python in this environment** — `python`/`python3` on PATH resolve to non-functional Windows Store stub aliases (confirmed directly: they print an install-from-Store message and exit, they don't run). Anaconda's install may still work at its full path (`C:\Users\Owner\anaconda3\python.exe`, referenced in Focus's build section) but wasn't used for Plan/Promote's data pipelines — instead:

1. **Excel COM automation** (`New-Object -ComObject Excel.Application` in PowerShell) opens the source `.xlsx` and saves each sheet as CSV (`$ws.SaveAs($path, 6)`), invisibly (`$excel.Visible = $false`). Reliable, no external dependency beyond Excel itself being installed (it is, on this machine).
2. A PowerShell build script (`build_plan_data.ps1`, `build_promote_data.ps1`) parses the CSV with `ConvertFrom-Csv` and builds the final JSON with `ConvertTo-Json`.
3. The output gets copied into the relevant `site/<module>/data.json` and committed.

**Real gotcha found building this**: a couple of Sage export rows have embedded newlines or stray quote characters inside long free-text note fields (`GeneralNotes`, `ContactNotes`), which shift the CSV column alignment for those specific rows — garbage values ("TRUE", stray sentence fragments) can land in unrelated columns like `AcctReps`. Affects a tiny fraction of rows (2 of 1,948 in the run that found this) but is worth a sanity check (e.g. filter out suspiciously long or boolean-looking values) rather than assuming every row parsed cleanly. See `Clean-AcctRep` in `build_plan_data.ps1` for the pattern.

This pipeline is **not automated or live** — rerun by hand whenever Matt pulls a fresh export. Each build script currently expects the source CSVs already exported to a scratch folder (update the `$scratch` variable at the top before rerunning) — not yet a single one-command pipeline from `.xlsx` to deployed `data.json`.

## Auto-update banner mechanism

Every live page polls `version.json` every 60 seconds (cache-busted query param, `{cache:"no-store"}`). On a SHA mismatch from the value seen at page-load, it shows a fixed bottom banner ("A newer version of this page is available" + Refresh button) rather than silently reloading — deliberate, so an in-progress form entry (e.g. Inspire's Notes field) doesn't vanish mid-visit. To add this to a new page, copy the IIFE block from the end of `site/inspire/index.html`'s `<body>`, adjusting the relative path to `version.json` (`"version.json"` from the site root, `"../version.json"` from a subfolder).

## Known gotcha: Focus's page regenerates its own `<head>`/`<body>`

`market_intelligence_engine.py` doesn't hand-write HTML — Folium generates the whole page from its own template on every run. That means **the favicon `<link>` tag and the auto-update banner `<script>` block on `site/focus/index.html` get wiped on every Focus rebuild.** Re-add both by hand after each redeploy (or add a post-processing step to the Python script that reinjects them — not done yet).

## Known gotcha: CSS Grid + flex-wrap overflow

If a flex-wrap row (e.g. Inspire's chip rows) sits inside a CSS Grid column, the grid track defaults to `min-width: auto`, which sizes to the *unwrapped* max-content width of its children — silently defeating the wrap and causing the whole page to overflow horizontally at narrow widths. Fix: `min-width: 0` on the grid item (and any wrapping ancestor). Found and fixed during Inspire's build; watch for it in any future grid+flex layout in this suite.

## Known gotcha: never test via `file://`

Any page here that `fetch()`s a JSON file (every module's `data.json`) will silently fail under browser CORS restrictions if opened by double-clicking the HTML file directly (`file://` protocol) — it looks exactly like broken data, but isn't a code bug. **Always test via a served URL**: a local static server for quick checks, or the live Pages URL once deployed. This was the root cause behind weeks of Focus appearing broken before it was diagnosed — don't repeat it for any future module.

**Local test server**: given no reliable Python on this machine (see the data-pipeline section above), the proven approach this session was a small PowerShell static file server using `System.Net.HttpListener` (no external dependency at all), wired up via `.claude/launch.json` so it launches through the standard preview tooling:

```json
{
  "version": "0.0.1",
  "configurations": [{
    "name": "plan-static-server",
    "runtimeExecutable": "powershell.exe",
    "runtimeArgs": ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "<path to a static_server.ps1 script>"],
    "port": 8899
  }]
}
```

The script itself just loops on `HttpListener.GetContext()`, maps the request path to a file under `site/`, and writes the bytes back with a correct `Content-Type` by extension. Anaconda's Python (`C:\Users\Owner\anaconda3\python.exe -m http.server 8000`, run from inside `site/`) is a working alternative if available. Either way: run from a location so relative paths resolve the same way they will live.

## Known gotcha: GitHub Pages deploy/CDN delay

Deploys are usually fast (~15-60 seconds from push to live, confirmed by polling `version.json`), but GitHub Pages' CDN caches `Cache-Control: max-age=600` — up to 10 minutes of staleness is possible, and a browser tab left open from before a push won't refresh on its own even after the CDN catches up (it just shows whatever it last rendered until reloaded). If something looks stale, check the real timestamp: `curl https://j3yarbr.github.io/embassy-market-intelligence-plan/version.json` shows the actually-deployed commit SHA — don't assume a multi-hour staleness report is a deploy problem before checking this; it's much more often a browser tab that was never actually reloaded (confirmed this exact scenario 2026-08-26 — a report of "hours-old" content turned out to be a backgrounded tab, not a slow deploy).

## Google Drive migration

Source moved from a standalone `Documents\Embassy Market Intelligence\` folder to a Google-Drive-for-Desktop-mirrored `C:\Users\Owner\My Drive\Embassy Market Intelligence\` (Mirror mode, a real local folder). **Documents and My Drive are independent copies, not linked** — Drive Mirror mode only syncs `My Drive\...` with the cloud; edits to the old Documents path never reach Drive (or any iPad/connector-based session). Treat `My Drive\Embassy Market Intelligence` as the one active working copy. Sync was verified complete via a full file-list diff plus byte-size spot-checks on key source files (88/88 files, byte-identical) — the old Documents copy is stale and safe to retire when comfortable.

## Branding reference

Real logo assets: `Branding Logos\` in the Drive source folder — `Embassy Inspire Logo.png` is the actively-used compass-rose mark ("Branding With a Purpose"), natively transparent background, 1536×1024, compass mark occupies roughly the left third (the wordmark sits close enough to the mark that a favicon-style crop needs to stop around x≈655 of the original to avoid clipping the "E" of EMBASSY).

**Palette** (navy/blue/white/gray, used consistently across the landing page, Focus, and Inspire):
```
--navy:      #1f3752
--navy-deep: #152840
--blue:      #2f6fed
--blue-soft: #eaf1fe
--gray-bg:   #f4f6f9
--gray-line: #e2e6ec
--gray-text: #5b6572
--live:      #1f8a4c   (bg #e7f6ed)
--dev:       #b5790a   (bg #fdf1dc)
--warn:      #b3532e   (bg #faeae4)
```

## Environment quirks on this machine

- Anaconda's `python`/`pyinstaller` aren't on PATH in a fresh shell — use full paths (`C:\Users\Owner\anaconda3\python.exe`, `C:\Users\Owner\anaconda3\Scripts\pyinstaller.exe`).
- The S: drive maps to `\\server-1\shared\...` — the raw UNC path fails from a fresh shell ("No such file or directory"), but the mapped `S:\` letter works.
- Bash tool paths ending in a trailing backslash before a closing double-quote will break quoting (e.g. `"C:\...\folder\"` — drop the trailing backslash).
