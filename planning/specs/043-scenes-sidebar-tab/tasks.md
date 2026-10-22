- [x] T001 [agent] [status:done] `ProjectScenesTab` with list, thumbnails and scene actions
      covers: D1@2
      changes: src/editor/sidebar/project-scenes-tab.tsx (+254 -0), src/editor/sidebar/scene-thumb.tsx (+56 -0), src/presets/scene-list.ts (+28 -0), src/presets/store.ts (+18 -6), src/styles.css (+37 -31)
- [x] T002 [agent] [status:done] Blank / recover draft actions in the tab
      covers: D2@1
      changes: src/editor/app.tsx (+22 -1)
- [x] T003 [agent] [status:done] Add the "Escenas" sidebar tab
      covers: D4@1
      changes: src/editor/app.tsx (+22 -1), src/styles.css (+1 -1)
- [x] T004 [agent] [status:done] Remove `SceneFiles`, its modal and the top-bar scene buttons
      covers: D3@2
      changes: src/editor/app.tsx (+0 -25), src/editor/dialogs/tts-dialog.tsx (+1 -1), src/presets/scene-files.tsx (+0 -322), src/styles.css (+14 -0)
- [x] T005 [agent] [status:done] Test: the tab lists the active project's scenes and refreshes on switch
      covers: R2@1, R5@1
      kind: test
      changes: src/editor/sidebar/project-scenes-tab.test.tsx (+67 -0)
- [x] T006 [agent] [status:done] Test: `scene-list` parses stored scenes, reports broken ones and picks free names
      covers: D3@2
      kind: test
      changes: src/presets/scene-list.test.ts (+27 -0)
- [x] T007 [agent] [status:done] Fit the five sidebar tabs: icon above a short label
      covers: D4@1
      changes: src/styles.css (+4 -3)
      └─ found in the browser check: labels were cut ("Bibliotec", "Recursc")
