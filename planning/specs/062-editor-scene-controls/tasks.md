# 062 — editor-scene-controls — Tasks

- [x] T001 [agent] [status:done] Move the shot rules of `shot_set` into `setShot`/`removeShot` in `src/model/shots.ts` and call them from the tool
      covers: D1@1
      changes: src/model/shots.ts (+79 -0), src/service/tools/shot-set.ts (+8 -72)
- [x] T002 [agent] [status:done] Test `shots.ts`: create, update, camera merge, order by start, `end < start` and removing a missing shot fail
      covers: R1@1, R5@1
      kind: test
      changes: src/model/shots.test.ts (+76 -0)
- [x] T003 [agent] [status:done] "Tomas" section in the scene inspector (`src/editor/scene/shots-section.tsx`)
      covers: D2@1
      changes: src/editor/inspector.tsx (+4 -0), src/editor/scene/shots-section.tsx (+147 -0), src/styles.css (+7 -0)
- [x] T004 [agent] [status:done] "Toma" select for top-level elements in the element inspector
      covers: D2@1
      changes: src/editor/app.tsx (+5 -0), src/editor/inspector.tsx (+22 -0)
- [x] T005 [agent] [status:done] `symbolFromGroup` and `replaceWithUse` in `src/model/symbols.ts`
      covers: D3@1
      changes: src/model/symbols.ts (+91 -0)
- [x] T006 [agent] [status:done] Test `symbols.ts`: relative children, same box for the instance, edited children reach every `use`
      covers: R2@1
      kind: test
      changes: src/model/symbols.test.ts (+98 -0)
- [x] T007 [agent] [status:done] "Símbolos" section: list and "Crear símbolo desde el grupo"
      covers: D3@1
      changes: src/editor/app.tsx (+20 -0), src/editor/inspector.tsx (+20 -0), src/editor/scene/symbols-section.tsx (+39 -0)
- [x] T008 [agent] [status:done] `symbol-select` widget for `use.symbol`
      covers: D3@1
      changes: src/components/use/descriptor.ts (+8 -2), src/editor/app.tsx (+1 -0), src/editor/field-editor.tsx (+29 -0), src/editor/inspector.tsx (+4 -0)
- [x] T009 [agent] [status:done] "Editar símbolo" mode with banner and "Volver"
      covers: D4@1
      changes: src/editor/app.tsx (+71 -4), src/editor/history.ts (+3 -0), src/styles.css (+6 -0)
- [x] T010 [agent] [status:done] `repeat` and `until` controls in each track lane header
      covers: D5@1
      changes: src/editor/timeline/tracks-panel.tsx (+49 -0), src/styles.css (+9 -1)
- [x] T011 [agent] [status:done] `origin` widget (anchor grid plus x, y)
      covers: D6@1
      changes: src/editor/inspector.tsx (+11 -0), src/editor/widgets/origin-picker.tsx (+51 -0), src/model/compact.ts (+1 -1), src/styles.css (+14 -0)
- [x] T012 [agent] [status:done] Equivalence test: editor changes give the same JSON as `shot_set`, `keyframe_set` and `element_update`
      covers: R5@1
      kind: test
      changes: src/service/editor-parity.test.ts (+82 -0)
- [x] T013 [agent] [status:done] Browser check (playwright-core + Edge) of shots, symbols, track repeat, origin and undo
      covers: R1@1, R2@1, R3@1, R4@1
      kind: test
      changes: .agents/skills/lienzo-usage/SKILL.md (+2 -3), AGENTS.md (+4 -2), README.md (+5 -2)
- [x] T014 [agent] [status:done] `symbolMode` in `SceneInspector` (only width and height) and "Volver" writes them into the symbol
      covers: D7@1
      changes: src/editor/app.tsx (+7 -7), src/editor/inspector.tsx (+39 -0), src/model/symbols.test.ts (+3 -3), src/model/symbols.ts (+4 -4)
- [x] T015 [agent] [status:done] Optional `widget` on text fields; `use.symbol` back to a `text` field with `widget: "symbol"`
      covers: D8@1
      changes: src/components/fields/field.ts (+4 -1), src/components/use/descriptor.ts (+2 -7), src/editor/field-editor.tsx (+2 -2)
