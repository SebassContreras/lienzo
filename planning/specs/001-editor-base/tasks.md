# 001 — editor-base — Tasks

- [x] T001 [agent] [status:done] Set up the root project (package.json, tsconfig, Biome, Vite, index.html, .gitignore)
      covers: D1@1, A1@1, A8@1, A9@1, A13@1, A14@1
      changes: .gitignore (+16 -0), biome.json (+39 -0), index.html (+12 -0), package.json (+43 -0), pnpm-lock.yaml (+1132 -0), presets/.gitkeep (+0 -0), scenes/.gitkeep (+0 -0), src/main.tsx (+5 -0), tsconfig.json (+15 -0), vite.config.ts (+6 -0), vitest.config.ts (+8 -0)
- [x] T002 [agent] [status:done] Write the scene model and the engine (render, paint, anim, geometry)
      covers: D2@1, D3@1, D4@1, D5@1, A3@1, A4@1, A6@1
      changes: src/engine/anim.ts (+69 -0), src/engine/geometry.ts (+251 -0), src/engine/paint.ts (+102 -0), src/engine/render.ts (+47 -0), src/model/model.ts (+336 -0), src/types/gifenc.d.ts (+39 -0)
- [x] T003 [agent] [status:done] Write the rect, text and line components
      covers: D3@1, D4@1, D5@1, A5@1
      changes: src/components/line.ts (+153 -0), src/components/rect.ts (+107 -0), src/components/text.ts (+43 -0), src/engine/render.ts (+10 -1)
- [x] T004 [agent] [status:done] Build the editor: stage, library, inspector, app shell, timeline
      covers: D6@1, D7@1, A11@1, A12@1, A16@1
      changes: src/editor/app.tsx (+396 -0), src/editor/inspector.tsx (+1251 -0), src/editor/library.tsx (+118 -0), src/editor/stage.tsx (+436 -0), src/main.tsx (+28 -1), src/styles.css (+305 -0)
- [x] T005 [agent] [status:done] Export to PNG, GIF and MP4
      covers: D8@1, A10@1
      changes: src/editor/app.tsx (+10 -1), src/export/export-controls.tsx (+71 -0), src/export/export.ts (+133 -0)
- [x] T006 [agent] [status:done] Presets and scenes as JSON files, built-in presets, autosave
      covers: D9@2, A7@3
      changes: src/editor/app.tsx (+73 -1), src/presets/built-in.ts (+220 -0), src/presets/scene-files.tsx (+70 -0), src/presets/slug.ts (+9 -0), src/presets/store.ts (+38 -0), src/styles.css (+2 -2), vite.config.ts (+65 -2)
      └─ reviewed 2026-10-07: middleware, store, scene files and autosave still hold; the preset list it wrote was replaced by recipes in 004/T007
      └─ reviewed 2026-10-07: A7@2 only adds `assets/` to the versioned folders; this work still holds
      └─ reviewed 2026-10-08: A7@3 only adds 3D models to what `assets/` holds; this work still holds
- [x] T007 [agent] [status:done] MCP demo scene
      covers: D10@1
      changes: src/demo.ts (+186 -0), src/editor/app.tsx (+10 -2)
- [x] T008 [agent] [status:done] Unit tests and CI workflow
      covers: D11@1, D1@1, A15@1
      kind: test
      changes: .github/workflows/ci.yml (+26 -0), src/engine/anim.test.ts (+46 -0), src/engine/geometry.test.ts (+47 -0), src/presets/slug.test.ts (+14 -0)
- [x] T009 [agent] [status:done] Test: drive the editor in a browser — drop, select, move, attach a line, export PNG, GIF and MP4
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1, R7@1, R8@1, R9@1, R10@1, R11@1
      kind: test
      changes: none
      └─ manual check with a scripted browser; not part of CI
