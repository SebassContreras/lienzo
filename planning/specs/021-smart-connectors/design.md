# 021 — smart-connectors — Design

## Approach

- D1@1 (implements R1, R2): A line end gains an optional `anchor` next to `attach`; a pure `anchorPoint(box, anchor, toward)` in `src/engine/geometry.ts`, next to `attachedOutline`, gives the point, `auto` keeping today's nearest-outline behaviour.
- D2@1 (implements R4): Deleting a target keeps the existing behaviour (the end stays where it was drawn, `attach` and `anchor` cleared); no new code.
- D3@1 (implements R3, R6): A `route` field (`straight`, `orthogonal`, `curved`) selects a pure function that turns the two ends into a path; arrows, dashes, draw-on and traits read that path, so every stroke feature works on every route.
- D4@1 (implements R5): While an end is dragged, the stage shows the anchor points of the element under the pointer and attaches to the nearest one; this overlay is never drawn by `drawScene`.
- D5@1 (implements R5): A drag that attaches or moves an end records one undo step through 020's history.

## Deliverables

`anchor` and `route` fields, routing functions, stage overlay.

## Sequencing

`anchor` → `anchorPoint` → routes → markers on routes → stage overlay → tests.
