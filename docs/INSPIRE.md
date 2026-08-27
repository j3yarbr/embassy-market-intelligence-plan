# Inspire

**Status:** 🟢 Live · **Last updated:** 2026-08-27
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/inspire/

Part of the Embassy Market Intelligence Suite (see `README.md`). Inspire is a guided, consultative recommendation tool that curates the right program, apparel, fabric, and decoration method for a client instead of a sterile catalog scroll — positioning Embassy as **Consultant, Strategist, Partner**, explicitly not "Engineer." Went through several real architecture changes on 2026-08-21 (a single busy day) — described below is the current, live shape; don't describe it as a step wizard, that version is gone.

## Current architecture: single-page form + gallery, not a step wizard

- **Sticky case bar** at top: Company (text) + a Sage client/prospect checkbox, Event/Occasion (text), Budget (text). A real client-record layer sitting above the abstract categorical model.
- **Left panel** — compact chip-based inputs: Business Problem, Industry, Audience, Brand Position, Environment, Relationship Stage (optional), Quantity (optional), Notes (optional). Every section is collapsible, default closed, live one-line summary in its collapsed header — a **standing UI rule for the whole suite**, not scoped to Inspire (see `README.md`).
- **Right panel** — a guidance banner (confidence badge + program hint), followed by 6 collapsible clusters (also default closed): **Apparel, Fabric, Decoration Method, Hardgoods, Signage, Safety**. Each shows the rule engine's current suggestion and expands to a swipeable row of every real option in that category. Tapping a card **earmarks** it, overriding the engine's suggestion ("Your pick" vs. "Suggested"), and the override survives further changes to the left-side inputs.
- **Order Details modal** (button below the clusters): captures production specifics that matter "sometimes but not always" — decoration is a **repeatable list** (placement + method + colors per instance, so "how many decoration spots" is just the list length), garment/part color (repeatable, for multi-part items like hats), and a hat-specific build section (panel style, closure, per-part colors) that auto-appears when Headwear is earmarked.
- **Saved Cases**: autosaves every case to browser `localStorage` the moment Company gets a value (chips/earmarks save immediately, text fields debounce 400ms). A "📁 Saved Cases" button lists every saved record to reload with one click. **Known limitation, not yet solved**: device-local only — a case saved on the iPad won't show up on desktop. Tied to the long-term real-backend direction (see `README.md`).

## The 6-category product model (the current taxonomy — get this right)

`inspire_reference_data.json`'s `product_item` table tags every item with a `category`: **Apparel** (Event Tee, Professional Polo, Premium Polo/Quarter Zip, Performance Tee, Triblend Tee, **Headwear**), **Hardgoods** (Gift Set, Backpack, Tumbler, Swag Bag), **Signage** (Banner, Yard Sign), **Safety** (Hard Hat, High-Vis Vest). This replaced an earlier 2-cluster model (Garment + Hardgoods/Accessory) where Headwear was tagged `category: Apparel` but physically lived in the Hardgoods-sourced cluster — the exact bug that prompted the rework. **Headwear is Apparel, not Hardgoods** — watch for this if extending the taxonomy.

Signage and Safety are real, Matt-provided example items, but **zero rule-engine logic recommends them yet** — no `bp_industry_rule`/`bp_environment_rule` row ever suggests a banner or a hard hat. They render as browse-only clusters ("Optional — tap to browse, nothing suggested automatically"), deliberately not force-fit into the suggestion engine. Safety seems like an obvious future fit for Industrial/Construction & Trades industries, but that's new rule content to build, not a UI change — the clusters and data model are already there waiting.

