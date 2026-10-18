- [x] T001 [agent] [status:done] Add `/api/projects/:slug/presets` endpoint in project-middleware and unit tests
      covers: D4@4
      changes: src/service/project-middleware.test.ts (+31 -0), src/service/project-middleware.ts (+20 -0)
- [x] T002 [agent] [status:done] Add project preset client functions in `src/presets/store.ts`
      covers: D4@4
      changes: src/presets/store.ts (+48 -0)
- [x] T003 [agent] [status:done] Fix default workspace initialization and project-scoped scene autosave in `app.tsx`
      covers: D1@1, D2@2
      changes: src/editor/app.tsx (+24 -6), src/editor/project-selector.tsx (+21 -5)
- [x] T004 [agent] [status:done] Add asset drag-and-drop support on `Stage` canvas
      covers: D3@3
      changes: src/editor/stage.tsx (+35 -6)
- [x] T005 [agent] [status:done] Implement `ProjectAssetsTab` and integrate into sidebar tabs
      covers: D3@3
      changes: src/editor/app.tsx (+19 -1), src/editor/sidebar/project-assets-tab.tsx (+195 -0)
- [x] T006 [agent] [status:done] Implement `ProjectPresetsTab` and integrate into sidebar tabs
      covers: D4@4
      changes: src/editor/app.tsx (+19 -1), src/editor/sidebar/project-presets-tab.tsx (+216 -0)
- [x] T007 [agent] [status:done] Regression and behavior tests for workspace switching, project presets and asset drop
      covers: D1@1, D2@2, D3@3, D4@4
      kind: test
      changes: src/editor/workspace-fixes.test.ts (+40 -0)
