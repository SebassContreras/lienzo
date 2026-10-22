- [x] T001 [agent] [status:done] Recursive asset inventory in the project store
      covers: D1@1
      changes: src/service/project-store.ts (+21 -2)
- [x] T002 [agent] [status:done] Nested asset GET route with a path traversal guard
      covers: D2@3
      └─ reviewed 2026-10-22: the route and the single check stay; T009 widens the pattern
      changes: src/service/asset-path.ts (+30 -0), src/service/project-middleware.ts (+7 -6)
- [x] T003 [agent] [status:done] Tile drag source fix and per-segment URLs in the Recursos tab
      covers: D3@2
      └─ reviewed 2026-10-22: drag source fix still right; T011 changes the label to the file name
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
- [x] T008 [agent] [status:done] Fix: a reference relative to the project (`assets/x.png`) still validates
      covers: D5@1
      changes: src/service/asset-path.test.ts (+6 -0), src/service/asset-path.ts (+4 -2)
      └─ found by brand-constraining.test.ts in the full run after T007
- [x] T009 [agent] [status:done] Widen the asset segment pattern to spaces, accents and common punctuation
      covers: D2@3
      changes: src/service/asset-path.ts (+7 -4)
- [x] T010 [agent] [status:done] `assetFolderView` pure function for folder browsing
      covers: D6@1
      changes: src/editor/sidebar/asset-folders.ts (+34 -0)
- [x] T011 [agent] [status:done] Folder tiles, breadcrumb and file-name labels in the Recursos tab
      covers: D3@2, D6@1
      changes: src/editor/sidebar/asset-folders.ts (+2 -1), src/editor/sidebar/project-assets-tab.tsx (+110 -40)
- [x] T012 [agent] [status:done] Tests: names with spaces and accents served and rejected cases, folder view
      covers: R6@1, R7@1
      kind: test
      changes: src/editor/sidebar/asset-folders.test.ts (+54 -0), src/service/asset-path.test.ts (+32 -0), src/service/project-middleware.test.ts (+19 -0)
