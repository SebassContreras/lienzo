# 058 — compact-effects-and-defaults — Tasks

- [x] T001 [agent] [status:done] Accept `effects` on compact elements as a loose object whose known keys are type-checked (`src/model/compact.ts`)
      covers: D1@1
      changes: src/model/compact.ts (+19 -0), schemas/compact-scene.json (regenerated)
- [x] T002 [agent] [status:done] Export `defaultEffects` and implement pure `expandEffects`, which merges known keys over the base effects and returns a notice per unknown key (`src/components/fields/effects.ts`, `src/service/compact/effects.ts`)
      covers: D2@1
      changes: src/components/fields/effects.ts (+1 -1), src/service/compact/effects.ts (+28 -0)
- [x] T003 [agent] [status:done] Pass an `ExpandState` with notices and element paths through `buildElement` (groups, symbols, templates), return `{ scene, notices }` from `expandScene`, and add `notices` to the `scene_build` output (`src/service/compact/expand.ts`, `src/service/tools/scene-build.ts`)
      covers: D2@1, D3@1
      changes: src/service/compact/expand.ts (+59 -17), src/service/tools/scene-build.ts (+9 -2), src/service/compact/expand.test.ts (+17 -17), src/model/symbols-schema.test.ts (+1 -1), src/service/text-layout.test.ts (+2 -2)
- [x] T004 [agent] [status:done] Add `defaults: "flat"` to `CompactSceneSchema` and the generated JSON schema, and describe it in `scene_build` (`src/model/compact.ts`, `src/service/tools/scene-build.ts`)
      covers: D4@1
      changes: src/model/compact.ts, src/service/tools/scene-build.ts
- [x] T005 [agent] [status:done] Export `SHAPE_KINDS` and implement `applySceneDefaults` with `FLAT_SHAPE_PATCH`: applied after `defaultElement` and before overrides, skipped for presets, passed down through `ExpandState` (`src/components/rect/descriptor.ts`, `src/service/compact/defaults.ts`, `src/service/compact/expand.ts`)
      covers: D5@1
      changes: src/components/rect/descriptor.ts (+9 -0), src/service/compact/defaults.ts (+22 -0), src/service/compact/expand.ts
- [x] T006 [agent] [status:done] Extract `writeExport` from `scene_export` into `src/service/exports.ts` and use it in `scene_export` with no change in behavior
      covers: D6@1
      changes: src/service/exports.ts (+29 -0), src/service/tools/scene-export.ts (+7 -22)
- [x] T007 [agent] [status:done] Add `out` to `scene_preview`, write the PNG through `writeExport` and return `file`; add an optional `file` to `ImageResult` and send it as a second text content in MCP (`src/service/tools/scene-preview.ts`, `src/service/image.ts`, `src/mcp/server.ts`)
      covers: D6@1, D7@1
      changes: src/service/tools/scene-preview.ts (+9 -2), src/service/image.ts (+3 -1), src/mcp/server.ts (+12 -4)
- [x] T008 [agent] [status:done] Test compact effects (`src/service/compact/effects.test.ts`, `src/service/compact/expand.test.ts`):
      - regression: a compact `rect` with `effects: { blur: 6 }` keeps `blur: 6`, with default `blend` and `mask`, after `scene_build` (fails before T001)
      - an unknown effect key is dropped and yields a notice with its path, including inside a group
      - a non-number `blur` fails with its path
      - every common canonical key (`effects`, `origin`, `w`, `shot`, `tracks`, `animPreset`) is accepted by the compact schema
      covers: R1@1
      kind: test
      changes: src/service/compact/effects.test.ts (+78 -0), src/service/service.test.ts
- [x] T009 [agent] [status:done] Test flat defaults (`src/service/compact/defaults.test.ts`):
      - `defaults: "flat"` gives a `rect` no gradient, no shadow and border width 0
      - an explicit `shadow.enabled: true` on the element wins
      - `text` and preset-built elements are unchanged
      - group children get the flat values
      - without `defaults`, shapes keep today's values
      covers: R2@1
      kind: test
      changes: src/service/compact/defaults.test.ts (+92 -0)
- [x] T010 [agent] [status:done] Test that every registered kind built from `shapeFields` is in `SHAPE_KINDS` (`src/components/rect/shape-kinds.test.ts`)
      covers: D5@1
      kind: test
      changes: src/components/rect/shape-kinds.test.ts (+15 -0)
- [x] T011 [agent] [status:done] Test `scene_preview` output with `fakeRenderer()` (`src/service/service.test.ts`, `src/mcp/server.test.ts`):
      - with `out`, it writes the PNG under `projects/<slug>/exports/` and returns `file`
      - `out: "../x.png"` fails with `out_of_project` and writes nothing
      - without `out`, nothing is written
      - MCP returns the image first, then a `{file}` text
      covers: R3@1
      kind: test
      changes: src/service/service.test.ts (+58 -0), src/mcp/server.test.ts (+12 -0)
- [x] T012 [agent] [status:done] Regression test that, after the `writeExport` extraction, `scene_export` still writes to the same path with the real extension and rejects escapes (`src/service/exports.test.ts`)
      covers: D6@1
      kind: test
      changes: src/service/exports.test.ts (+42 -0)
