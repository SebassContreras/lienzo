# 053 — transform-origin-and-opacity — Tasks

- [x] T001 [agent] [status:done] Add optional `origin?: { x: number; y: number }` (`OriginSchema`) to `ElementOf` (`src/components/descriptor.ts`) and `ElementSchema` (`src/model/element-schema.ts`), and add `originX` / `originY` to `AnimState` (`src/animations/kind.ts`), `animate` (`src/engine/animate.ts`), `withTransform` (`src/engine/paint.ts`) and `applyTransform` (`src/engine/clip.ts`)
      covers: D1@1
      changes: package.json (+1 -0), pnpm-lock.yaml (+12 -0), src/animations/kind.ts (+6 -1), src/components/descriptor.ts (+2 -0), src/engine/animate.ts (+12 -2), src/engine/clip.ts (+4 -4), src/engine/paint.ts (+7 -6), src/engine/subtitles/subtitles.test.ts (+2 -0), src/export/video-encoder.ts (+12 -11), src/model/element-schema.ts (+9 -0)
- [x] T002 [agent] [status:done] Support compact `origin` (`{ x, y }`, `[x, y]`, or named anchor) in `src/model/compact.ts`, `resolveOrigin` in `src/service/compact/layout.ts`, and `buildElement` in `src/service/compact/expand.ts`
      covers: D2@1
      changes: src/model/compact.ts (+10 -0), src/service/compact/expand.ts (+12 -1), src/service/compact/layout.ts (+31 -1)
- [x] T003 [agent] [status:done] Add `elementOpacity` helper in `src/components/fields/box.ts` and include animatable `opacity` (`0` to `1`, default `1`) in every component descriptor (`rect`/shapes, `group`, `particles`, `three`, `badge`, `progress`, `counter`, `bubble`, `steps`, `list`, `table`, `code`, `chart`, `path`, `subtitles`), updating `src/test/legacy-schema.ts`, `src/presets/recipes.test.ts` and `schemas/compact-scene.json`
      covers: D3@1
      changes: schemas/compact-scene.json (+286 -83), src/components/badge/descriptor.ts (+2 -0), src/components/bubble/descriptor.ts (+2 -0), src/components/chart/descriptor.ts (+2 -0), src/components/code/descriptor.ts (+2 -0), src/components/counter/descriptor.ts (+2 -0), src/components/fields/box.ts (+19 -0), src/components/group/descriptor.ts (+2 -0), src/components/list/descriptor.ts (+2 -0), src/components/particles/descriptor.ts (+2 -0), src/components/path/descriptor.ts (+2 -0), src/components/progress/descriptor.ts (+2 -0), src/components/rect/descriptor.ts (+2 -0), src/components/steps/descriptor.ts (+2 -0), src/components/subtitles/descriptor.ts (+2 -0), src/components/table/descriptor.ts (+2 -0), src/components/three/descriptor.ts (+2 -0), src/presets/recipes.test.ts (+8 -4), src/test/legacy-schema.ts (+3 -0)
- [x] T004 [agent] [status:done] Apply effective opacity multiplication and `<= 0` short-circuit in `drawElements` (`src/engine/render.ts`), `drawGroup` (`src/components/group/draw.ts`), and `placedElementsAt` (`src/service/layout.ts`)
      covers: D4@1
      changes: src/components/group/draw.ts (+4 -1), src/engine/render.ts (+9 -0), src/service/layout.ts (+8 -4)
- [x] T005 [agent] [status:done] Unit tests for `origin` pivot math (`@rotate`, `@scale`, loop animations), unified `opacity` across all component kinds, group opacity multiplication, zero-opacity short-circuit, and pre-053 scene compatibility in `src/engine/origin-opacity.test.ts` and `src/test/registry.test.ts`
      covers: R1@1, R3@1, R4@1, R5@1
      kind: test
      changes: src/engine/origin-opacity.test.ts (+217 -0)
- [x] T006 [agent] [status:done] Compact `origin` (`{ x, y }`, `[x, y]`, and named anchors) and `opacity` expansion tests in `src/service/compact/expand.test.ts`
      covers: R2@1, R3@1
      kind: test
      changes: src/service/compact/expand.test.ts (+100 -0)