- [x] T016 [agent] [status:done] Regression test: `use.symbol` is a text field and every text/select widget name exists in the editor
      covers: R9@1
      kind: test
      changes: src/test/registry.test.ts (+13 -1)
- [x] T017 [agent] [status:done] `toggleCameraKey` in `src/model/shots.ts` and key buttons for camera x, y, zoom in the "Tomas" section
      covers: D9@1
      changes: src/editor/app.tsx (+1 -0), src/editor/inspector.tsx (+4 -1), src/editor/scene/shots-section.tsx (+88 -23), src/model/shots.ts (+55 -0)
- [x] T018 [agent] [status:done] Tests: `toggleCameraKey` adds and removes a key, and the editor's camera key matches `shot_set` with the same `camera.tracks`
      covers: R8@1
      kind: test
      changes: src/model/shots.test.ts (+53 -1), src/service/editor-parity.test.ts (+20 -1)
- [x] T019 [agent] [status:done] Browser check of the symbol-mode inspector (size written back, nothing else shown) and camera keys
      covers: R6@1, R8@1
      kind: test
      changes: none
- [x] T020 [agent] [status:done] `scene_update` tool (settings patch, `null` removes, `elements`/`shots` refused)
      covers: D10@1
      changes: src/service/tools/index.ts (+2 -0), src/service/tools/scene-update.ts (+53 -0)
- [x] T021 [agent] [status:done] `scene_rename` and `scene_delete` tools
      covers: D10@1
      changes: src/service/project-files.ts (+46 -0), src/service/tools/index.ts (+4 -0), src/service/tools/scene-delete.ts (+16 -0), src/service/tools/scene-rename.ts (+20 -0)
- [x] T022 [agent] [status:done] `preset_save`, `preset_rename` and `preset_delete` tools on project presets
      covers: D10@1
      changes: src/service/tools/index.ts (+6 -0), src/service/tools/preset-delete.ts (+17 -0), src/service/tools/preset-rename.ts (+20 -0), src/service/tools/preset-save.ts (+31 -0)
- [x] T023 [agent] [status:done] `animation_list` and `animation_save` tools
      covers: D10@1
      changes: src/service/project-files.ts (+3 -6), src/service/tools/animation-list.ts (+29 -0), src/service/tools/animation-save.ts (+29 -0), src/service/tools/index.ts (+4 -0)
- [x] T024 [agent] [status:done] `project_update` tool
      covers: D10@1
      changes: src/model/project.ts (+3 -3), src/service/tools/index.ts (+2 -0), src/service/tools/project-update.ts (+30 -0)
- [x] T025 [agent] [status:done] `asset_add` tool and local `file` in `font_install`
      covers: D10@1
      changes: src/service/asset-helpers.ts (+14 -0), src/service/project-middleware.ts (+7 -9), src/service/tools/asset-add.ts (+48 -0), src/service/tools/font-install.ts (+21 -3), src/service/tools/index.ts (+2 -0)
- [x] T026 [agent] [status:done] `element_group` and `element_ungroup` tools
      covers: D10@1
      changes: src/service/tools/element-group.ts (+36 -0), src/service/tools/element-ungroup.ts (+28 -0), src/service/tools/index.ts (+4 -0)
- [x] T027 [agent] [status:done] Tests: the new tools' behaviour and failure modes
      covers: R10@1, R11@1, R12@1, R13@1, R14@1, R15@1, R16@1
      kind: test
      changes: src/service/parity-tools.test.ts (+301 -0)
- [x] T028 [agent] [status:done] Parity test: `scene_update`, `element_group`/`element_ungroup` and `preset_save` match the editor functions
      covers: R18@1
      kind: test
      changes: src/service/editor-parity.test.ts (+52 -3)
- [x] T029 [agent] [status:done] "Revisar escena" button and diagnostics list in the editor
      covers: D11@1
      changes: src/editor/inspector.tsx (+2 -0), src/editor/scene/review-section.tsx (+36 -0)
- [x] T030 [agent] [status:done] Browser check of "Revisar escena"; docs (AGENTS.md, lienzo-usage skill, README) list the new tools
      covers: R17@1
      kind: test
      changes: .agents/skills/lienzo-usage/SKILL.md (+7 -2), AGENTS.md (+4 -0), README.md (+11 -4), src/editor/scene/review-section.tsx (+7 -2)
