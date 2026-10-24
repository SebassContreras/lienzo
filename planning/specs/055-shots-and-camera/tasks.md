# 055 — shots-and-camera — Tasks

- [x] T001 [agent] [status:done] Define Shot, ShotTransition, and ShotCamera schemas in `src/model/schema.ts`, add `shots?: Shot[]` to `Scene` (`src/model/model.ts`) and `SceneSchema`, and add optional `shot?: string` to `ElementOf` (`src/components/descriptor.ts`), `ElementSchema` (`src/model/element-schema.ts`), and `CompactElementSchema` (`src/model/compact.ts`)
      covers: D1@1
      changes: src/components/descriptor.ts (+2 -0), src/model/compact.ts (+1 -0), src/model/element-schema.ts (+1 -0), src/model/model.ts (+24 -0), src/model/schema.ts (+24 -0)
- [x] T002 [agent] [status:done] Implement active shot time-window gating and 2D camera view transformation (`translate`, `scale` around stage center with transition interpolation and camera tracks) in `drawElements` (`src/engine/render.ts`)
      covers: D2@1
      changes: src/engine/render.ts (+36 -12), src/engine/shots.ts (+104 -0)
- [x] T003 [agent] [status:done] Create `shot_set` service tool in `src/service/tools/shot-set.ts` (and register in `src/service/tools/index.ts`) for adding, updating, or deleting shots and camera configs in a scene
      covers: D3@1
      changes: src/service/tools/index.ts (+2 -0), src/service/tools/shot-set.ts (+116 -0)
- [x] T004 [agent] [status:done] Support compact scene `shots` parsing in `CompactSceneSchema` (`src/model/compact.ts`) and expand shots into canonical scene format in `expandScene` (`src/service/compact/expand.ts`)
      covers: D3@1
      changes: src/model/compact.ts (+25 -0), src/service/compact/expand.ts (+23 -0)
- [x] T005 [agent] [status:done] Add visual shot block markers along the timeline scrub bar in `EditorFooter` (`src/editor/footer/editor-footer.tsx`)
      covers: D3@1
      changes: src/editor/footer/editor-footer.tsx (+57 -10)
- [x] T006 [agent] [status:done] Resolve compact `at` placement on nested group children relative to parent group bounds (`cw × ch`) in `resolveAtPlacement` (`src/service/compact/layout.ts`)
      covers: D4@1
      changes: src/service/compact/expand.ts (+28 -14), src/service/compact/layout.ts (+2 -2)
- [x] T007 [agent] [status:done] Filter zero-opacity and off-shot inactive elements in `placedElementsAt` (`src/service/layout.ts`), and attach `shot` property to diagnostics in `inspectLayout` (`src/service/tools/scene-inspect-layout.ts`)
      covers: D5@1
      changes: src/service/layout.ts (+21 -1), src/service/tools/scene-inspect-layout.ts (+1 -0)
- [x] T008 [agent] [status:done] Add element search filter, collapsible shot grouping, and selection auto-scroll reveal in `LayersPanel` (`src/editor/layers-panel.tsx`)
      covers: D6@1
      changes: src/editor/layers-panel.tsx (+146 -8)
- [x] T009 [agent] [status:done] Unit and integration tests for shot rendering, camera transform math, shot time windowing, and `shot_set` tool in `src/service/shots.test.ts`
      covers: R1@1, R2@1, R3@1
      kind: test
      changes: src/service/shots.test.ts (+203 -0), src/service/tools/shot-set.ts (+8 -9)
- [x] T010 [agent] [status:done] Tests for nested group `at` positioning and compact shots expansion in `src/service/compact/expand.test.ts`
      covers: R3@1, R4@1
      kind: test
      changes: src/service/compact/expand.test.ts (+107 -0)
- [x] T011 [agent] [status:done] Tests for `scene_inspect_layout` inactive element skipping and shot tagging in `src/service/layout.test.ts`
      covers: R5@1
      kind: test
      changes: src/service/layout.test.ts (+109 -0), src/service/layout.ts (+16 -1)
- [x] T012 [agent] [status:done] Component tests for LayersPanel search filter, shot collapse/expand, and selection auto-scroll in `src/editor/layers-panel.test.tsx`
      covers: R6@1
      kind: test
      changes: src/editor/layers-panel.test.tsx (+129 -0)
