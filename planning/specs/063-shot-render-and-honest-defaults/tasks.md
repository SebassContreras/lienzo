# 063 — shot-render-and-honest-defaults — Tasks

- [ ] T001 [agent] [status:todo] Regression tests: zoom 2 on a grouped shot equals the ungrouped copy; an element with no shot does not move under a camera (fail before the fix)
      covers: R2@1, R3@1
      kind: test
- [ ] T002 [agent] [status:todo] Move the camera from `drawElements` to per element in `drawScene`, read from the element's own shot
      covers: D1@1
- [ ] T003 [agent] [status:todo] Tests for `shotTransitionAt`: fade alpha, slide offset and zoom scale at the start, middle and end of the window; cut is the identity
      covers: R1@1
      kind: test
- [ ] T004 [agent] [status:todo] `shotTransitionAt` and its composition in `drawScene`
      covers: D2@1
- [ ] T005 [agent] [status:todo] Reproducing test: `textLayout` width vs drawn width for `at` text with no `w`
      covers: R4@1
      kind: test
- [ ] T006 [agent] [status:todo] Fix the text measurer for the cause T005 shows (revise D3 first if it differs)
      covers: D3@1
- [ ] T007 [agent] [status:todo] Render audit: snapshot every tracked scene and preset before the defaults change, and compare after
      covers: R10@1
      kind: test
- [ ] T008 [agent] [status:todo] `fill.opacity: 1`, path `border.width: 0`, `flat` covering paths, and a stroke width when the draw-on animation is applied
      covers: D4@1
- [ ] T009 [agent] [status:todo] Tests for the new defaults and the draw-on stroke width
      covers: R5@1
      kind: test
- [ ] T010 [agent] [status:todo] `ignoredPaths` and its notices in `scene_validate`, `scene_build` and the compact expansion
      covers: D5@1
- [ ] T011 [agent] [status:todo] Tests: a misspelled key yields a notice with its path; a valid scene yields none
      covers: R6@1
      kind: test
- [ ] T012 [agent] [status:todo] `asset-refs` helpers and the `asset_rename` and `asset_delete` tools
      covers: D6@1
- [ ] T013 [agent] [status:todo] Rename and delete in the editor's assets tab
      covers: D6@1
- [ ] T014 [agent] [status:todo] Tests: rename rewrites references; delete refuses while referenced and lists the scenes; `force` deletes
      covers: R7@1
      kind: test
- [ ] T015 [agent] [status:todo] `scene-notices` shared by the tool and the editor's "Avisos" list, click to select
      covers: D7@1
- [ ] T016 [agent] [status:todo] Test: the editor list equals the `scene_validate` notices for the same scene
      covers: R8@1
      kind: test
- [ ] T017 [agent] [status:todo] Duplicate and align recipes in the usage skill
      covers: D8@1
- [ ] T018 [agent] [status:todo] Remove the skill workarounds and re-render the regression scenes
      covers: D9@1
