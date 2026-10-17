- [x] T001 [agent] [status:done] Pure layer reordering, lock, and visibility functions in src/engine/layers.ts
      covers: D4@1, D5@1, R4@1, R5@1
      changes: src/engine/layers.ts (+172 -0)
- [x] T002 [agent] [status:done] Unit tests for pure layer manipulation in src/engine/layers.test.ts
      covers: D4@1, D5@1, R4@1, R5@1
      kind: test
      changes: src/engine/layers.test.ts (+147 -0)
- [x] T003 [agent] [status:done] Update Element model and schema with optional hidden and locked properties
      covers: D4@1, R4@1
      changes: src/components/descriptor.ts (+4 -0), src/engine/layers.test.ts (+19 -56), src/model/element-schema.ts (+2 -0)
- [x] T004 [agent] [status:done] Update render.ts to skip hidden elements and stage.tsx to ignore locked elements
      covers: D4@1, R4@1
      changes: src/editor/stage.tsx (+2 -1), src/engine/geometry.ts (+1 -1), src/engine/render.ts (+2 -0)
- [x] T005 [agent] [status:done] Create LayersPanel component with layer rows, selection, icons, and reordering
      covers: D1@1, D2@1, D3@1, D5@1, D6@1, R1@1, R2@1, R3@1, R5@1, R6@1
      changes: src/editor/layers-panel.tsx (+287 -0)
- [x] T006 [agent] [status:done] Add layers panel styling and sidebar tab headers in src/styles.css
      covers: D1@1, D2@1, R1@1, R2@1
      changes: src/styles.css (+181 -0)
- [x] T007 [agent] [status:done] Integrate LayersPanel into left sidebar of src/editor/app.tsx with tab switcher
      covers: D1@1, D3@1, R1@1, R3@1
      changes: src/editor/app.tsx (+46 -12)
- [x] T008 [agent] [status:done] End-to-end unit tests covering layer visibility, locking, reordering, and group nesting
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/engine/layers.test.ts (+82 -3)
