# 063 — shot-render-and-honest-defaults — Tasks

- [x] T001 [agent] [status:done] Regression tests: zoom 2 on a grouped shot equals the ungrouped copy; an element with no shot does not move under a camera (fail before the fix)
      covers: R2@1, R3@1
      kind: test
      changes: src/engine/shots-render.test.ts (+87 -0)
- [x] T002 [agent] [status:done] Move the camera from `drawElements` to per element in `drawScene`, read from the element's own shot
      covers: D1@1
      changes: src/engine/render.ts (+41 -58), src/engine/shots-render.test.ts (+7 -1), src/engine/shots.ts (+28 -12)
- [x] T003 [agent] [status:done] Tests for `shotTransitionAt`: fade alpha, slide offset and zoom scale at the start, middle and end of the window; cut is the identity
      covers: R1@1
      kind: test
      changes: src/engine/shot-transition.test.ts (+94 -0), src/engine/shots-render.test.ts (+20 -0)
- [x] T004 [agent] [status:done] `shotTransitionAt` and its composition in `drawScene`
      covers: D2@1
      changes: src/engine/shots.ts (+48 -5)
- [x] T005 [agent] [status:done] Reproducing test: `textLayout` width vs drawn width for `at` text with no `w`
      covers: R4@1
      kind: test
      changes: src/engine/text-measure-node.test.ts (+32 -0)
- [x] T006 [agent] [status:done] Fix the text measurer for the cause T005 shows (revise D3 first if it differs)
      covers: D3@1
      changes: src/engine/text-measure.ts (+8 -4)
- [x] T007 [agent] [status:done] Render audit: snapshot every tracked scene and preset before the defaults change, and compare after
      covers: R10@1
      kind: test
      changes: src/presets/__snapshots__/render-audit.test.ts.snap (+147 -0), src/presets/render-audit.test.ts (+61 -0)
- [x] T008 [agent] [status:done] `fill.opacity: 1`, path `border.width: 0`, `flat` covering paths, and a stroke width when the draw-on animation is applied
      covers: D4@1
      changes: src/components/path/descriptor.ts (+2 -2), src/components/path/draw-on.ts (+15 -0), src/components/path/layers.test.ts (+3 -0), src/components/rect/descriptor.ts (+1 -1), src/editor/field-editor.tsx (+7 -1), src/presets/__snapshots__/render-audit.test.ts.snap (+12 -12), src/presets/recipes.test.ts (+8 -2), src/service/compact/defaults.ts (+4 -1), src/service/compact/expand.ts (+4 -0), src/test/render.golden.json (+16 -16), src/traits/fill.ts (+1 -1)
- [x] T009 [agent] [status:done] Tests for the new defaults and the draw-on stroke width
      covers: R5@1
      kind: test
      changes: src/service/compact/honest-defaults.test.ts (+74 -0)
- [x] T010 [agent] [status:done] `ignoredPaths` and its notices in `scene_validate`, `scene_build` and the compact expansion
      covers: D5@1
      changes: src/model/ignored.ts (+32 -0), src/service/scenes.ts (+6 -1), src/service/tools/scene-build.ts (+5 -1), src/service/tools/scene-validate.ts (+10 -7)
- [x] T011 [agent] [status:done] Tests: a misspelled key yields a notice with its path; a valid scene yields none
      covers: R6@1
      kind: test
      changes: src/model/ignored.test.ts (+34 -0), src/service/registry.ts (+15 -1), src/service/service.test.ts (+33 -0)
- [x] T012 [agent] [status:done] `asset-refs` helpers and the `asset_rename` and `asset_delete` tools
      covers: D6@1
      changes: src/cli/cli.test.ts (+19 -1), src/service/asset-refs.ts (+43 -0), src/service/project-assets.ts (+85 -0), src/service/service.test.ts (+2 -0), src/service/tools/asset-delete.ts (+21 -0), src/service/tools/asset-rename.ts (+22 -0), src/service/tools/index.ts (+4 -0)
- [x] T013 [agent] [status:done] Rename and delete in the editor's assets tab
      covers: D6@1
      changes: src/editor/sidebar/project-assets-tab.tsx (+54 -1), src/presets/store.ts (+49 -0), src/service/project-middleware.ts (+24 -1)
- [x] T014 [agent] [status:done] Tests: rename rewrites references; delete refuses while referenced and lists the scenes; `force` deletes
      covers: R7@1
      kind: test
      changes: src/service/asset-refs.ts (+8 -5), src/service/asset-tools.test.ts (+112 -0)
- [x] T015 [agent] [status:done] `scene-notices` shared by the tool and the editor's "Avisos" list, click to select
      covers: D7@1
      changes: src/editor/app.tsx (+4 -1), src/editor/inspector.tsx (+7 -1), src/editor/scene/review-section.tsx (+36 -3), src/service/scene-notices.ts (+43 -0), src/service/scenes.ts (+1 -6), src/service/tools/scene-validate.ts (+4 -3), src/styles.css (+13 -0)
- [x] T016 [agent] [status:done] Test: the editor list equals the `scene_validate` notices for the same scene
      covers: R8@1
      kind: test
      changes: src/editor/scene/review-section.test.tsx (+74 -0)
- [x] T017 [agent] [status:done] Duplicate and align recipes in the usage skill
      covers: D8@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+13 -2)
- [x] T018 [agent] [status:done] Remove the skill workarounds and re-render the regression scenes
      covers: D9@1
      changes: none
