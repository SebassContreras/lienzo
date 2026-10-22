- [x] T001 [agent] [status:done] Start with an empty, paused scene named "Mi proyecto"
      covers: D1@1, D2@1
      changes: src/editor/app.tsx (+15 -28), src/editor/autosave.ts (+34 -0)
- [x] T002 [agent] [status:done] Stop restoring the autosave on mount; add `readAutosave(slug)`
      covers: D3@1
      changes: src/editor/app.tsx (+6 -5), src/editor/startup.ts (+9 -0)
- [x] T004 [agent] [status:done] Remove every demo from the app; move demo and example scene to test fixtures
      covers: D4@1
      changes: AGENTS.md (+0 -1), projects/mi-proyecto/scenes/.gitkeep (+0 -0), src/editor/align.test.ts (+1 -1), src/editor/app.tsx (+0 -8), src/engine/tracks.test.ts (+1 -1), src/model/schema.test.ts (+1 -1), src/service/renderer.test.ts (+25 -3), projects/mi-proyecto/scenes/ejemplo-keyframes.json → src/test/fixtures/ejemplo-keyframes.json (+0 -0), src/demo.ts → src/test/fixtures/sample-scene.ts (+4 -4), src/test/golden-scenes.ts (+1 -1), src/test/render-log.ts (+1 -1)
- [x] T003 [agent] [status:done] Test: startup scene has no elements and is not playing
      covers: R1@1, R2@1, R4@1
      kind: test
      changes: src/editor/startup.test.ts (+45 -0)
- [x] T005 [agent] [status:done] Fix: applying the project's canvas defaults on start no longer overwrites the saved draft
      covers: D3@1
      changes: src/editor/app.tsx (+17 -11), src/editor/autosave.ts (+29 -1), src/editor/startup.test.ts (+37 -1)
      └─ found in the browser check: the start-up resize counted as an edit and autosaved the blank scene
