- [x] T001 [agent] [status:done] Add `mode: "morph" | "layers"` to the `path` descriptor and hide `morph`/`morphEasing` in `"layers"` mode (`src/components/path/descriptor.ts`)
      covers: D1@1
      changes: src/components/path/descriptor.ts (+24 -2)
- [x] T002 [agent] [status:done] Extract `paintFrame` from `drawPath` and draw every shape stacked in `"layers"` mode, skipping shapes that don't parse (`src/components/path/draw.ts`)
      covers: D2@1
      changes: src/components/path/draw.ts (+91 -51)
- [x] T003 [agent] [status:done] Change `particles` fields: fractional `speed >= 0`; add `motion`, `direction`, `gravity`, `twinkle` with defaults and visibility (`src/components/particles/descriptor.ts`)
      covers: D3@1
      changes: src/components/particles/descriptor.ts (+70 -6), src/components/fields/field.ts (+10 -0), src/components/fields/box.ts (+10 -13), src/test/legacy-schema.ts (+6 -1)
- [x] T004 [agent] [status:done] Dispatch `particlePositions` on `motion`; add `static` resting places and `speed < 1` / `speed === 0` drift handling, keeping the PRNG order (`src/engine/particle-field.ts`)
      covers: D4@1
      changes: src/engine/particle-field.ts (+30 -15), src/engine/prng.ts (+11 -0)
- [x] T005 [agent] [status:done] Implement pure `fallPositions` with the rotated D-square wrap, whole crossings per loop, gravity easing and off-box culling (`src/engine/particle-fall.ts`)
      covers: D5@1
      changes: src/engine/particle-fall.ts (+77 -0)
- [x] T006 [agent] [status:done] Implement pure `twinkleAlphas` with whole-number frequencies, returning `null` when twinkle is 0 (`src/engine/particle-twinkle.ts`)
      covers: D6@1
      changes: src/engine/particle-twinkle.ts (+44 -0)
- [x] T007 [agent] [status:done] Skip NaN points, apply twinkle alpha to sprites and to bucketed dots, and share `bucketBy` with links (`src/components/particles/draw.ts`)
      covers: D7@1
      changes: src/components/particles/draw.ts (+91 -29)
- [x] T008 [agent] [status:done] Document the new `path` and `particles` fields (including `speed` as crossings per loop in `"fall"`) where component fields are described to MCP tools and agents
      covers: D1@1, D3@1
      changes: src/components/particles/descriptor.ts, src/components/path/descriptor.ts (field docs; `component_list` and the inspector read them from the descriptors)
- [x] T009 [agent] [status:done] Test that `"layers"` mode paints each shape in order with its own fill/stroke and falls back to the element's; that `morph` has no effect in layers; and that an invalid shape is skipped (`src/components/path/layers.test.ts`)
      covers: R1@1
      kind: test
      changes: src/components/path/layers.test.ts (+110 -0)
- [x] T010 [agent] [status:done] Test that the schema accepts `speed` 0 and 0.5, rejects negative `speed`, rejects `twinkle` > 1 and negative `gravity`, and that defaults fill in on old scenes (`src/components/particles/particles-schema.test.ts`)
      covers: R2@1
      kind: test
      changes: src/components/particles/particles-schema.test.ts (+52 -0), src/model/compact.test.ts (+1 -1)
- [x] T011 [agent] [status:done] Test fall motion (`src/engine/particle-fall.test.ts`):
      - t=0 and t=T give the same positions at 90°, 0° and 45°
      - at 90° the mean y increases over the first crossing
      - gravity > 0 moves a point less in the first quarter than in the last
      - all points that aren't NaN are inside the box plus the margin
      covers: R3@1
      kind: test
      changes: src/engine/particle-fall.test.ts (+101 -0)
- [x] T012 [agent] [status:done] Test that `"static"` mode and `speed === 0` keep every point at its seeded place at all t, and that twinkle changes opacity over t, closes at t=T, and returns `null` at 0 (`src/engine/particle-field.test.ts`, `src/engine/particle-twinkle.test.ts`)
      covers: R3@1
      kind: test
      changes: src/engine/particle-field.test.ts (+58 -0), src/engine/particle-twinkle.test.ts (+37 -0)
- [x] T013 [agent] [status:done] Regression test that, for elements without the new fields, drift positions with integer speeds match values recorded before 057 and `path` with several shapes still morphs (`src/engine/particle-field.test.ts`, `src/components/path/layers.test.ts`)
      covers: R4@1
      kind: test
      changes: src/engine/particle-field.test.ts, src/components/path/layers.test.ts
