# 021 — smart-connectors — Tasks

- [ ] T001 [agent] [status:todo] `anchor` field on line ends and `anchorPoint` in `geometry.ts`
      covers: D1@1
- [ ] T002 [agent] [status:todo] `route` field with the orthogonal (elbow) route
      covers: D3@1
- [ ] T003 [agent] [status:todo] Curved (bezier) route
      covers: D3@1
- [ ] T004 [agent] [status:todo] Arrows, dashes and draw-on follow the routed path
      covers: D3@1
- [ ] T005 [agent] [status:todo] Stage overlay with anchor points while dragging an end; one undo step per drag
      covers: D4@1, D5@1
- [ ] T006 [agent] [status:todo] Test: anchor points per anchor and box, ends follow a moved and resized target, each route's path, markers on each route
      covers: R1@2, R2@2, R3@1, R6@1
      kind: test
- [ ] T007 [agent] [status:todo] Test in the browser: attach an end to an anchor, move the target, delete it and keep a valid line; undo the attach
      covers: R4@1, R5@1, D2@1
      kind: test
