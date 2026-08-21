# Technical Information / Architecture / Troubleshooting

**Last updated:** 2026-08-21

Part of the Embassy Market Intelligence Suite (see `README.md`). Cross-cutting technical reference — deploy mechanics, known gotchas, and things that will burn real time if you don't know them going in.

## Deploy pipeline

- **Repo**: `https://github.com/j3yarbr/embassy-market-intelligence-plan`, local clone at `C:\EmbassyMapDeploy\embassy-market-intelligence-plan` (short path deliberately — the default deep temp/scratchpad paths hit "Filename too long" errors with git on Windows).
- **Workflow**: `.github/workflows/pages.yml`, triggers on any push to `main`. No build step — it just uploads whatever's in `site/` to GitHub Pages via `actions/upload-pages-artifact` + `actions/deploy-pages`. Also writes `site/version.json` (commit SHA + UTC timestamp) right before the upload step, which powers the auto-update banner (below).
- **Branch workflow**: short-lived feature branches for active work, merged to `main` via `--no-ff` once verified locally, branch deleted. Don't use permanent per-module branches — GitHub Pages only ever serves one branch, and the whole point of the Suite Landing Page is that every module needs to be live simultaneously.
- **Git identity** is configured globally on this machine (Matt Yarbrough / matt@embassygear.com) and Git Credential Manager already caches a GitHub credential — pushes work with no interactive prompt.

## Site structure

```
site/
  index.html         ← Suite Landing Page (hub), also the repo's README-equivalent front door
  favicon.png         ← Embassy compass mark, cropped from the full logo
  version.json         ← gitignored, regenerated fresh by the workflow on every deploy
  focus/                ← Focus map app (Folium-generated index.html, data.json, cluster_callback.js)
  inspire/              ← Inspire prototype (hand-written index.html, data.json)
  promote/  plan/        ← don't exist yet, added when each module ships
```

A `site/core/` folder (shared nav/branding/CSS) is reserved for once 2+ modules justify extracting common code — not worth it for one module.

## Auto-update banner mechanism

Every live page polls `version.json` every 60 seconds (cache-busted query param, `{cache:"no-store"}`). On a SHA mismatch from the value seen at page-load, it shows a fixed bottom banner ("A newer version of this page is available" + Refresh button) rather than silently reloading — deliberate, so an in-progress form entry (e.g. Inspire's Notes field) doesn't vanish mid-visit. To add this to a new page, copy the IIFE block from the end of `site/inspire/index.html`'s `<body>`, adjusting the relative path to `version.json` (`"version.json"` from the site root, `"../version.json"` from a subfolder).

## Known gotcha: Focus's page regenerates its own `<head>`/`<body>`

`market_intelligence_engine.py` doesn't hand-write HTML — Folium generates the whole page from its own template on every run. That means **the favicon `<link>` tag and the auto-update banner `<script>` block on `site/focus/index.html` get wiped on every Focus rebuild.** Re-add both by hand after each redeploy (or add a post-processing step to the Python script that reinjects them — not done yet).

## Known gotcha: CSS Grid + flex-wrap overflow

If a flex-wrap row (e.g. Inspire's chip rows) sits inside a CSS Grid column, the grid track defaults to `min-width: auto`, which sizes to the *unwrapped* max-content width of its children — silently defeating the wrap and causing the whole page to overflow horizontally at narrow widths. Fix: `min-width: 0` on the grid item (and any wrapping ancestor). Found and fixed during Inspire's build; watch for it in any future grid+flex layout in this suite.

## Known gotcha: never test via `file://`

Any page here that `fetch()`s a JSON file (Focus's `data.json`, Inspire's `data.json`) will silently fail under browser CORS restrictions if opened by double-clicking the HTML file directly (`file://` protocol) — it looks exactly like broken data, but isn't a code bug. **Always test via a served URL**: a local static server for quick checks, or the live Pages URL once deployed. This was the root cause behind weeks of Focus appearing broken before it was diagnosed — don't repeat it for any future module.

Local test server (Anaconda's Python, since the bare `python` command on this machine is a non-functional Windows Store shim):
```
"C:\Users\Owner\anaconda3\python.exe" -m http.server 8000
```
Run from inside `site/` (or the relevant subfolder) so relative paths resolve the same way they will live.

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
