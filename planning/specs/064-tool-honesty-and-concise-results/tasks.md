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
      covers: D3@4
      └─ reviewed 2026-10-25: the measurer check, the notices and the top-level text marking hold; T013 extends the marking
      └─ reviewed 2026-10-25: still holds under D3@4; T016 adds `italic`
      changes: src/editor/scene/review-section.test.tsx (+4 -2), src/engine/text-measure.ts (+11 -0), src/service/font-check.ts (+34 -6), src/service/layout.ts (+16 -2), src/service/scene-notices.ts (+18 -9), src/service/service.test.ts (+9 -3), src/service/tools/scene-build.ts (+2 -1), src/service/tools/scene-inspect-layout.ts (+3 -1), src/service/tools/scene-validate.ts (+2 -1)
- [x] T007 [agent] [status:done] Tests: a save notice and a build notice both appear in `notices` once; `saved` is the name (fail before the fix)
      covers: R5@1
      kind: test
      changes: src/service/estimated-width.test.ts (+3 -21), src/service/tools/scene-build-result.test.ts (+43 -0), src/test/tool-harness.ts (+28 -0)
- [x] T008 [agent] [status:done] One `notices` list in `scene_build`, `saved` as the name; update callers and the usage skill
      covers: D4@2
      └─ reviewed 2026-10-25: one list and `saved` as the name hold; T014 removes the dedupe
      changes: .agents/skills/lienzo-usage/SKILL.md (+4 -2), src/service/service.test.ts (+1 -1), src/service/tools/scene-build.ts (+9 -6)
- [x] T009 [agent] [status:done] Tests: a saving build returns no scene by default and the element ids; `detailed` and a build with no save return the scene
      covers: R6@1
      kind: test
      changes: src/service/tools/scene-build-result.test.ts (+41 -0)
- [x] T010 [agent] [status:done] `response_format` in `scene_build`, its description, and the usage skill
      covers: D5@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+3 -1), src/service/service.test.ts (+2 -1), src/service/tools/scene-build.ts (+15 -8)
- [x] T011 [agent] [status:done] `call` in the tool harness; `service.test.ts` uses it instead of its own setup, with no assertion changed
      covers: D7@1
      changes: src/service/estimated-width.test.ts (+2 -2), src/service/service.test.ts (+28 -51), src/service/tools/scene-build-result.test.ts (+2 -2), src/test/tool-harness.ts (+27 -9)
- [x] T012 [agent] [status:done] Tests: a group holding a text in a font with no metrics, and a subtitles element in one, get `estimated: true` boxes (fail before the fix)
      covers: R4@1
      kind: test
      changes: src/service/estimated-width.test.ts (+44 -0)
- [x] T013 [agent] [status:done] `estimated` on subtitles and on groups with an estimated text inside
      covers: D3@4
      └─ reviewed 2026-10-25: still holds under D3@4
      changes: src/service/layout.ts (+6 -2), src/service/tools/scene-inspect-layout.ts (+2 -2)
- [x] T014 [agent] [status:done] Stop dropping duplicate notices in `scene_build`
      covers: D4@2
      changes: src/service/tools/scene-build.ts (+2 -4)
- [x] T016 [agent] [status:done] `italic` passed in both estimate checks
      covers: D3@4
      changes: src/service/font-check.ts (+13 -4), src/service/layout.ts (+2 -1)
- [x] T017 [agent] [status:done] Tests: `scene_get` and a detailed `scene_build` show a `none` slot as `{ kind: "none" }` and keep a real one whole (fail before the fix)
      covers: R7@1
      kind: test
      changes: src/service/tools/scene-build-result.test.ts (+42 -0)
- [x] T019 [agent] [status:done] Delete the `none`-slot tests T017 added
      covers: D5@1
      retires: T017
      changes: src/service/tools/scene-build-result.test.ts (+0 -42)
- [x] T020 [agent] [status:done] Regression tests: `background: "#111827"` gives a solid background of that color; an unknown name keeps the default and returns a notice naming it; a preset name still applies the preset (fail before the fix)
      covers: R8@1
      kind: test
      changes: src/service/compact/background.test.ts (+52 -0)
- [x] T021 [agent] [status:done] Color strings and the unknown-background notice in `resolveSceneBackground`; `scene_build` description and usage skill
      covers: D9@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+4 -1), src/service/compact/expand.ts (+21 -7), src/service/tools/scene-build.ts (+2 -1)
- [x] T022 [agent] [status:done] Tests: `{ color }` gives a solid background; `{ color, dots: true }` adds only the dots (fail before the fix)
      covers: R9@1
      kind: test
      changes: src/service/compact/background.test.ts (+30 -0)
