# 048 — image-trim — Tasks

- [x] T001 [agent] [status:done] `crop` field on the image element with a full default, drawn as the source rectangle
      covers: D1@1
      changes: src/components/image/descriptor.ts (+17 -0), src/components/image/draw.ts (+25 -1), src/test/legacy-schema.ts (+4 -0), src/test/registry.test.ts (+2 -2)
- [x] T002 [agent] [status:done] `alphaBounds` and `applyCrop` pure functions in `src/engine/image-trim.ts`
      covers: D2@1, D3@1
      changes: src/engine/image-trim.ts (+63 -0)
- [x] T003 [agent] [status:done] `image-pixels.ts`: RGBA bytes of a decoded asset through an offscreen canvas
      covers: D4@1
      changes: src/editor/image-pixels.ts (+19 -0)
- [x] T004 [agent] [status:done] Inspector buttons: trim, manual crop, remove crop; status message when nothing can be trimmed
      covers: D5@1
      changes: src/components/image/descriptor.ts (+3 -1), src/editor/field-editor.tsx (+10 -0), src/editor/inspector.tsx (+3 -0), src/editor/widgets/image-crop.tsx (+68 -0)
- [x] T005 [agent] [status:done] `dragCropEdge` in `src/editor/crop-drag.ts`
      covers: D6@1
      changes: src/editor/crop-drag.ts (+45 -0)
- [x] T006 [agent] [status:done] Crop mode in `stage.tsx`: double-click, side handles, Esc and click-outside
      covers: D6@1
      changes: src/editor/app.tsx (+18 -3), src/editor/stage.tsx (+97 -5)
- [x] T007 [agent] [status:done] Tests: bounds of a margined picture, none for a fully transparent one, threshold skips faint pixels; trim keeps content in place; remove crop restores the whole picture at the same scale
      covers: R1@1, R3@1, R5@1
      kind: test
      changes: src/engine/image-trim.test.ts (+81 -0)
- [x] T008 [agent] [status:done] Tests: dragging an edge crops without stretching and clamps to the picture; an old scene parses with the full crop
      covers: R2@1, R4@1
      kind: test
      changes: src/editor/crop-drag.test.ts (+68 -0), src/engine/image-trim.test.ts (+3 -1)
- [ ] T009 [human] [status:todo] Try trim, manual crop and remove crop in the editor, then export and compare
      covers: R1@1, R2@1, R3@1, R4@1
- [x] T010 [agent] [status:done] Fix from the browser check: crop buttons stacked so none is cut off; Esc in crop mode keeps the image selected
      covers: D5@1, D6@1
      changes: src/editor/stage.tsx (+8 -4), src/editor/widgets/image-crop.tsx (+1 -1), src/styles.css (+10 -0)
- [x] T011 [agent] [status:done] Drop the crop-tools button rule Biome flags (descending specificity)
      covers: D5@1
      changes: src/styles.css (+0 -3)
