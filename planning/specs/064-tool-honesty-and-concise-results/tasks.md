# 064 — tool-honesty-and-concise-results — Tasks

- [x] T001 [agent] [status:done] Regression tests: a flat rect with `border.width: 20` has its border glow off; a flat path too; a flat ellipse gains no `borderGlow` and no ignored notice; a glow written on the element wins (fail before the fix)
      covers: R1@1
      kind: test
      changes: src/service/compact/flat-glow.test.ts (+69 -0)
- [x] T002 [agent] [status:done] Flat patch turns off `borderGlow`
      covers: D6@1
      changes: README.md (+1 -1), src/model/compact.ts (+1 -1), src/service/compact/defaults.ts (+1 -0)
- [x] T003 [agent] [status:done] Shared shot-rules sentence in `shots.ts`, used by `shot_set` and `scene_build`; `flat` sentence built from `FLAT_KINDS` with the border glow
      covers: D2@1
      changes: src/engine/shots.ts (+6 -0), src/service/compact/defaults.ts (+1 -1), src/service/tools/scene-build.ts (+6 -3), src/service/tools/shot-set.ts (+3 -1)
- [x] T004 [agent] [status:done] Tests: both descriptions contain the shot rules; the `scene_build` description names every flat kind
      covers: R2@1, R3@1
      kind: test
      changes: src/service/tools/descriptions.test.ts (+33 -0)
- [x] T005 [agent] [status:done] Tests: a text in a font with no metrics yields the estimated-width notice in `scene_build` and `scene_validate` and `estimated: true` boxes; a bundled font yields neither (fail before the fix)
      covers: R4@1
      kind: test
      changes: src/service/estimated-width.test.ts (+93 -0)
- [x] T006 [agent] [status:done] `widthIsEstimated`, `estimatedWidthNotices` and `estimated` in `layoutBoxes`
      covers: D3@2
      changes: src/editor/scene/review-section.test.tsx (+4 -2), src/engine/text-measure.ts (+11 -0), src/service/font-check.ts (+34 -6), src/service/layout.ts (+16 -2), src/service/scene-notices.ts (+18 -9), src/service/service.test.ts (+9 -3), src/service/tools/scene-build.ts (+2 -1), src/service/tools/scene-inspect-layout.ts (+3 -1), src/service/tools/scene-validate.ts (+2 -1)
- [x] T007 [agent] [status:done] Tests: a save notice and a build notice both appear in `notices` once; `saved` is the name (fail before the fix)
      covers: R5@1
      kind: test
      changes: src/service/estimated-width.test.ts (+3 -21), src/service/tools/scene-build-result.test.ts (+43 -0), src/test/tool-harness.ts (+28 -0)
- [x] T008 [agent] [status:done] One `notices` list in `scene_build`, `saved` as the name; update callers and the usage skill
      covers: D4@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+4 -2), src/service/service.test.ts (+1 -1), src/service/tools/scene-build.ts (+9 -6)
- [x] T009 [agent] [status:done] Tests: a saving build returns no scene by default and the element ids; `detailed` and a build with no save return the scene
      covers: R6@1
      kind: test
      changes: src/service/tools/scene-build-result.test.ts (+41 -0)
- [x] T010 [agent] [status:done] `response_format` in `scene_build`, its description, and the usage skill
      covers: D5@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+3 -1), src/service/service.test.ts (+2 -1), src/service/tools/scene-build.ts (+15 -8)
