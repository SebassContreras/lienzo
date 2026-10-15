# 027 — subtitles — Tasks

- [x] T001 [agent] [status:done] Subtitle cue domain models and SRT parser
      covers: D3@1
      changes: src/editor/app.tsx (+1 -1), src/editor/stage.tsx (+1 -1), src/editor/timeline/audio-track-control.tsx (+19 -4), src/engine/audio/audio-player.ts (+6 -1), src/engine/audio/audio-timing.ts (+4 -1), src/engine/subtitles/index.ts (+2 -0), src/engine/subtitles/parsers/srt.test.ts (+61 -0), src/engine/subtitles/parsers/srt.ts (+77 -0), src/engine/subtitles/types.ts (+34 -0), src/export/export.ts (+9 -2)
- [x] T002 [agent] [status:done] WebVTT parser with word timing support
      covers: D3@1
      changes: package.json (+1 -0), src/engine/subtitles/index.ts (+1 -0), src/engine/subtitles/parsers/vtt.ts (+131 -0)
- [x] T003 [agent] [status:done] Pure cue timing and word layout helpers
      covers: D2@3
      └─ reviewed 2026-10-15: timing and base line wrapping logic remain valid under D2@3
      changes: AGENTS.md (+5 -1), src/engine/subtitles/cue-timing.ts (+29 -0), src/engine/subtitles/index.ts (+2 -0), src/engine/subtitles/layout.ts (+131 -0)
- [x] T004 [agent] [status:done] Subtitles component descriptor and schema
      covers: D1@1
      changes: src/components/index.ts (+4 -1), src/components/subtitles/descriptor.ts (+93 -0), src/components/subtitles/draw.ts (+13 -0), src/components/subtitles/schema.ts (+18 -0)
- [x] T005 [agent] [status:done] Canvas 2D subtitles draw function with karaoke highlights
      covers: D2@1
      changes: src/components/subtitles/draw.ts (+95 -6)
- [x] T006 [agent] [status:done] Inspector cues editor and subtitle file import widget
      covers: D4@1
      changes: src/editor/field-editor.tsx (+13 -0), src/editor/widgets/cues-editor.tsx (+200 -0)
- [x] T007 [agent] [status:done] Built-in viral subtitles preset recipe
      covers: D5@1
      changes: presets/built-in/44-subtitulos-virales.json (+25 -0)
- [x] T008 [agent] [status:done] Subtitles parser and deterministic rendering tests
      covers: R1@1, R2@1, R3@2, R4@1, R5@1, R6@1
      └─ reviewed 2026-10-15: word window pagination tests added to verify R3@2
      kind: test
      changes: src/engine/subtitles/subtitles.test.ts (+110 -0)
- [x] T009 [agent] [status:done] Fix subtitles canvas positioning and bounding box alignment
      covers: D2@2
      retires: T005
      changes: src/components/subtitles/draw.ts (+3 -3), src/engine/subtitles/subtitles.test.ts (+104 -10)
- [x] T010 [agent] [status:done] Paginated active word window layout and rendering for subtitles
      covers: D2@3
      retires: T009
      changes: src/components/subtitles/descriptor.ts (+1 -0), src/components/subtitles/draw.ts (+26 -1), src/engine/subtitles/index.ts (+2 -0), src/engine/subtitles/subtitles.test.ts (+40 -0), src/engine/subtitles/word-window.ts (+87 -0)



