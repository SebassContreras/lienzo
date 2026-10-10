# 014 — particle-template — Tasks

- [x] T001 [agent] [status:done] `template` field on particles: local ids, no nested particles; the default dot when empty
      covers: D1@2
      changes: src/components/particles/descriptor.ts (+36 -1)
- [x] T002 [agent] [status:done] Sprite cache: draw the template once (with hue variants) and each point with `drawImage`
      covers: D5@1
      changes: src/components/particles/draw.ts (+23 -3), src/engine/particle-sprite.ts (+125 -0)
- [x] T003 [agent] [status:done] `variation` field group: seeded size, rotation, spin, opacity and hue shift, for template and dot
      covers: D2@2, A6@1
      changes: src/components/particles/descriptor.ts (+50 -2), src/components/particles/draw.ts (+67 -22), src/engine/particle-field.ts (+66 -0), src/engine/particle-sprite.ts (+62 -18), src/test/legacy-schema.ts (+6 -2)
- [x] T004 [agent] [status:done] "Usar como partícula" and "Editar partícula" actions; hide the dot section when a template is set
      covers: D6@1, D7@1
      changes: src/components/particles/descriptor.ts (+8 -2), src/editor/app.tsx (+60 -0), src/editor/field-editor.tsx (+40 -1), src/editor/inspector.tsx (+14 -1)
- [x] T005 [agent] [status:done] Built-in presets: sparks, floating icons
      covers: D4@1, A19@1
      changes: presets/built-in/21-chispas.json (+50 -0), presets/built-in/22-iconos-flotantes.json (+44 -0), src/presets/diff.ts (+10 -1), src/presets/resolve.ts (+7 -1), src/presets/round-trip.test.ts (+1 -0)
- [x] T006 [agent] [status:done] Test: same seed gives the same field, loop closes, a template group draws, nested particles rejected, old particle scenes match a pixel snapshot
      covers: R1@2, R2@2, R4@1
      kind: test
      changes: src/engine/particle-template.test.ts (+96 -0), src/test/recording-ctx.ts (+18 -1), src/test/render.golden.json (+4 -4)
- [ ] T007 [agent] [status:todo] Test in the browser: use an element as particle and edit it back, 300 particles at the scene fps, drop each preset
      covers: R3@2, R5@1, R6@1
      kind: test
