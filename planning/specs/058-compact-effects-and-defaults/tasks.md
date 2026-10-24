# 058 — compact-effects-and-defaults — Tasks

- [ ] T001 [agent] [status:todo] Accept `effects` on compact elements as a loose object whose known keys are type-checked (`src/model/compact.ts`)
      covers: D1@1
- [ ] T002 [agent] [status:todo] Export `defaultEffects` and implement pure `expandEffects`, which merges known keys over the base effects and returns a notice per unknown key (`src/components/fields/effects.ts`, `src/service/compact/effects.ts`)
      covers: D2@1
- [ ] T003 [agent] [status:todo] Pass an `ExpandState` with notices and element paths through `buildElement` (groups, symbols, templates), return `{ scene, notices }` from `expandScene`, and add `notices` to the `scene_build` output (`src/service/compact/expand.ts`, `src/service/tools/scene-build.ts`)
      covers: D2@1, D3@1
- [ ] T004 [agent] [status:todo] Add `defaults: "flat"` to `CompactSceneSchema` and the generated JSON schema, and describe it in `scene_build` (`src/model/compact.ts`, `src/service/tools/scene-build.ts`)
      covers: D4@1
- [ ] T005 [agent] [status:todo] Export `SHAPE_KINDS` and implement `applySceneDefaults` with `FLAT_SHAPE_PATCH`: applied after `defaultElement` and before overrides, skipped for presets, passed down through `ExpandState` (`src/components/rect/descriptor.ts`, `src/service/compact/defaults.ts`, `src/service/compact/expand.ts`)
      covers: D5@1
- [ ] T006 [agent] [status:todo] Extract `writeExport` from `scene_export` into `src/service/exports.ts` and use it in `scene_export` with no change in behavior
      covers: D6@1
- [ ] T007 [agent] [status:todo] Add `out` to `scene_preview`, write the PNG through `writeExport` and return `file`; add an optional `file` to `ImageResult` and send it as a second text content in MCP (`src/service/tools/scene-preview.ts`, `src/service/image.ts`, `src/mcp/server.ts`)
      covers: D6@1, D7@1
- [ ] T008 [agent] [status:todo] Test compact effects (`src/service/compact/effects.test.ts`, `src/service/compact/expand.test.ts`):
      - regression: a compact `rect` with `effects: { blur: 6 }` keeps `blur: 6`, with default `blend` and `mask`, after `scene_build` (fails before T001)
      - an unknown effect key is dropped and yields a notice with its path, including inside a group
      - a non-number `blur` fails with its path
      - every common canonical key (`effects`, `origin`, `w`, `shot`, `tracks`, `animPreset`) is accepted by the compact schema
      covers: R1@1
      kind: test
- [ ] T009 [agent] [status:todo] Test flat defaults (`src/service/compact/defaults.test.ts`):
      - `defaults: "flat"` gives a `rect` no gradient, no shadow and border width 0
      - an explicit `shadow.enabled: true` on the element wins
      - `text` and preset-built elements are unchanged
      - group children get the flat values
      - without `defaults`, shapes keep today's values
      covers: R2@1
      kind: test
- [ ] T010 [agent] [status:todo] Test that every registered kind built from `shapeFields` is in `SHAPE_KINDS` (`src/components/rect/shape-kinds.test.ts`)
      covers: D5@1
      kind: test
- [ ] T011 [agent] [status:todo] Test `scene_preview` output with `fakeRenderer()` (`src/service/service.test.ts`, `src/mcp/server.test.ts`):
      - with `out`, it writes the PNG under `projects/<slug>/exports/` and returns `file`
      - `out: "../x.png"` fails with `out_of_project` and writes nothing
      - without `out`, nothing is written
      - MCP returns the image first, then a `{file}` text
      covers: R3@1
      kind: test
- [ ] T012 [agent] [status:todo] Regression test that, after the `writeExport` extraction, `scene_export` still writes to the same path with the real extension and rejects escapes (`src/service/exports.test.ts`)
      covers: D6@1
      kind: test
