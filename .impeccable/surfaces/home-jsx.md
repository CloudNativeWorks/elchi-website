---
version: 1
slug: "home-jsx"
primary_target: "home.jsx"
related_targets: ["hero-stage.jsx","hero-3d.jsx","relief.css","styles.css","shared.jsx"]
---

# Home page

Scope: the home page (home.jsx, home.css, hero-stage.jsx, hero-3d.jsx) plus the shared chrome every page uses (nav and footer in shared.jsx, base tokens in styles.css). Other pages inherit the new chrome and tokens now and get their own redesign later.

Visitor mode: Persuade.

Audience and job: platform/SRE/DevOps engineers evaluating a control plane for their Envoy fleet. The one belief the first viewport must prove: one control plane drives the whole fleet, every Envoy and version, with no hand-written xDS. Action: get in touch for a demo or licence (Get Started, Contact); Watch the film opens the explainer.

Must not feel: playful, generic dark SaaS, hard to read (text fighting the animation, dense tables lost on mobile), slow or heavy.

Constraints: all factual copy and EN/TR strings kept; routes kept; npm run build (prerender) passes; the hero stays real-time WebGL with the poster image first; verify at 1440 and 390.

Memorable moment: the live 3D fleet sits in a deep lake-blue rounded 16:10 panel rising out of pale terrain. The user removed the callout labels and leaders from the panel (2026-11-08): the scene stays unlabelled.

Round 1 (The Drawing Set) was built and rejected by the user: "too much like a newspaper, sharp lines". Nothing ruled, boxed or newsprint-like may come back.

## Direction contract

THESIS: The fleet as soft terrain: the page is a hypsometric relief where each section is an elevation band, traffic runs across it like water, and Elchi shapes the land. It refuses ruled sheets, boxed tables and the glowing dark SaaS hero.

OWN-WORLD: Pale mist and sage elevation bands deepening to moss, one deep lake blue for text and for the deepest panels, coral only for Shield, a water blue only for the request path. Tone separates regions, never drawn rules. Large rounded panels (28 to 36px radius), pill controls, soft offset shadows, authored contour-line plates. A humanist sans for reading and headlines, italic serif map lettering for water and place labels, mono only for versions.

STORY: The engineer sees the live fleet rising out of the terrain (understands), reads that one control plane drives every Envoy (believes), and takes the single saturated action, Get started, or contacts the team at the close (acts); the bands below prove it: products as plateaus on Core, notes, comparison, screenshots, architecture in the deep lake band, use cases.

FIRST VIEWPORT: A floating rounded nav pill. Left, over pale terrain with contour lines: headline about 76px, paragraph, Get started (deep lake pill) and Watch the film 2:43 (light pill), a quiet View architecture link. Right, about half the width: the live WebGL scene in a deep rounded 16:10 landscape panel (4:3 on phones), with no labels over it, and a segmented chapter control inside its bottom edge. Under both, a translucent rounded band with the four key facts and the live release versions. Phones: headline first, then the panel, then the band.

FORM: Hypsometric relief map and hill-shaded terrain model, candidate 3 of 7 on the round-two list, raised with: tone not rules, trace any load, one saturated control, live state in place. seed:8d7cf367f541af0e

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
