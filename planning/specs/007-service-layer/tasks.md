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
      covers: D3@1, D4@1
- [x] T006 [agent] [status:done] Tools to update (deep patch), remove and move an element in the layer order
      covers: D3@1, D4@1
- [x] T007 [agent] [status:done] Tool to set the scene background from a preset or values
      covers: D3@1, D4@1
- [x] T008 [agent] [status:done] Test: every tool against a temp dir; invalid writes return the failing path and write nothing; written scenes parse as editor scenes
      covers: R1@1, R2@1, R3@1, R4@1, R5@1
      kind: test
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
