# 018 — more-animations — Tasks

- [x] T001 [agent] [status:done] Move the kinds into the `src/animations/` registry by family; `anim.ts` keeps the composition
      covers: D6@1, A24@1
      changes: src/animations/attention.ts (+27 -0), src/animations/index.ts (+17 -0), src/animations/kind.ts (+31 -0), src/animations/motion.ts (+29 -0), src/components/fields/anim.ts (+28 -24), src/engine/anim.ts (+9 -57)
- [x] T002 [agent] [status:done] Rotation, skew and per-axis scale in `AnimState` and `withTransform`
      covers: D7@1
      changes: src/animations/kind.ts (+22 -0), src/engine/anim.test.ts (+2 -1), src/engine/anim.ts (+8 -9), src/engine/paint.ts (+17 -2)
- [x] T003 [agent] [status:done] Attention animations
      covers: D6@1
      changes: src/animations/attention.ts (+114 -8), src/animations/kind.ts (+24 -2), src/components/descriptor.ts (+2 -2), src/components/fields/anim.ts (+80 -40), src/components/line/descriptor.ts (+5 -2), src/components/particles/descriptor.ts (+5 -7), src/model/model.ts (+0 -5), src/test/golden-scenes.ts (+25 -3), src/test/legacy-schema.ts (+2 -2), src/test/registry.test.ts (+2 -1)
- [x] T004 [agent] [status:done] Entrance animations with direction; exits reuse them
      covers: D6@1
      changes: src/animations/index.ts (+6 -5), src/animations/motion.ts (+77 -4), src/engine/anim.ts (+18 -3)
- [x] T005 [agent] [status:done] Highlight glow
      covers: D6@1
      changes: src/animations/emphasis.ts (+20 -0), src/animations/index.ts (+3 -2)
- [x] T006 [agent] [status:done] Text reveal by char, word or line, and typewriter
      covers: D8@1
      changes: src/animations/index.ts (+5 -2), src/animations/kind.ts (+10 -0), src/animations/text.ts (+19 -0), src/components/fields/anim.ts (+14 -3), src/components/text/descriptor.ts (+3 -3), src/components/text/draw.ts (+18 -2), src/components/text/reveal.ts (+48 -0), src/engine/anim.test.ts (+4 -1), src/engine/anim.ts (+3 -0), src/model/model.ts (+0 -1)
- [x] T007 [agent] [status:done] Group stagger in `group/draw.ts`
      covers: D9@2
      changes: src/components/descriptor.ts (+1 -0), src/components/group/descriptor.ts (+14 -0), src/components/group/draw.ts (+38 -4), src/test/legacy-schema.ts (+2 -0)
- [x] T008 [agent] [status:done] Animation picker with live preview and default slots
      covers: D10@1
      changes: src/components/fields/anim.ts (+2 -0), src/components/fields/field.ts (+3 -1), src/editor/anim-picker.tsx (+163 -0), src/editor/field-editor.tsx (+24 -2), src/engine/paint.ts (+3 -2), src/styles.css (+26 -0)
- [x] T009 [agent] [status:done] Test over the whole registry: deterministic, attention kinds close their loop, entrances end at rest, exits end hidden, old kinds unchanged, stagger offsets, text reveal
      covers: R1@1, R2@1, R3@1, R5@1, R9@1, R10@1
      kind: test
      changes: src/animations/registry.test.ts (+201 -0), src/test/recording-ctx.ts (+4 -0)
- [x] T010 [agent] [status:done] Test in the browser: pick and preview animations on several kinds
      covers: R8@1
      kind: test
      changes: none
