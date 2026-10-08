# 005 — particles — Tasks

- [x] T001 [agent] [status:done] `ParticlesEl` type, `defaultParticles()` and its allowed animations
      covers: D1@1, D4@1
      changes: src/engine/render.ts (+1 -1), src/model/model.ts (+50 -1), src/model/schema.ts (+20 -0), src/traits/trait.ts (+2 -0)
- [x] T002 [agent] [status:done] Seeded particle field and closed-loop positions in `src/engine/particle-field.ts`
      covers: D2@1
      changes: src/engine/particle-field.ts (+95 -0)
- [x] T003 [agent] [status:done] Particles draw function with distance-faded links, and its render case
      covers: D1@1, D3@1, A5@1
      changes: src/components/particles.ts (+76 -0), src/engine/render.ts (+2 -0)
- [x] T004 [agent] [status:done] Stage and geometry: select, move and resize particles by their box
      covers: D5@1
      changes: src/engine/particles-geometry.test.ts (+33 -0)
- [x] T005 [agent] [status:done] Inspector section "Partículas" with "Redistribuir" and "Ajustar al lienzo"; "Partículas" in the library basics
      covers: D4@1, D6@1
      changes: src/editor/app.tsx (+4 -1), src/editor/inspector.tsx (+193 -0)
- [x] T006 [agent] [status:done] Particle traits and the built-in recipes "Constelación", "Polvo flotante", "Red densa"
      covers: D6@1, A19@1
      changes: presets/built-in/18-constelacion.json (+32 -0), presets/built-in/19-polvo-flotante.json (+31 -0), presets/built-in/20-red-densa.json (+38 -0), src/presets/resolve.test.ts (+1 -0), src/traits/breathe.ts (+3 -0), src/traits/fade-in.ts (+3 -0), src/traits/glow.ts (+4 -1), src/traits/no-glow.ts (+4 -1)
- [x] T007 [agent] [status:done] Test: positions at t = 0 and t = T match, same seed gives same field, points stay in the box, link alpha fades with distance
      covers: R1@1, R4@1
      kind: test
      changes: src/engine/particle-field.test.ts (+75 -0)
- [ ] T008 [agent] [status:todo] Test in the browser: edit every field, fit to canvas, layer it under a card, play 300 points at the scene fps, drop each preset
      covers: R2@1, R3@1, R5@1, R6@1, R7@1
      kind: test
