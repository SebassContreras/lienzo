- [x] T001 [agent] [status:done] Pure timing transformation functions for cues and word timestamps
      covers: D1@2, R1@3, R2@1
      changes: src/editor/app.tsx (+336 -321), src/editor/timeline/audio-track-control.tsx (+10 -4), src/engine/assets.ts (+3 -1), src/engine/audio/audio-export.test.ts (+2 -3), src/engine/audio/audio-export.ts (+1 -3), src/engine/audio/audio-player.test.ts (+2 -2), src/engine/audio/audio-player.ts (+7 -1), src/engine/audio/audio-tracks.test.ts (+1 -4), src/engine/audio/audio-tracks.ts (+1 -1), src/engine/subtitles/sync.ts (+95 -0), src/export/export.ts (+7 -5), src/model/model.ts (+1 -0)
      └─ reviewed 2026-10-17: Pure scaling logic remains valid under R1@3
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
      covers: D3@3, R1@3
      changes: src/components/subtitles/descriptor.ts (+3 -1)
      └─ reviewed 2026-10-17: Component descriptor section remains valid under D3@3 and R1@3
- [x] T006 [agent] [status:done] Verification tests for canvas time lock and keyframe tracks compatibility
      covers: D4@1, R5@1
      kind: test
      changes: src/engine/subtitles/subtitles.test.ts (+42 -0)
- [x] T007 [agent] [status:done] Simplify synchronization logic in sync.ts and CuesEditor
      covers: D1@2, D3@2, R1@2
      retires: T003, T004
      changes: src/editor/widgets/cues-editor.tsx (+31 -98), src/engine/subtitles/sync.ts (+12 -44)
- [x] T008 [agent] [status:done] Unit tests for simplified subtitle timing scaling and start offset
      covers: D1@2, R1@3
      kind: test
      retires: T002
      changes: src/engine/subtitles/sync.test.ts (+17 -67)
      └─ reviewed 2026-10-17: Unit tests for scaling remain valid under R1@3
- [x] T009 [agent] [status:done] Pure bidirectional pause parser and gap detector functions
      covers: D5@1, R1@3, R6@1
      changes: src/components/subtitles/descriptor.ts (+18 -7), src/editor/app.tsx (+1 -1), src/editor/footer/editor-footer.tsx (+17 -4), src/editor/widgets/cues-editor.tsx (+28 -9), src/engine/subtitles/pauses.ts (+159 -0)
- [x] T010 [agent] [status:done] Unit tests for pause parsing, gap formatting, and roundtrip timing consistency
      covers: D5@1, R1@3, R6@1
      kind: test
      changes: src/engine/subtitles/pauses.test.ts (+98 -0)
- [x] T011 [agent] [status:done] Integrate pause-aware parsing and import gap detection in cues editor
      covers: D3@3, R1@3, R6@1
      retires: T007
      changes: src/editor/widgets/cues-editor.tsx (+16 -47)



