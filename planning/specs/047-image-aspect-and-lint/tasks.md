# 047 — image-aspect-and-lint — Tasks

- [x] T001 [agent] [status:done] `withImageAspects` pure function and its use in `loadScene`
      covers: D1@1
      changes: src/editor/app.tsx (+31 -1), src/editor/image-aspect.ts (+41 -0)
- [x] T002 [agent] [status:done] Test: aspects corrected, groups included, layout unchanged, same scene when nothing changes
      covers: R1@1
      kind: test
      changes: src/editor/image-aspect.test.ts (+41 -0)
- [x] T003 [agent] [status:done] Remove the non-null assertions Biome warns about
      covers: D2@1, R2@1
      changes: src/engine/audio/audio-export.ts (+5 -8), src/engine/subtitles/parsers/vtt.ts (+3 -2), src/engine/subtitles/subtitles.test.ts (+15 -11)
