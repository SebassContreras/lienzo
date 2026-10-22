# 007 — service-layer — Tasks

- [x] T001 [agent] [status:done] `defineTool`, the tool registry and `ctx` in `src/service/`
      covers: D1@1, A20@2
- [x] T002 [agent] [status:done] Node store for `presets/` and `scenes/` and a built-in preset loader
      covers: D2@2
- [x] T003 [agent] [status:done] Preset tools: list, get, validate
      covers: D2@2, D4@1
- [x] T004 [agent] [status:done] Scene tools: list, get, create, validate
      covers: D2@2, D4@1
- [x] T005 [agent] [status:done] Tool to add an element from a preset or a kind, optionally at a position
      covers: D3@2, D4@1
      └─ reviewed 2026-10-22: D3@2 only adds `at` to update and the coordinate convention to descriptions; adding still holds
- [x] T006 [agent] [status:done] Tools to update (deep patch), remove and move an element in the layer order
      covers: D3@2, D4@1
      └─ reviewed 2026-10-22: the patch, remove and move still hold; `at` on update is added by T013
- [x] T007 [agent] [status:done] Tool to set the scene background from a preset or values
      covers: D3@2, D4@1
      └─ reviewed 2026-10-22: background tools are untouched by D3@2
- [x] T008 [agent] [status:done] Test: every tool against a temp dir; invalid writes return the failing path and write nothing; written scenes parse as editor scenes
      covers: R1@1, R2@1, R3@2, R4@1, R5@1
      kind: test
      └─ reviewed 2026-10-22: its checks still hold under R3@2; re-centring on update is tested by T015
- [x] T009 [agent] [status:done] Element and keyframe tool inputs derived from the descriptor registry
      covers: D5@1, A23@1
- [x] T010 [agent] [status:done] Test: a test-only descriptor is usable from every element tool with no tool change; keyframes added through the tools play in the scene
      covers: R6@1
      kind: test
- [x] T011 [agent] [status:done] Expand `animPreset` names through `expandAnimPresets` before validating and writing; test that an unknown name is reported
      covers: D6@1, R7@1

- [x] T012 [agent] [status:done] Extract the file operations of `json-store.ts` into shared `fs` functions used by the Vite middleware
      covers: D2@2
      └─ do before T002
- [x] T013 [agent] [status:done] `at` on `element_update`: re-centre the patched element on a point with `centerOn`
      covers: D3@2
      changes: src/service/tools/element-update.ts (+8 -2)
- [x] T014 [agent] [status:done] Element tool descriptions state that `x, y` is the box's top-left and that a text's `align` works inside its own box
      covers: D3@2
      changes: src/service/elements.ts (+6 -0), src/service/tools/component-list.ts (+3 -1), src/service/tools/element-add.ts (+8 -3), src/service/tools/element-update.ts (+4 -2)
- [x] T015 [agent] [status:done] Test: `element_update` with `at` puts the centre of a text's box on the point; without `at` the position is kept
      covers: R3@2
      kind: test
      changes: src/service/service.test.ts (+34 -0)
