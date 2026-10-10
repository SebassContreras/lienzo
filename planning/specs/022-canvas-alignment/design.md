# 022 — canvas-alignment — Design

## Approach

- D1@1 (implements R1, R2, R3): `src/editor/snap.ts` is pure: from the moving box, the other boxes and the canvas it returns the snapped offset, the guide lines and the equal-gap marks; the threshold is 5 screen pixels, converted by the zoom; `snap.ts` takes an `enabled` flag that the stage sets from `ctrlKey || metaKey`.
- D2@1 (implements R1, R3): Guides and gap marks are drawn in the stage's overlay, never by `drawScene`, so they never reach an export.
- D3@1 (implements R6): `src/editor/align.ts` is pure (align left, right, top, bottom, centres; distribute evenly) over the selected boxes; its buttons show in the inspector when two or more elements are selected, and each action records one undo step through 020's history.
- D4@1 (implements R4, R5): The existing marquee and multi-drag stay; with several elements selected, snapping uses the union of their boxes.

## Deliverables

`snap.ts`, `align.ts`, stage overlay, inspector alignment buttons.

