- [x] T001 [agent] [status:done] Recursive asset inventory in the project store
      covers: D1@1
      changes: src/service/project-store.ts (+21 -2)
- [x] T002 [agent] [status:done] Nested asset GET route with a path traversal guard
      covers: D2@2
      changes: src/service/asset-path.ts (+30 -0), src/service/project-middleware.ts (+7 -6)
- [x] T003 [agent] [status:done] Tile drag source fix and per-segment URLs in the Recursos tab
      covers: D3@1
      changes: src/editor/sidebar/project-assets-tab.tsx (+13 -3), src/service/asset-path.ts (+7 -1)
- [x] T004 [agent] [status:done] Aspect-ratio-preserving drop
      covers: D4@1
      changes: src/editor/asset-drop.ts (+23 -0), src/editor/stage.tsx (+16 -14)
- [x] T005 [agent] [status:done] Tests: nested listing, nested GET, traversal rejected, drop creates an image
      covers: R1@1, R2@1, R4@1
      kind: test
      changes: src/editor/asset-drop.test.ts (+27 -0), src/service/asset-path.test.ts (+37 -0), src/service/project-middleware.test.ts (+46 -1)
- [x] T006 [agent] [status:done] `validateAsset` resolves nested asset references
      covers: D5@1
      changes: src/service/project-store.ts (+6 -4)
- [x] T007 [agent] [status:done] Regression test: a nested asset reference validates
      covers: R5@1
      kind: test
      changes: src/service/project-boundary.test.ts (+21 -0)
