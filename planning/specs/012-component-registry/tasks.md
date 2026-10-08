# 012 — component-registry — Tasks

- [x] T001 [agent] [status:done] Shared field groups (box, fill, stroke, glow, shadow, label, anim)
      covers: D1@1, A23@1
      changes: src/components/fields/anim.ts (+78 -0), src/components/fields/box.ts (+30 -0), src/components/fields/field.ts (+270 -0), src/components/fields/fill.ts (+38 -0), src/components/fields/glow.ts (+35 -0), src/components/fields/index.ts (+8 -0), src/components/fields/label.ts (+59 -0), src/components/fields/shadow.ts (+41 -0), src/components/fields/stroke.ts (+64 -0), src/model/fonts.ts (+9 -0), src/model/model.ts (+1 -8)
- [x] T002 [agent] [status:done] Descriptor type and the component registry
      covers: D1@1, A23@1
      changes: src/components/descriptor.ts (+80 -0), src/components/index.ts (+52 -0), src/model/id.ts (+4 -0), src/model/model.ts (+3 -3)
- [x] T003 [agent] [status:done] Descriptor for rect
      covers: D1@1
      changes: src/components/ellipse.ts (+7 -2), src/components/index.ts (+2 -1), src/components/rect/descriptor.ts (+101 -0), src/components/rect.ts → src/components/rect/draw.ts (+9 -9), src/engine/render.ts (+3 -2)
- [ ] T004 [agent] [status:todo] Descriptor for ellipse
      covers: D1@1
- [ ] T005 [agent] [status:todo] Descriptor for icon
      covers: D1@1
- [ ] T006 [agent] [status:todo] Descriptor for image
      covers: D1@1
- [ ] T007 [agent] [status:todo] Descriptor for text
      covers: D1@1
- [ ] T008 [agent] [status:todo] Descriptor for line
      covers: D1@1
- [ ] T009 [agent] [status:todo] Descriptor for group
      covers: D1@1
- [ ] T010 [agent] [status:todo] Descriptor for particles
      covers: D1@1
- [ ] T011 [agent] [status:todo] Scene schema and element types generated from the descriptors
      covers: D2@1
- [ ] T012 [agent] [status:todo] `animate(el, t, scene)` layer and the new draw signature
      covers: D4@1, A24@1
- [ ] T013 [agent] [status:todo] Generic inspector (`FieldEditor`) with custom widgets
      covers: D3@1
- [ ] T014 [agent] [status:todo] Remove the hand-written per-kind inspectors
      covers: D3@1
- [ ] T015 [agent] [status:todo] Test: old scenes, built-in presets and the demo validate the same; every field of every kind is editable; the demo renders pixel-identical
      covers: R1@1, R2@1, R3@1, R4@1, R6@1
      kind: test
- [ ] T016 [agent] [status:todo] AGENTS.md: "To add a component" becomes "add a descriptor folder"
      covers: R5@1
- [ ] T017 [agent] [status:todo] Revise A5 (one file per component) to the descriptor folders of A23 through the spectrace-change flow, re-pointing the tasks that cover A5
      covers: D1@1, A5@1, A23@1
