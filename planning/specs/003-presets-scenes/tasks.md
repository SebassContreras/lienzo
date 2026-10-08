# 003 — presets-scenes — Tasks

- [x] T001 [agent] [status:done] Zod schemas for Scene and Preset
      covers: D4@2
      changes: package.json (+2 -1), pnpm-lock.yaml (+8 -0), src/model/schema.ts (+276 -0)
- [x] T002 [agent] [status:done] Delete and rename routes in the JSON middleware
      covers: D1@2, A7@3
      changes: src/presets/json-store.ts (+85 -0), src/presets/store.ts (+33 -0), vite.config.ts (+15 -33)
      └─ reviewed 2026-10-08: A7@3 only adds 3D models to what `assets/` holds; this work still holds
- [x] T003 [agent] [status:done] Preset actions in the library: rename, overwrite, delete
      covers: D1@2
      changes: src/editor/app.tsx (+76 -20), src/editor/backgrounds.tsx (+56 -34), src/editor/library.tsx (+128 -43), src/presets/store.ts (+17 -6), src/styles.css (+17 -0)
- [x] T004 [agent] [status:done] Preset categories and name filter
      covers: D2@2
      changes: presets/built-in/01-tarjeta-neon.json (+1 -0), presets/built-in/02-tarjeta-glass.json (+1 -0), presets/built-in/03-tarjeta-borde-animado.json (+1 -0), presets/built-in/04-pill.json (+1 -0), presets/built-in/05-boton-cta.json (+1 -0), presets/built-in/06-titulo.json (+1 -0), presets/built-in/07-titulo-degradado.json (+1 -0), presets/built-in/08-parrafo.json (+1 -0), presets/built-in/09-manuscrito.json (+1 -0), presets/built-in/10-pixel.json (+1 -0), presets/built-in/11-conexion-con-pulsos.json (+1 -0), presets/built-in/12-hormigas.json (+1 -0), presets/built-in/13-cometa-curvo.json (+1 -0), presets/built-in/14-tarjeta-con-icono.json (+1 -0), presets/built-in/15-icono-con-fondo.json (+1 -0), presets/built-in/16-avatar-circular.json (+1 -0), presets/built-in/17-logo-imagen.json (+1 -0), src/editor/app.tsx (+68 -15), src/editor/backgrounds.tsx (+23 -16), src/editor/library.tsx (+59 -27), src/model/preset.ts (+2 -0), src/model/schema.ts (+1 -0), src/presets/categories.ts (+43 -0), src/styles.css (+10 -0)
- [x] T005 [agent] [status:done] Scenes dialog with thumbnails: open, rename, duplicate, delete
      covers: D1@2, D3@2
      changes: src/presets/scene-files.tsx (+191 -25), src/styles.css (+64 -0)
- [x] T006 [agent] [status:done] Import and export presets and scenes as JSON files
      covers: D4@2
      changes: src/editor/app.tsx (+57 -0), src/editor/library.tsx (+10 -0), src/presets/json-files.ts (+38 -0), src/presets/scene-files.tsx (+53 -0), src/styles.css (+19 -0)
- [x] T007 [agent] [status:done] Test: schema accepts saved files and rejects invalid ones naming the path; middleware routes
      covers: R1@1, R3@1, R4@1, R5@1
      kind: test
      changes: src/model/schema.test.ts (+125 -0), src/presets/json-store.test.ts (+89 -0)
- [x] T008 [agent] [status:done] Test: categories and filter in the library
      covers: R2@1
      kind: test
      changes: src/presets/categories.test.ts (+63 -0)
