- [x] T001 [agent] [status:done] Pure timing transformation functions for cues and word timestamps
      covers: D1@1, R1@1, R2@1
      changes: src/editor/app.tsx (+336 -321), src/editor/timeline/audio-track-control.tsx (+10 -4), src/engine/assets.ts (+3 -1), src/engine/audio/audio-export.test.ts (+2 -3), src/engine/audio/audio-export.ts (+1 -3), src/engine/audio/audio-player.test.ts (+2 -2), src/engine/audio/audio-player.ts (+7 -1), src/engine/audio/audio-tracks.test.ts (+1 -4), src/engine/audio/audio-tracks.ts (+1 -1), src/engine/subtitles/sync.ts (+95 -0), src/export/export.ts (+7 -5), src/model/model.ts (+1 -0)
- [x] T002 [agent] [status:done] Unit tests for timing transformations and millisecond precision rounding
      covers: D1@1, R1@1, R2@1
      kind: test
      changes: src/engine/subtitles/sync.test.ts (+131 -0)
- [x] T003 [agent] [status:done] Audio track duration fitting calculation helper with tests
      covers: D2@1, R3@1
      kind: test
      changes: src/engine/subtitles/sync.test.ts (+36 -1), src/engine/subtitles/sync.ts (+31 -0)
- [x] T004 [agent] [status:done] Inspector synchronization controls and relative shift UI in cues editor
      covers: D3@1, R1@1, R4@1
      changes: src/editor/field-editor.tsx (+2 -1), src/editor/widgets/cues-editor.tsx (+166 -16)
- [x] T005 [agent] [status:done] Subtitles component descriptor synchronization fields and Spanish localization
      covers: D3@1, R1@1
      changes: src/components/subtitles/descriptor.ts (+3 -1)
- [x] T006 [agent] [status:done] Verification tests for canvas time lock and keyframe tracks compatibility
      covers: D4@1, R5@1
      kind: test
      changes: src/engine/subtitles/subtitles.test.ts (+42 -0)
