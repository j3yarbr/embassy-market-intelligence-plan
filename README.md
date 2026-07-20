# Embassy Market Intelligence — Focus

Interactive market-gap map for Embassy's field sales territory. Plots existing
clients and untapped prospects across a bounded four-state sales corridor, with
clustering and an industry-category filter, so a rep can see where the
opportunity actually is instead of driving blind.

This is the **Focus** module of the broader Embassy Market Intelligence Suite
(Focus → Inspire → Product → Promote → Plan). Focus is the only module built
so far; it answers "where should I go and who's already there."

## Live map

https://j3yarbr.github.io/embassy-market-intelligence-plan/

Deploys automatically on every push to `main` that touches `site/` — see
`.github/workflows/pages.yml`. There's no build step in CI; the workflow just
uploads whatever's sitting in `site/`, so `site/` must always contain a
ready-to-serve export (`index.html`, `data.json`, `cluster_callback.js`).

## How the map is generated

The actual generator (`market_intelligence_engine.py`, in a separate local
folder — not this repo) is a PyInstaller-compiled Windows tool a rep runs
locally. Each run:

1. Loads existing clients from a Sage CRM export (CSV, geocoded, pulled from
   a network share).
2. Pulls prospects from OpenStreetMap via the Overpass API, bounded to a
   7-point polygon (Wichita → Kansas City → Sedalia → Springfield → Branson →
   Fort Smith → Tulsa) representing the realistic drivable sales corridor —
   not the full four states, which would include places like Little Rock or
   St. Louis that no one is actually driving to.
3. Buckets every prospect into a Sage-CRM-style industry category (Banking,
   Legal, Salon & Spa, Automotive, etc.) based on its raw OpenStreetMap tags,
   with anything unmapped falling to "Other" rather than being dropped.
4. Writes a Folium/Leaflet map (`index.html`) plus the plotted points as a
   separate `data.json`, and copies these (along with `cluster_callback.js`)
   into an output folder that gets pushed here, into `site/`.

## Key design decisions worth knowing before touching this

- **Data loads via `fetch("data.json")` at runtime, not embedded in the
  HTML.** An earlier version embedded all data directly in the page, which
  worked on desktop but was too large for mobile Safari to load reliably.
  The tradeoff: `fetch()` requires the page be *served* (http/https) — it
  silently fails under browser CORS restrictions if `index.html` is opened
  directly as a local file (`file://`, e.g. double-clicking it). Always test
  this map via a served URL (a local static server, or this live Pages URL),
  never by double-clicking the file.
- **Markers are added in bulk (`addLayers()`), never one at a time
  (`addTo()`) in a loop.** Leaflet.markercluster rebuilds its spatial index
  on every individual insert, which freezes the tab for minutes at this
  data's scale (~28k points) — bulk loading avoids that entirely.
- **The category filter hides markers, it never discards data.** Rather than
  narrowing the Overpass query by industry (which risks losing real
  prospects — small-town OSM tagging is too inconsistent to filter reliably
  at the query level), every prospect is pulled and categorized, and the
  checkbox panel in the top-right toggles visibility per category via bulk
  `addLayers()`/`removeLayers()` calls. Nothing is ever thrown away upstream.
- **Client industries are currently all "Other."** The Sage export this pulls
  from is a geocoding-only file (no Industry column). A real fix means either
  adding that field to the export or joining a second Sage file by company
  name — not yet done.

## Known gaps / next up

- Client industry categorization (see above)
- Sanity-check the OSM-tag → Sage-category mapping against real data
  distribution now that volume is a manageable ~27k prospects
- Everything past Focus (Inspire, Product, Promote, Plan) is still conceptual
