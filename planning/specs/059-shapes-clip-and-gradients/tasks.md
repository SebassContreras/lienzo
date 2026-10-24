# 059 — shapes-clip-and-gradients — Tasks

- [x] T001 [agent] [status:done] Add pure `fitToBox` to `src/engine/geometry.ts`
      covers: D2@1
      changes: src/engine/geometry.ts (+17 -0)
- [x] T002 [agent] [status:done] Add the `fit` field to `polygon`, export `polygonPoints`, and use it in `drawPolygon` and in `outlineOf` (`src/components/polygon/`, `src/engine/clip.ts`)
      covers: D1@1, D2@1
      changes: src/components/polygon/descriptor.ts (+16 -2), src/components/polygon/draw.ts (+8 -2), src/engine/clip.ts (+2 -1)
- [x] T003 [agent] [status:done] Add `clip` and `radius` to `group` and clip the content to the rounded box when the frame is `none` (`src/components/group/`)
      covers: D3@1
      changes: src/components/group/descriptor.ts (+12 -0), src/components/group/draw.ts (+11 -2)
- [x] T004 [agent] [status:done] Add `type` and `stops` (`StopsSchema`) to `fillFields`, and add `type` to `FillDefaults` and its callers (`src/components/fields/fill.ts`)
      covers: D4@1
      changes: src/components/fields/field.ts (+18 -6), src/components/fields/fill.ts (+43 -3), src/presets/recipes.test.ts (+7 -2), src/service/contrast.test.ts (+2 -0), src/test/legacy-schema.ts (+15 -0), src/test/registry.test.ts (+2 -2), src/traits/fill.ts (+1 -1), src/traits/glass.ts (+1 -0)
- [x] T005 [agent] [status:done] Implement `gradientStops` and `fillGradient` (linear and radial), keep `linearGradient` as a wrapper, and switch the rect, badge, path and icon draws to `fillGradient` (`src/engine/paint.ts`, `src/components/*/draw.ts`)
      covers: D5@1
      changes: src/components/badge/draw.ts (+2 -2), src/components/icon/draw.ts (+2 -4), src/components/path/draw.ts (+2 -2), src/components/rect/draw.ts (+2 -2), src/engine/geometry.ts (+7 -2), src/engine/paint.ts (+79 -14)
- [x] T006 [agent] [status:done] Describe `fit`, `clip`, `type` and `stops` in the tool descriptions and regenerate `schemas/compact-scene.json`
      covers: D4@1, D6@1
      changes: src/service/tools/element-add.ts (+4 -0), src/service/tools/scene-build.ts (+4 -0)
- [x] T007 [agent] [status:done] Test box fitting (`src/engine/geometry.test.ts`, `src/components/polygon/polygon.test.ts`):
      - `fitToBox` maps the points' bounds onto the box exactly
      - a zero-height set of points stays centred and has no NaN
      - regression (issue #8): with `sides: 3` and `fit: "box"`, the lowest vertex has y = `y + h` and the apex has y = `y` (fails before T002)
      - an old polygon with no `fit` parses as `"circle"` and gives the same points as `radialPoints`
      covers: R1@1, R4@1
      kind: test
      changes: src/components/polygon/polygon.test.ts (+40 -0), src/engine/geometry.test.ts (+33 -0)
- [x] T008 [agent] [status:done] Test group clipping with a recording fake context (`src/components/group/clip.test.ts`):
      - `clip: true` with `frame: "none"` calls `clip` with the group's rounded rect before the children draw
      - without `clip`, there's no clip call (unchanged)
      - an old group parses with `clip: false` and `radius: 0`
      covers: R2@1, R4@1
      kind: test
      changes: src/components/group/clip.test.ts (+61 -0)
- [x] T009 [agent] [status:done] Test gradients (`src/engine/paint.test.ts`, `src/model/compact-schema.test.ts`):
      - `gradientStops` with no `stops` returns `color` at 0 and `color2` at 1
      - given `stops` are returned in order, same-offset stops included
      - `type: "radial"` creates a radial gradient centred on the box with radius `hypot(w/2, h/2)`; `linear` keeps today's endpoints
      - `at: 1.5` and a single stop fail validation with their path
      - a compact `rect` with `fill: { gradient: true, type: "radial", stops: [...] }` builds and keeps them
      - an old fill parses as `type: "linear"` with no `stops`
      covers: R3@1, R4@1
      kind: test
      changes: src/engine/paint.test.ts (+75 -0), src/service/compact/gradients.test.ts (+67 -0)