- [x] T023 [agent] [status:done] Background objects start from a solid background; description and usage skill
      covers: D10@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+3 -3), README.md (+2 -0), src/service/compact/expand.test.ts (+3 -2), src/service/compact/expand.ts (+3 -1), src/service/tools/scene-build.ts (+2 -1)
- [x] T024 [agent] [status:done] Tests: `scene_validate` with `compact` gives the `scene_build` notices (unknown background); both or neither input fails; a bad `at` names the accepted forms (fail before the fix)
      covers: R10@1, R11@2
      kind: test
      changes: src/service/tools/compact-input.test.ts (+52 -0)
- [x] T025 [agent] [status:done] `buildCompact` shared by `scene_build` and `scene_validate`; `scene_create` description
      covers: D11@1
      changes: src/service/build-compact.ts (+43 -0), src/service/tools/scene-build.ts (+8 -37), src/service/tools/scene-create.ts (+3 -1), src/service/tools/scene-validate.ts (+34 -5)
- [x] T026 [agent] [status:done] `at` union error and `scene_build` description sentence
      covers: D12@1
      changes: src/model/compact.ts (+12 -7), src/service/tools/scene-build.ts (+3 -1)
- [x] T027 [agent] [status:done] Italic field named in the usage skill
      covers: D13@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+6 -2)
- [x] T028 [agent] [status:done] Tests: `{ x, y }` in `scene_build` centres the element on the point; `"center"` and `{ anchor, offset }` in `element_add` and `element_update` place it as `scene_build` does; a bad `at` names the three forms (fail before the fix)
      covers: R11@2
      kind: test
      changes: src/service/tools/compact-input.test.ts (+57 -3)
- [x] T029 [agent] [status:done] One `at` schema, `atCenter` and `AT_RULES` for `scene_build`, `element_add` and `element_update`; usage skill
      covers: D12@2
      retires: T026
      changes: .agents/skills/lienzo-usage/SKILL.md (+3 -3), schemas/compact-scene.json (+26 -0), src/model/compact.ts (+9 -2), src/service/compact/expand.ts (+6 -11), src/service/compact/layout.ts (+20 -12), src/service/tools/element-add.ts (+13 -10), src/service/tools/element-update.ts (+10 -11), src/service/tools/scene-build.ts (+3 -3)
- [x] T030 [agent] [status:done] One name per meaning in every tool input; descriptions, skill, README and tests
      covers: R13@1, D14@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+5 -1), src/cli/cli.test.ts (+19 -13), src/editor/scene/review-section.test.tsx (+2 -2), src/mcp/server.test.ts (+4 -4), src/service/asset-tools.test.ts (+8 -2), src/service/brand-constraining.test.ts (+4 -4), src/service/editor-parity.test.ts (+6 -2), src/service/estimated-width.test.ts (+5 -5), src/service/parity-tools.test.ts (+11 -11), src/service/project-tools.test.ts (+4 -4), src/service/renderer.test.ts (+2 -2), src/service/service.test.ts (+45 -37), src/service/shots.test.ts (+2 -2), src/service/tools/animation-save.ts (+4 -4), src/service/tools/background-set.ts (+6 -6), src/service/tools/compact-input.test.ts (+3 -3), src/service/tools/element-add.ts (+8 -8), src/service/tools/image-trim.test.ts (+6 -6), src/service/tools/project-create.ts (+5 -5), src/service/tools/project-delete.ts (+9 -9), src/service/tools/project-inspect.ts (+6 -6), src/service/tools/project-update.ts (+6 -6), src/service/tools/scene-create.ts (+9 -9), src/service/tools/scene-delete.ts (+3 -3), src/service/tools/scene-inspect-layout.ts (+7 -8), src/service/tools/scene-validate.ts (+9 -13), src/service/tts/audio-duration.test.ts (+2 -2), src/test/tool-harness.ts (+1 -1)
- [x] T031 [agent] [status:done] `project` instead of `slug` in the project tools' results; tests
      covers: R14@1, D15@1
      changes: .agents/skills/lienzo-usage/SKILL.md (+3 -3), src/service/parity-tools.test.ts (+6 -2), src/service/project-result.ts (+17 -0), src/service/project-scope.ts (+1 -1), src/service/project-tools.test.ts (+2 -2), src/service/tools/project-create.ts (+4 -7), src/service/tools/project-inspect.ts (+4 -6), src/service/tools/project-list.ts (+3 -2), src/service/tools/project-update.ts (+3 -3)
