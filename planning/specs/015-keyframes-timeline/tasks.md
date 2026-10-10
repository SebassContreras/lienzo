# 015 — keyframes-timeline — Tasks

- [x] T001 [agent] [status:done] `tracks` on every element (optional, `{}` by default); track paths: animatable fields, whole numbers included, plus `@rotate` and `@scale`
      covers: D5@1
      changes: src/components/descriptor.ts (+11 -2), src/model/element-schema.ts (+2 -0), src/model/track.ts (+28 -0), src/test/legacy-schema.ts (+7 -0)
- [x] T002 [agent] [status:done] `src/engine/tracks.ts`: evaluation (easing per segment, RGB colors, whole-number steps, hold) and keyframe set, move, delete and `writeAt`
      covers: D6@1
      changes: src/engine/paint.ts (+8 -2), src/engine/tracks.ts (+184 -0)
- [x] T003 [agent] [status:done] Tracks applied in `animate` before the preset animation; channels added to the transform
      covers: D6@1, A24@1
      changes: src/engine/animate.ts (+12 -4), src/engine/particle-sprite.ts (+5 -1)
- [x] T004 [agent] [status:done] Inspector: values at the playhead, writes through `writeAt`, keyframe button per animatable field, undoable
      covers: D7@1
      changes: src/editor/app.tsx (+23 -10), src/editor/field-editor.tsx (+56 -11), src/editor/inspector.tsx (+4 -1), src/editor/keyframe-controls.tsx (+83 -0), src/editor/layout.ts (+9 -7), src/editor/stage.tsx (+31 -5), src/engine/tracks.ts (+33 -6), src/styles.css (+25 -0)
- [x] T005 [agent] [status:done] Timeline panel: selected element's tracks, select and seek, drag, delete, easing
      covers: D8@1
      changes: src/editor/app.tsx (+20 -0), src/editor/timeline/tracks-panel.tsx (+182 -0), src/styles.css (+66 -1)
- [x] T006 [agent] [status:done] Example scene: arrow selecting three squares that turn blue and stay
      covers: D9@1
      changes: scenes/ejemplo-keyframes.json (+433 -0)
- [x] T007 [agent] [status:done] Test: interpolation, easing per segment, colors, whole-number steps, hold, off-canvas positions, channels, coexistence with preset animations, `writeAt`, old scenes read, example scene valid
      covers: R1@2, R2@2, R3@1, R5@2, R6@1, R7@1
      kind: test
      changes: src/engine/tracks.test.ts (+231 -0)
- [x] T008 [agent] [status:done] Test in the browser: build the example from scratch with the keyframe buttons and the timeline, undo a keyframe edit
      covers: R4@2, R5@2, R7@1, R8@1, R9@1
      kind: test
      changes: AGENTS.md (+9 -4), src/editor/timeline/tracks-panel.tsx (+3 -0)
