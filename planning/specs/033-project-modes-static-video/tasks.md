- [x] T001 [agent] [status:done] Add SceneMode type and isStaticMode pure helper
      covers: D1@1, R1@1
      changes: .env.example (+20 -0), src/editor/dialogs/tts-dialog.tsx (+4 -4), src/model/mode.ts (+15 -0), src/service/tts/config.ts (+2 -2), src/service/tts/local-adapter.ts (+25 -0), test-root/assets/0c92bddb4e96f3ea.mp3 (binary)
- [x] T002 [agent] [status:done] Update Scene model and Zod SceneSchema to support mode
      covers: D1@1, R1@1
      changes: src/model/model.ts (+5 -0), src/model/schema.ts (+1 -0)
- [x] T003 [agent] [status:done] Update scene_create and scene_export service tools to accept and respect mode
      covers: D6@1, R6@1
      changes: src/service/tools/scene-create.ts (+6 -3), src/service/tools/scene-export.ts (+8 -4)
- [x] T004 [agent] [status:done] Create ProjectModeSelector component for topbar and scene creation
      covers: D2@1, R2@1
      changes: src/editor/mode-selector.tsx (+87 -0)
- [x] T005 [agent] [status:done] Integrate mode selector into app topbar and scene-files dialog
      covers: D2@1, R2@1
      changes: src/editor/app.tsx (+8 -0), src/presets/scene-files.tsx (+17 -1)
- [x] T006 [agent] [status:done] Conditionally render timeline and audio bar in app.tsx based on mode
      covers: D3@1, R3@1
      changes: src/editor/app.tsx (+24 -18)
- [x] T007 [agent] [status:done] Hide animation sections and keyframe controls in inspector and field-editor for static mode
      covers: D4@1, R4@1
      changes: src/editor/app.tsx (+1 -0), src/editor/field-editor.tsx (+6 -2), src/editor/inspector.tsx (+4 -1)
- [x] T008 [agent] [status:done] Update ExportControls to default to PNG and disable video formats in static mode
      covers: D5@1, R5@1
      changes: src/export/export-controls.tsx (+18 -4)
- [x] T009 [agent] [status:done] Unit tests for scene mode helpers, schema validation, and export controls
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/model/mode.test.ts (+54 -0)
