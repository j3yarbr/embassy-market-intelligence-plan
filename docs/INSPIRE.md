# Inspire

**Status:** 🟠 Prototype live (Layer 1 data ~73% reviewed) · **Last updated:** 2026-08-21
**Live URL:** https://j3yarbr.github.io/embassy-market-intelligence-plan/inspire/

Part of the Embassy Market Intelligence Suite (see `README.md`). Inspire is a guided, consultative recommendation tool that curates the right program, garment, fabric, and decoration method for a client instead of a sterile catalog scroll — positioning Embassy as **Consultant, Strategist, Partner**, explicitly not "Engineer."

## Current architecture: form + gallery (not a step wizard)

Inspire went through two real builds the same day (2026-08-21) — worth knowing so you don't describe the wrong one. The current, live version is a **single continuous page**, no step/wizard navigation:

- **Sticky case bar** at top: Company (text), Event/Occasion (text), Budget (text), and a checkbox tracking whether this is a **current client in Sage** vs. a **prospect**.
- **Left panel** — compact chip-based inputs: Business Problem, Industry, Audience, Brand Position, Environment, Relationship Stage (optional), Quantity (optional), Notes (optional). Every section is collapsible and defaults closed, showing a live one-line summary in its collapsed header — a standing UI rule for the whole suite now, not just here.
- **Right panel** — a guidance banner (confidence badge + program hint + LookupKey), followed by 4 collapsible clusters (also default-closed): **Garment, Fabric, Decoration Method, Hardgoods/Accessory**. Each cluster shows the rule engine's current suggestion and expands to a swipeable row of every real option in that category. Tapping a card **earmarks** it, overriding the engine's suggestion (tagged "Your pick" vs. "Suggested"), and that override survives further changes to the left-side inputs.

An earlier same-day version was a literal 5-step wizard (Intro → Business Context → Brand & Audience → Environment & Quantity → Recommendations) with flat recommendation cards — fully superseded, don't build toward it.

## Source data

All in `Phase 2 Market Intelligence - Inspire\` in the Drive source folder:

- **`inspire_reference_data.json`** — plain lookup tables: 6 business problems, 3 audiences, 8 industries, 5 environments, 5 brand positions, 5 garment tiers, 5 fabric buckets (hand-feel/functionality/durability/professionalism, 1–5 scores), 5 decoration methods (DTF, Embroidery, Sublimation, DTG, Screen Printing), 5 accessory/hardgoods categories (each tagged Apparel or Hardgoods).
- **`inspire_bp_industry_rule.json`** — 48 rows (6 Business Problems × 8 Industries). Each row: `program_pivot`, `apparel_lean`, `hardgoods_lean`, `decoration_lean`, `confidence`. **35 of 48 rows are Matt-confirmed; 13 are flagged `"guess, judgment call"` and need his read; the rest are lower-risk `"guess, routine pattern"` extrapolations.**
- **`inspire_bp_environment_rule.json`** — 25 rows (5 Brand Positions × 5 Environments). Garment tier, fabric, decoration method per combo. **All 25 rows are confirmed** — this table is fully settled.
- The deployed app's `site/inspire/data.json` is a merged bundle of both rule files plus the reference lookups, built via a one-off Python script (not hand-transcribed) — regenerate and redeploy it if the source JSON changes; it does not auto-sync.

## The 13 rows needing Matt's review (priority order — the real toss-ups)

1. Uniform Program × Retail & Hospitality
2. Uniform Program × Technology
3. Recognition × Retail & Hospitality
4. Recruiting × Retail & Hospitality
5. Recruiting × Technology
6. Retention × Technology
7. Trade Show × Industrial
8. Trade Show × Construction & Trades
9. Trade Show × Healthcare
10. Trade Show × Technology
11. Fundraiser × Education
12. Fundraiser × Healthcare
13. Fundraiser × Technology

The live prototype's confidence badge (green "Confirmed" / amber "routine pattern draft" / red "judgment call draft") makes these easy to spot by clicking through Business Problem × Industry combinations.

## Engine rules confirmed so far (don't relitigate these)

- **Decoration method is always a soft default, never a hard restriction** — always manually overridable. Matt's own words: *"embroidery can technically be available for all fabrics but can be overwritten."*
- **Decoration method tracks the garment/fabric bucket, not Environment.** An earlier draft bumped decoration toward Embroidery in demanding environments (Outdoor/Manufacturing) — Matt reverted this: *"tee and embroidery don't go well."* Fabric can still get bumped toward a more durable material in demanding environments; decoration stays tied to the garment tier.
- **Industry can pivot the accessory *category* itself**, not just style within it (established by Uniform Program × Healthcare: not Headwear at all, defaults to Tumbler) — and this is a genuine judgment call each time it's applied elsewhere (e.g. Fundraiser × Healthcare extrapolates it, flagged as unconfirmed).
- **Industry constraints are pure preference, never a hard gate** — no compliance/safety cases exist today. Example: Construction & Trades leaning toward a Richardson 112 cap over a Travis Mathew polo is a style lean, not an exclusion.
- **Budget (Brand Position) is a hard filter; Product/Program (Business Problem) is the primary signal; Industry is a soft nudge/tiebreaker** that ranks but never eliminates options.
- **Trade Show apparel is always "Polos with Embroidery"** across all 8 industries — extended from Matt's own confirmed example — and this replaces the environment rule's garment/decoration call entirely for that Business Problem (the app's `apparel_lean` override path).

## Known data gap: fabric names don't match fabric buckets

`bp_environment_rule.json`'s `fabric` field still names old specific materials ("Moisture Wicking Poly," "Ringspun Cotton," etc.) inherited from before the fabric-bucket model existed. `inspire_reference_data.json`'s `fabric_bucket` table (the newer feel/functionality model: Woven, Soft Cotton/Jersey, Technical Performance, Refined Performance, Casual Blend) was never mapped onto those old names. **The live app surfaces this honestly** — the Fabric cluster shows a "Heads up" note and no card gets auto-earmarked, rather than faking a match. **Don't build this mapping without Matt** — he's said he's handling fabric/decoration compatibility himself.

## Imagery roadmap (current state is deliberate, not a gap)

Product/option cards are text-only by design. Matt's 3-phase plan:

1. **Phase 1 (current)** — no imagery, just product information and reasoning ("why this works").
2. **Phase 2** — generic imagery, possibly scraped from Embassy's own website.
3. **Phase 3** — true API connectivity with SAGE to mirror Embassy's real assortment breadth.

## New suite module surfaced through Inspire design work

While sketching Inspire's UI, Matt confirmed **"Admin"** as a real 5th suite module (not yet speced beyond the name) — see `README.md` (Overall Infrastructure).

## Why Product got dropped from the suite

Matt's original wireframe described Inspire's option gallery as "collapsible clusters of products a customer would swipe through and earmark" — which reads like a real product/SKU catalog. No such catalog data exists yet (that's Phase 2/3 of the imagery roadmap above). This is very likely *why* the standalone Product module (a folder of SanMar PDF catalogs) was dropped from suite scope — Inspire's gallery direction was always meant to absorb that need.

See `BACKLOG.md` in the Drive source folder for current open items.
