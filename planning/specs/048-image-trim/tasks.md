# 048 — image-trim — Tasks

- [ ] T001 [agent] [status:todo] `crop` field on the image element with a full default, drawn as the source rectangle
      covers: D1@1
- [ ] T002 [agent] [status:todo] `alphaBounds` and `applyCrop` pure functions in `src/engine/image-trim.ts`
      covers: D2@1, D3@1
- [ ] T003 [agent] [status:todo] `image-pixels.ts`: RGBA bytes of a decoded asset through an offscreen canvas
      covers: D4@1
- [ ] T004 [agent] [status:todo] Inspector buttons: trim, manual crop, remove crop; status message when nothing can be trimmed
      covers: D5@1
- [ ] T005 [agent] [status:todo] `dragCropEdge` in `src/editor/crop-drag.ts`
      covers: D6@1
- [ ] T006 [agent] [status:todo] Crop mode in `stage.tsx`: double-click, side handles, Esc and click-outside
      covers: D6@1
- [ ] T007 [agent] [status:todo] Tests: bounds of a margined picture, none for a fully transparent one, threshold skips faint pixels; trim keeps content in place; remove crop restores the whole picture at the same scale
      covers: R1@1, R3@1, R5@1
      kind: test
- [ ] T008 [agent] [status:todo] Tests: dragging an edge crops without stretching and clamps to the picture; an old scene parses with the full crop
      covers: R2@1, R4@1
      kind: test
- [ ] T009 [human] [status:todo] Try trim, manual crop and remove crop in the editor, then export and compare
      covers: R1@1, R2@1, R3@1, R4@1
