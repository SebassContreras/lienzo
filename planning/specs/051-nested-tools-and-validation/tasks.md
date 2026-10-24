# 051 — nested-tools-and-validation — Tasks

- [x] T001 [agent] [status:done] Pure element tree lookup and immutable transformation helpers (`findElement`, `updateElement`, `updateSiblings`, `insertChild`) in `src/service/element-tree.ts`
      covers: D1@1
      changes: src/service/element-tree.ts (+172 -0)
- [x] T002 [agent] [status:done] Kind-directed validation in `CompactElementSchema` (`src/model/compact.ts`) reporting deepest field paths and missing/unknown `kind` errors
      covers: D4@1
      changes: src/model/compact.ts (+116 -42)
- [x] T003 [agent] [status:done] Wire nested target resolution (`id` and slash path) into `element_update`, `element_remove`, `element_move`, `keyframe_set`, `keyframe_remove` and `image_trim`
      covers: D2@1
      changes: src/service/tools/element-move.ts (+17 -13), src/service/tools/element-remove.ts (+19 -17), src/service/tools/element-update.ts (+13 -14), src/service/tools/image-trim.ts (+10 -9), src/service/tools/keyframe-remove.ts (+18 -17), src/service/tools/keyframe-set.ts (+21 -19)
- [x] T004 [agent] [status:done] Add optional `parent` parameter to `element_add` to insert new elements into a target `group`
      covers: D3@1
      changes: src/service/scenes.ts (+0 -7), src/service/tools/element-add.ts (+25 -5)
- [x] T005 [agent] [status:done] Unit tests for `element-tree.ts` and `CompactElementSchema` deep validation and missing/unknown `kind` paths
      covers: R1@1, R3@1, R4@1
      kind: test
      changes: src/model/compact.test.ts (+48 -0), src/service/element-tree.test.ts (+138 -0)
- [x] T006 [agent] [status:done] Integration tests for nested element and keyframe tools and `element_add` with `parent` in `src/service/service.test.ts`
      covers: R1@1, R2@1
      kind: test
      changes: src/service/element-tree.test.ts (+1 -1), src/service/service.test.ts (+120 -0), src/service/tools/image-trim.test.ts (+37 -0)
