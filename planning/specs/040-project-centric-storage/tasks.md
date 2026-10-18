- [x] T001 [agent] [status:done] Initialize default workspace mi-proyecto, migrate existing files, and remove root scenes/assets/exports
      covers: D1@1, D2@1
      changes: .gitignore (+3 -11), assets/.gitkeep (+0 -0), projects/mi-proyecto/project.json (+22 -0), scenes/ejemplo-keyframes.json → projects/mi-proyecto/scenes/ejemplo-keyframes.json (+0 -0), scenes/.gitkeep (+0 -0), src/engine/tracks.test.ts (+1 -1)
- [x] T002 [agent] [status:done] Project scope resolution and strict asset boundary validation
      covers: D3@1
      changes: src/service/project-boundary.test.ts (+59 -0), src/service/project-scope.ts (+40 -0), src/service/project-store.ts (+12 -1)
- [x] T003 [agent] [status:done] Service tools and TTS speech generation project-scoping
      covers: D4@1
      changes: src/service/project-scope.ts (+37 -1), src/service/service.test.ts (+17 -9), src/service/store.ts (+4 -4), src/service/tools/element-add.ts (+7 -8), src/service/tools/scene-build.ts (+9 -5), src/service/tools/scene-create.ts (+18 -21), src/service/tools/scene-export.ts (+11 -3), src/service/tools/scene-generate-speech.ts (+13 -4), src/service/tools/scene-get.ts (+9 -2), src/service/tools/scene-list.ts (+7 -3), src/service/tools/scene-preview.ts (+6 -2), src/service/tts/asset-store.ts (+5 -4)
- [x] T004 [agent] [status:done] Middleware and editor UI project-first integration
      covers: D5@1
      changes: src/editor/app.tsx (+1 -0), src/presets/scene-files.tsx (+7 -4), src/presets/store.ts (+14 -5), src/service/project-middleware.ts (+20 -0), vite.config.ts (+3 -3)
- [x] T005 [agent] [status:done] Gitignore, agent guidelines documentation, and test verification
      covers: D6@1
      changes: AGENTS.md (+8 -4), README.md (+5 -5), src/editor/voice-library.test.ts (+5 -4)
