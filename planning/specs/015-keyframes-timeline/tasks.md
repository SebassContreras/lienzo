# 015 — keyframes-timeline — Tasks

- [ ] T001 [agent] [status:todo] `tracks` on every element (optional, `{}` by default); track paths: animatable fields, whole numbers included, plus `@rotate` and `@scale`
      covers: D5@1
- [ ] T002 [agent] [status:todo] `src/engine/tracks.ts`: evaluation (easing per segment, RGB colors, whole-number steps, hold) and keyframe set, move, delete and `writeAt`
      covers: D6@1
- [ ] T003 [agent] [status:todo] Tracks applied in `animate` before the preset animation; channels added to the transform
      covers: D6@1, A24@1
- [ ] T004 [agent] [status:todo] Inspector: values at the playhead, writes through `writeAt`, keyframe button per animatable field, undoable
      covers: D7@1
- [ ] T005 [agent] [status:todo] Timeline panel: selected element's tracks, select and seek, drag, delete, easing
      covers: D8@1
- [ ] T006 [agent] [status:todo] Example scene: arrow selecting three squares that turn blue and stay
      covers: D9@1
- [ ] T007 [agent] [status:todo] Test: interpolation, easing per segment, colors, whole-number steps, hold, off-canvas positions, channels, coexistence with preset animations, `writeAt`, old scenes read, example scene valid
      covers: R1@2, R2@2, R3@1, R5@2, R6@1, R7@1
      kind: test
- [ ] T008 [agent] [status:todo] Test in the browser: build the example from scratch with the keyframe buttons and the timeline, undo a keyframe edit
      covers: R4@2, R5@2, R7@1, R8@1, R9@1
      kind: test
