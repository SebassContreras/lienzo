# 005 — particles — Design

## Approach

- D1@1 (implements R1, R3): `ParticlesEl` in `src/model/model.ts` = `{ id, kind: "particles", name, x, y, w, h, count, seed, speed, drift, dot: { size, color, opacity }, link: { distance, width, color, opacity }, glow, anim }`, with `defaultParticles()`; drawn by `src/components/particles/draw.ts` through a new case in `src/engine/render.ts`. It paints only points and lines, never a fill.
- D2@1 (implements R4): Motion lives in `src/engine/particle-field.ts`: a seeded PRNG (mulberry32) gives each point, once per `(seed, count, w, h, drift)`, a base position inside the box shrunk by `drift`, an amplitude up to `drift`, phases and integer frequencies from 1 to `speed`; its position at t is `base + (ax·cos(2π·fx·t/T + φx), ay·sin(2π·fy·t/T + φy))`. Integer frequencies close every path exactly once per loop (A6); nothing random runs at draw time.
- D3@1 (implements R1, R7): Every pair of points closer than `link.distance` gets a line with alpha `link.opacity · (1 − d / link.distance)`; pairs are checked directly (O(n²)), which stays cheap at the 300-point cap.
- D4@1 (implements R2, R5, R7): An inspector section "Partículas" edits every field (count capped at 300, seed with a "Redistribuir" button) and has "Ajustar al lienzo", which sets the box to `0, 0, scene.width, scene.height`. Allowed animations: none, fade-in, pop-in, breathe.
- D5@1 (implements R3): The stage selects, moves and resizes a particles element by its box, like a rectangle.
- D6@1 (implements R6): Particle presets are recipes in `presets/built-in/`; the traits they need (at least glow) gain an `apply.particles` function, and "Partículas" joins the library's basics.

## Deliverables

`src/model/model.ts` (type, default, animations), `src/engine/particle-field.ts`,
`src/components/particles/draw.ts`, render case, stage and geometry support, inspector
section, traits for particles, built-in recipes.

## Sequencing

After 004 (recipes and traits) and 006 (the "Fondo" control, needed once a full-canvas
particles element covers the empty canvas). Type → field math → draw → stage →
inspector → presets.
