# 048 — image-trim — Design

## Approach

- D1@1 (implements R4): The image element gets `crop: { x, y, w, h }` in fractions (0–1) of the natural picture, default `{ x: 0, y: 0, w: 1, h: 1 }`, hidden from the inspector. `draw.ts` uses the 9-argument `drawImage` with the crop as the source rectangle _(standard: CanvasRenderingContext2D.drawImage — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)_. A missing `crop` takes the default, so older scenes parse and draw as before.
- D2@1 (implements R1, R5): `alphaBounds(pixels, width, height, threshold = 8)` in `src/engine/image-trim.ts` is a pure function over RGBA bytes that returns the fractional rectangle of the pixels whose alpha is above `threshold`, or `undefined` when there are none _(standard: ImageData RGBA layout — https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data)_; the threshold is _(judgement, no standard)_ to skip near-invisible shadows and anti-aliasing.
- D3@1 (implements R1, R2, R3): `applyCrop(el, crop)` in the same file is a pure function that returns the element with the new `crop`, its `aspect` from the cropped natural size, and `x`, `y`, `w`, `h` moved so the pixels shared by both crops stay where they are on the canvas. Trim, manual crop and "Quitar recorte" (`applyCrop(el, FULL)`) all go through it.
- D4@1 (implements R1, R5): `src/engine/image-pixels.ts` reads an asset's RGBA bytes by drawing the decoded image (`imageFor`) on an offscreen canvas and calling `getImageData` _(standard: getImageData — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)_; assets are same-origin, so the canvas is not tainted.
- D5@1 (implements R1, R3): An image widget in the Imagen section of the inspector shows "Recortar transparencia", "Recortar manualmente" and "Quitar recorte" (the last only when `crop` is not full); each change is one undo step through the existing `change` path.
- D6@1 (implements R2): Crop mode lives in `stage.tsx` as a `cropping` element id: double-click or the inspector button sets it; four side handles drag through a pure `dragCropEdge(el, edge, delta)` in `src/editor/crop-drag.ts`, which clamps the crop to the picture and a minimum size and calls `applyCrop`; Esc or a pointer-down outside the image clears it.

## Deliverables

- `src/components/image/descriptor.ts`, `src/components/image/draw.ts`
- `src/engine/image-trim.ts` (+ test), `src/engine/image-pixels.ts`, `src/editor/crop-drag.ts` (+ test)
- `src/editor/field-editor.tsx` (image widget), `src/editor/stage.tsx`

## Sequencing

- D1 → D2/D3 → D4/D5 → D6. `alphaBounds` and `applyCrop` are reused by spec 049.

## Trade-offs

- Crop as a field, not a new file (D1). Pros: non-destructive, undoable, one asset per picture. Cons: every draw passes a source rectangle. Mitigation: the default full crop draws the same pixels as today; a test checks an old scene parses with it.
- Fractions instead of pixels (D1). Pros: survives replacing the asset with a higher-resolution copy. Cons: needs the natural size to compute pixels. Mitigation: the decoded image already carries it.
- Pure functions in `engine/` (D2, D3). Pros: testable without a browser, shared with the MCP (049). Cons: one more module. Mitigation: two real consumers justify it (principle 1).
- Alpha threshold 8 (D2). Pros: soft shadows do not keep the margin. Cons: a very faint glow can be cut. Mitigation: "Quitar recorte" and the manual crop recover it.
- Crop mode in the stage (D6). Pros: direct manipulation where the image is. Cons: `stage.tsx` grows. Mitigation: the edge math is in `crop-drag.ts`; the stage only routes the pointer.
