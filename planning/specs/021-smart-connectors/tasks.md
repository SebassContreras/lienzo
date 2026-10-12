# 021 — smart-connectors — Tasks

- [x] T001 [agent] [status:done] `anchor` field on line ends and `anchorPoint` in `geometry.ts`
      covers: D1@1
- [x] T002 [agent] [status:done] `route` field with the orthogonal (elbow) route
      covers: D3@1
- [x] T003 [agent] [status:done] Curved (bezier) route
      covers: D3@1
- [x] T004 [agent] [status:done] Arrows, dashes and draw-on follow the routed path
      covers: D3@1
- [x] T005 [agent] [status:done] Stage overlay with anchor points while dragging an end; one undo step per drag
      covers: D4@1, D5@1
- [x] T006 [agent] [status:done] Test: anchor points per anchor and box, ends follow a moved and resized target, each route's path, markers on each route
      covers: R1@2, R2@2, R3@1, R6@1
      kind: test
- [x] T007 [agent] [status:done] Test in the browser: attach an end to an anchor, move the target, delete it and keep a valid line; undo the attach
      covers: R4@1, R5@1, D2@1
      kind: test
