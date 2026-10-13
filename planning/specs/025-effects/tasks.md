# 025 — effects — Tasks

- [x] T001 [agent] [status:done] `effects` field group with blur and blend, applied by `drawScene`
      covers: D1@1, D3@1, A23@1
      changes: src/components/fields/effects.ts (+65 -0), src/components/fields/index.ts (+1 -0), src/engine/effects.test.ts (+79 -0), src/engine/effects.ts (+48 -0), src/engine/render.ts (+4 -1), src/test/recording-ctx.ts (+2 -0)
- [x] T002 [agent] [status:done] `mask` field: clip through `clip.ts`, mask element not drawn, cleared when its target is deleted
      covers: D2@1
      changes: src/components/fields/effects.ts (+9 -2), src/editor/app.tsx (+19 -8), src/editor/field-editor.tsx (+28 -0), src/engine/clip.ts (+113 -0), src/engine/effects.test.ts (+38 -0), src/engine/render.ts (+27 -3), src/service/tools/element-remove.ts (+16 -1)
- [x] T003 [agent] [status:done] Test: blur, blend and mask apply to every registered kind and to a test-only descriptor; a deleted mask target leaves a valid scene
      covers: R1@1, R2@1, R3@1
      kind: test
      changes: src/components/descriptor.ts (+2 -0), src/engine/effects.test.ts (+86 -0), src/model/element-schema.ts (+4 -0)
