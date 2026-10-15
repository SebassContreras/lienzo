# 026 — audio-track — Tasks

- [x] T001 [agent] [status:done] Scene audio schema and types
      covers: D1@1
      changes: src/model/model.ts (+8 -0), src/model/schema.ts (+8 -0)
- [x] T002 [agent] [status:done] Audio file upload and asset validation
      covers: D2@1
      changes: src/presets/store.ts (+6 -0), vite.config.ts (+6 -2)
- [x] T003 [agent] [status:done] Pure audio timing helper
      covers: D3@1
      changes: src/engine/audio/audio-timing.test.ts (+64 -0), src/engine/audio/audio-timing.ts (+81 -0)
- [x] T004 [agent] [status:done] Web Audio playback engine and timeline sync
      covers: D3@1
      changes: src/editor/stage.tsx (+18 -0), src/engine/audio/audio-player.ts (+166 -0)
- [x] T005 [agent] [status:done] Mediabunny video encoder audio multiplexing
      covers: D4@1
      changes: src/engine/assets.ts (+37 -7), src/engine/audio/audio-export.ts (+55 -0), src/export/export.ts (+17 -2), src/export/video-encoder.ts (+28 -0)
- [x] T006 [agent] [status:done] Headless video export audio support
      covers: D5@1
      changes: none
- [x] T007 [agent] [status:done] Editor timeline audio track control
      covers: D6@1
      changes: src/editor/app.tsx (+16 -0), src/editor/timeline/audio-track-control.tsx (+219 -0)
- [x] T008 [agent] [status:done] Audio track integration and timing tests
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/model/scene-audio.test.ts (+80 -0)
