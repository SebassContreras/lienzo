# 006 — background-presets — Tasks

- [x] T001 [agent] [status:done] `defaultBackground()`, background recipes and `apply.background` in traits and `resolvePreset`
      covers: D2@1
      changes: src/demo.ts (+2 -2), src/editor/library.tsx (+2 -2), src/model/model.ts (+16 -11), src/model/preset.ts (+7 -4), src/presets/recipes.test.ts (+2 -2), src/presets/recipes.ts (+7 -1), src/presets/resolve.test.ts (+2 -2), src/presets/resolve.ts (+43 -13), src/presets/round-trip.test.ts (+2 -2), src/traits/trait.ts (+2 -1)
- [x] T002 [agent] [status:done] Background traits and the five built-in background recipes
      covers: D5@1, A19@1
      changes: presets/built-in/fondo-01-azul-noche.json (+22 -0), presets/built-in/fondo-02-negro-liso.json (+10 -0), presets/built-in/fondo-03-degradado-violeta.json (+17 -0), presets/built-in/fondo-04-puntos-sobre-gris.json (+15 -0), presets/built-in/fondo-05-foco-central.json (+15 -0), src/presets/resolve.test.ts (+3 -1), src/presets/round-trip.test.ts (+3 -2), src/traits/dots.ts (+15 -0), src/traits/gradient.ts (+18 -0), src/traits/index.ts (+8 -0), src/traits/solid.ts (+16 -0), src/traits/spotlight.ts (+14 -0)
- [x] T003 [agent] [status:done] "Fondo" button in the header and the empty-canvas hint
      covers: D1@1
      changes: src/editor/app.tsx (+22 -1), src/editor/inspector.tsx (+18 -3), src/editor/stage.tsx (+4 -0), src/styles.css (+28 -0)
- [x] T004 [agent] [status:done] "Fondos" library section with thumbnails; applying records an undo step
      covers: D3@1
      changes: src/editor/app.tsx (+24 -3), src/editor/backgrounds.tsx (+94 -0)
- [x] T005 [agent] [status:done] "Guardar fondo como preset" writes a diff recipe
      covers: D4@1
      changes: src/editor/app.tsx (+9 -1), src/editor/inspector.tsx (+22 -0), src/presets/diff.ts (+17 -1)
- [x] T006 [agent] [status:done] Test: background recipes resolve; "Azul noche" equals today's default; save round trip; applied backgrounds are copies
      covers: R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/presets/backgrounds.test.ts (+121 -0)
- [x] T007 [agent] [status:done] Test in the browser: open "Fondo" with a full-canvas element, apply a preset, undo it
      covers: R1@1, R2@1
      kind: test
      changes: .gitignore (+1 -0), src/editor/inspector.tsx (+1 -1), src/styles.css (+7 -0)