**Sage might eventually offer real product groupings worth building this on top of** instead of hand-maintaining `product_item` — check before extending it much further by hand (Matt's own note).

## Source data (all in `Phase 2 Market Intelligence - Inspire\`)

- **`inspire_reference_data.json`** — plain lookup tables: business_problem (6), audience (3), industry (8), environment (5), brand_position (5), product_category (4), product_item (14, tagged by category), fabric_bucket (5, scored 1-5 on hand_feel/functionality/durability/professionalism, replacing an earlier flat named-fabric table since clients think in feel/functionality terms, not material names), decoration_method (5: DTF, Embroidery, Sublimation, DTG, Screen Printing — each with real fee subtext, see below), decoration_placement, hat_panel_style, hat_closure, hat_part (Order Details' reference tables).
- **`inspire_bp_industry_rule.json`** — 48 rows (6 Business Problems × 8 Industries). Confidence-tiered: `confirmed` / `guess, routine pattern` / `guess, judgment call`. **All 48 rows now have Matt's read (19 confirmed, 29 routine-pattern, 0 judgment calls remaining)** — the review queue that was open through most of the build is now closed.
- **`inspire_bp_environment_rule.json`** — 25 rows (5 Brand Positions × 5 Environments). All confirmed, fully settled.
- **`site/inspire/data.json`** is a merged bundle of all three source files (one-off Python/PowerShell merge, not auto-synced) — regenerate and redeploy it whenever the Phase 2 source JSON changes.

## Engine rules confirmed (don't relitigate these)

- **Every default is soft, always overridable** — Matt's own framing: *"embroidery can technically be available for all fabrics but can be overwritten."* No fabric/environment/industry combination hard-excludes an option, it just defaults away from it.
- **Decoration method tracks the garment/fabric bucket, not Environment** — reverted an earlier draft that bumped toward Embroidery in demanding environments. Matt: *"tee and embroidery don't go well."*
- **Industry can pivot the accessory category itself**, not just style within it (e.g. Uniform Program × Healthcare → not Headwear at all, defaults to Tumbler) — a genuine judgment call each time it's applied elsewhere.
- **Precedence when signals conflict**: Budget (Brand Position) is a hard filter > Business Problem is the primary signal > Industry is a soft nudge/tiebreaker that ranks but never eliminates.
- **Trade Show apparel is always "Polos with Embroidery"** across all 8 industries — this replaces the environment rule's garment/decoration call entirely for that Business Problem (`apparel_lean` override path).

## Known data gap: fabric names don't match fabric buckets (surfaced honestly, not hidden)

`bp_environment_rule.json`'s `fabric` field still names old specific materials ("Moisture Wicking Poly," etc.) inherited from before the fabric-bucket model existed — never mapped onto the newer bucket names (Woven, Soft Cotton/Jersey, Technical Performance, Refined Performance, Casual Blend). The Fabric cluster shows a "Heads up" note and no card auto-earmarks, rather than faking a match. **Don't build this mapping without Matt** — he's said fabric/decoration technical compatibility is his to drive.

## Real fees, live as subtext on the Decoration cards

- Digitizing/vector fee: **$30, one-time per order** — not embroidery-specific, applies to any method when artwork isn't already print-ready.
- Embroidery machine setup fee: **$5, one-time per order** — additional to the $30 when both apply.
- Hardgoods setup fee: **~$55–$75 per order**, varies, doesn't scale with quantity.

## Product + Decoration Bible (`Product + Decoration Bible.xlsx`, Drive suite root)

Real per-decoration-method reference content: best-for use cases, pros/cons, optimal quantity range, technical known-issues (embroidery puckering on thin fabric, DTF's "sweat patch" risk + heat sensitivity, screen print's plastisol cracking + fibrillation, DTG's vinegar smell + cold-wash care, sublimation's total failure on dark fabric). **Not yet wired into the app** — this is the real "why this works" content the Decoration cluster's guidance is still missing. Matt's long-term goal: grow this into a cheat-sheet/reference library embedded directly in Inspire.

## Imagery roadmap (current text-only state is deliberate, not a gap)

1. **Phase 1 (current)** — no imagery, text/reasoning only.
2. **Phase 2** — generic imagery, possibly scraped from Embassy's own website.
3. **Phase 3** — true SAGE API connectivity to mirror the real assortment.

Don't add images without checking which phase is intended.

## Known open items

See `BACKLOG.md`'s Inspire section for the live list, including: whether Sage eventually offers real product groupings to build the taxonomy on top of; the free-text decoration color ideas (misspelling detection, a real color picker); the long-term "upload a logo, see a live rendered mockup" vision (meaningfully bigger than anything built so far, not scoped); whether Relationship Stage/Quantity/Notes should ever feed real logic or stay flavor-only.
