# 011 — compact-scenes — Tasks

- [x] T001 [agent] [status:done] Compact schema derived from the descriptor registry
      covers: D1@1, A23@1
      changes: src/cli/cli.test.ts (+1 -0), src/components/index.ts (+3 -0), src/model/compact.test.ts (+112 -0), src/model/compact.ts (+200 -0)
- [x] T002 [agent] [status:done] Expand size, timing, background, and elements from a preset or kind with deep-merged fields (groups, particle templates)
      covers: D2@1
      changes: src/service/compact/connections.ts (+29 -0), src/service/compact/expand.test.ts (+121 -0), src/service/compact/expand.ts (+281 -0), src/service/compact/layout.ts (+84 -0), src/service/compact/tracks.ts (+43 -0)
- [x] T003 [agent] [status:done] Short keyframe tracks and `anim` shorthand
      covers: D1@1
      changes: src/service/compact/expand.test.ts (+46 -0)
- [x] T004 [agent] [status:done] Placement: `at` anchors with offset, `fit: canvas`
      covers: D3@1
      changes: src/service/compact/expand.test.ts (+51 -0)
- [x] T005 [agent] [status:done] Readable ids and `from` / `to` line connections
      covers: D4@1
      changes: src/service/compact/expand.test.ts (+48 -0)
- [x] T006 [agent] [status:done] `scene_build` service tool with optional save
      covers: D5@1, A20@2
      changes: src/cli/cli.test.ts (+1 -0), src/service/compact/expand.test.ts (+8 -1), src/service/service.test.ts (+29 -0), src/service/tools/index.ts (+2 -0), src/service/tools/scene-build.ts (+56 -0)
- [x] T007 [agent] [status:done] Generate `schemas/compact-scene.json`; README example post
      covers: D1@1
      changes: README.md (+53 -0), schemas/compact-scene.json (+294 -0), src/model/compact.ts (+20 -2)
- [x] T008 [agent] [status:done] Test: defaults, presets with overrides, groups, templates, anchors, fit, connections, tracks; invalid input names its compact path and writes nothing; a test-only descriptor is accepted with no compact code; the README example builds
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1, R7@1, R8@1
      kind: test
      changes: src/engine/geometry.ts (+16 -5), src/service/compact/expand.test.ts (+54 -5)
- [x] T009 [agent] [status:done] `animPreset` in the compact schema, expanded through `expandAnimPresets`; test included
      covers: D6@1, R9@1
      changes: src/service/compact/expand.test.ts (+47 -0), src/service/compact/expand.ts (+12 -0), src/service/tools/scene-build.ts (+4 -0)
