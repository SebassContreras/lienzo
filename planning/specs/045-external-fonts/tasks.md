- [x] T001 [agent] [status:done] Git-ignored global `fonts/` folder and per-project `fonts/`
      covers: D1@2
      changes: .gitignore (+5 -0), fonts/.gitkeep (+0 -0), src/model/font-files.ts (+39 -0)
- [x] T002 [agent] [status:done] Font store, `resolveFonts` and list/serve endpoints
      covers: D2@1
      changes: src/model/font-files.ts (+49 -0), src/service/font-middleware.ts (+69 -0), src/service/font-store.ts (+59 -0), vite.config.ts (+26 -1)
- [x] T003 [agent] [status:done] Browser font loader for preview and the render route; missing-font report
      covers: D3@1
      changes: src/editor/app.tsx (+31 -1), src/engine/fonts.ts (+76 -0), src/export/render-page.ts (+5 -1), src/service/render-target.ts (+8 -4), src/service/renderer.ts (+10 -5), src/service/tools/scene-export.ts (+1 -0), src/service/tools/scene-preview.ts (+2 -1)
- [x] T004 [agent] [status:done] Grouped font picker
      covers: D4@1
      changes: src/components/fields/label.ts (+2 -2), src/editor/app.tsx (+13 -12), src/editor/field-editor.tsx (+17 -0), src/editor/inspector.tsx (+13 -1), src/editor/widgets/font-select.tsx (+72 -0)
- [x] T005 [agent] [status:done] Font upload endpoint and UI
      covers: D5@2
      changes: src/editor/app.tsx (+1 -0), src/editor/brand/brand-font-manager.tsx (+160 -0), src/editor/brand/font-api.ts (+28 -0), src/editor/dialogs/brand-manager-dialog.tsx (+13 -1), src/editor/project-selector.tsx (+4 -0), src/editor/sidebar/scene-thumb.tsx (+1 -0), src/service/font-install.ts (+56 -0), src/service/font-middleware.ts (+28 -0), src/styles.css (+46 -1)
- [x] T006 [agent] [status:done] Google Fonts download (endpoint, `font_install` tool, dialog)
      covers: D6@2
      changes: src/editor/brand/brand-font-manager.tsx (+68 -2), src/editor/brand/font-api.ts (+15 -0), src/service/ctx.ts (+7 -0), src/service/font-install.ts (+42 -2), src/service/font-middleware.ts (+28 -8), src/service/google-fonts.ts (+70 -0), src/service/tools/font-install.ts (+34 -0), src/service/tools/font-list.ts (+23 -0), src/service/tools/index.ts (+4 -0), src/styles.css (+6 -0)
- [x] T007 [agent] [status:done] Tests: precedence, file-name parsing, upload validation, Google CSS parsing
      covers: R2@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/engine/fonts.test.ts (+27 -0), src/model/font-files.test.ts (+57 -0), src/service/font-install.test.ts (+70 -0)
- [x] T008 [agent] [status:done] Test: `parseGoogleCss` reads a recorded css2 answer; `downloadGoogleFont` with a fake fetch
      covers: D6@2
      kind: test
      changes: src/service/google-fonts.test.ts (+47 -0), src/test/fixtures/google-css2-roboto.css (+40 -0)
- [x] T009 [agent] [status:done] CLI test calls `font_list` and `font_install` (fake Google Fonts)
      covers: D6@2
      kind: test
      changes: src/cli/cli.test.ts (+12 -1), src/test/fixtures/google-css2-roboto.css (+12 -8)
