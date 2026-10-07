# 004 — preset-traits — Tasks

- [x] T001 [agent] [status:done] `Trait` type, registry and the traits the 13 built-in presets need, in `src/traits/`
      covers: D1@1, A19@1
      changes: AGENTS.md (+7 -2), src/traits/bg-glow.ts (+13 -0), src/traits/border.ts (+20 -0), src/traits/breathe.ts (+16 -0), src/traits/fade-in.ts (+19 -0), src/traits/fill.ts (+19 -0), src/traits/float.ts (+16 -0), src/traits/flow.ts (+21 -0), src/traits/glass.ts (+27 -0), src/traits/glow.ts (+19 -0), src/traits/gradient-text.ts (+15 -0), src/traits/index.ts (+37 -0), src/traits/no-glow.ts (+19 -0), src/traits/no-shadow.ts (+13 -0), src/traits/pulse.ts (+16 -0), src/traits/trait.ts (+33 -0)
- [x] T002 [agent] [status:done] `PresetRecipe` type in `src/model/preset.ts`
      covers: D2@1
      changes: src/model/preset.ts (+23 -0)
- [x] T003 [agent] [status:done] `resolvePreset` in `src/presets/resolve.ts`
      covers: D3@1
      changes: src/model/model.ts (+14 -0), src/presets/resolve.ts (+68 -0)
- [x] T004 [agent] [status:done] Test: traits apply per kind with parameters; resolve order, deep merge and errors
      covers: R1@1, R2@1, R3@1, R7@1
      kind: test
      changes: src/presets/resolve.test.ts (+119 -0)
- [x] T005 [agent] [status:done] The 13 built-in presets as JSON recipes in `presets/built-in/`, with the eager loader
      covers: D4@1
      changes: presets/built-in/01-tarjeta-neon.json (+26 -0), presets/built-in/02-tarjeta-glass.json (+12 -0), presets/built-in/03-tarjeta-borde-animado.json (+27 -0), presets/built-in/04-pill.json (+29 -0), presets/built-in/05-boton-cta.json (+36 -0), presets/built-in/06-titulo.json (+9 -0), presets/built-in/07-titulo-degradado.json (+15 -0), presets/built-in/08-parrafo.json (+12 -0), presets/built-in/09-manuscrito.json (+12 -0), presets/built-in/10-pixel.json (+18 -0), presets/built-in/11-conexion-con-pulsos.json (+7 -0), presets/built-in/12-hormigas.json (+17 -0), presets/built-in/13-cometa-curvo.json (+23 -0), src/presets/recipes.ts (+15 -0)
- [x] T006 [agent] [status:done] Test: each built-in recipe resolves to the element `built-in.ts` builds today (fixture captured before removal)
      covers: R4@1
      kind: test
      changes: src/presets/built-in.fixture.json (+559 -0), src/presets/recipes.test.ts (+28 -0)
- [x] T007 [agent] [status:done] Library, demo scene and drop use resolved recipes; remove `src/presets/built-in.ts`
      covers: D3@1, D4@1
      changes: src/demo.ts (+7 -5), src/editor/app.tsx (+14 -3), src/presets/built-in.ts (+0 -220), src/presets/recipes.test.ts (+1 -1), src/presets/store.ts (+4 -2)
- [x] T008 [agent] [status:done] "Guardar como preset" writes a diff recipe; user presets load as recipes
      covers: D5@1
      changes: src/editor/app.tsx (+7 -15), src/editor/library.tsx (+10 -0), src/presets/diff.ts (+32 -0), src/presets/store.ts (+20 -7)
- [x] T009 [agent] [status:done] Broken recipes shown as disabled cards with their error
      covers: D6@1
      changes: src/editor/app.tsx (+3 -3), src/editor/library.tsx (+34 -14), src/styles.css (+22 -0)
- [x] T010 [agent] [status:done] Test: save-as-preset round trip reproduces the element; a dropped element is unaffected by later recipe changes; a new JSON recipe appears without code changes
      covers: R5@1, R6@1, R8@1
      kind: test
      changes: src/presets/round-trip.test.ts (+96 -0)
