# 013 — animation-playback — Tasks

- [x] T001 [agent] [status:done] Easing functions: CSS names, Penner families, `cubic-bezier`, kind default `auto`
      covers: D2@2, D7@1
      changes: src/engine/easing.test.ts (+50 -0), src/engine/easing.ts (+146 -0)
- [x] T002 [agent] [status:done] Timing: eased progress from delay, duration, iterations, direction and fill
      covers: D5@1, D8@1, A6@1
      changes: src/engine/timing.test.ts (+69 -0), src/engine/timing.ts (+69 -0)
- [x] T003 [agent] [status:done] `anim` field group with `in`, `loop` and `out` slots, and the old flat `anim` moved into its slot
      covers: D4@1
      changes: src/components/fields/anim.ts (+185 -22)
- [x] T004 [agent] [status:done] Kinds as functions of progress; `animState` composes the three slots, exits in reverse
      covers: D6@1, A24@1
      changes: src/engine/anim.ts (+114 -39)
- [x] T005 [agent] [status:done] Traits, demo and test scenes write the slot shape
      covers: D4@1
      changes: src/demo.ts (+26 -4), src/presets/recipes.test.ts (+6 -1), src/presets/resolve.test.ts (+6 -1), src/test/golden-scenes.ts (+8 -1), src/test/legacy-schema.ts (+7 -15), src/test/registry.test.ts (+2 -1), src/traits/breathe.ts (+12 -3), src/traits/fade-in.ts (+16 -4), src/traits/float.ts (+4 -4), src/traits/pulse.ts (+4 -4)
- [x] T006 [agent] [status:done] Inspector: slot controls and the "ends after the scene" warning
      covers: D9@1
      changes: src/components/fields/anim.ts (+2 -1), src/editor/field-editor.tsx (+15 -2), src/editor/inspector.tsx (+1 -1), src/engine/anim.ts (+12 -3)
- [x] T007 [agent] [status:done] Test: slots combine, easings, entry/exit hold, loop N and direction, loop closes at T, old scenes unchanged, warning
      covers: R1@2, R2@2, R3@2, R4@2, R5@1, R6@1
      kind: test
      changes: src/engine/anim.test.ts (+171 -32), src/engine/anim.ts (+4 -1)
