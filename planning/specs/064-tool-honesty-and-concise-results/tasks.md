# 064 — tool-honesty-and-concise-results — Tasks

- [ ] T001 [agent] [status:todo] Regression tests: a flat rect with `border.width: 20` has its border glow off; a flat path too; a flat ellipse gains no `borderGlow` and no ignored notice; a glow written on the element wins (fail before the fix)
      covers: R1@1
      kind: test
- [ ] T002 [agent] [status:todo] Flat patch turns off `borderGlow` on elements that have it
      covers: D1@1
- [ ] T003 [agent] [status:todo] Shared shot-rules sentence in `shots.ts`, used by `shot_set` and `scene_build`; `flat` sentence built from `FLAT_KINDS` with the border glow
      covers: D2@1
- [ ] T004 [agent] [status:todo] Tests: both descriptions contain the shot rules; the `scene_build` description names every flat kind
      covers: R2@1, R3@1
      kind: test
- [ ] T005 [agent] [status:todo] Tests: a text in a font with no metrics yields the estimated-width notice in `scene_build` and `scene_validate` and `estimated: true` boxes; a bundled font yields neither (fail before the fix)
      covers: R4@1
      kind: test
- [ ] T006 [agent] [status:todo] `widthIsEstimated`, the notice in `fontNotices` and `estimated` in `layoutBoxes`
      covers: D3@1
- [ ] T007 [agent] [status:todo] Tests: a save notice and a build notice both appear in `notices` once; `saved` is the name (fail before the fix)
      covers: R5@1
      kind: test
- [ ] T008 [agent] [status:todo] One `notices` list in `scene_build`, `saved` as the name; update callers and the usage skill
      covers: D4@1
- [ ] T009 [agent] [status:todo] Tests: a saving build returns no scene by default and the element ids; `detailed` and a build with no save return the scene
      covers: R6@1
      kind: test
- [ ] T010 [agent] [status:todo] `response_format` in `scene_build`, its description, and the usage skill
      covers: D5@1
