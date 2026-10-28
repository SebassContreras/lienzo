# 082 — test-suite-rewrite

## Goal
Nine QA rounds in a row (067–081) kept finding bugs because the tests were written from the
reports: `contract.test.ts` has one case per reported bug, nothing checks that every rule is
tested in every writer, 34 of the 43 tools have at most one failing-input case (by test title),
`src/traits` and `src/export` have no tests, and 32 test files sit loose in `src/service`.
The rule behind it — A14 and AGENTS.md "minimal tests, KISS" — was applied as "one test per
reported case".

When this spec is done:
- the tests are grouped by functionality, no test file without a related module beside it;
- the suite is rewritten: rules are tested at every point of entry, every tool is tried with
  bad inputs derived from its schema, and a new tool or writer that is not covered fails the
  build or the suite;
- a QA round has a closed list to check and a stop criterion, so a new report means a new
  *class* of bug, not another case.

## Requirements
- R1: The test policy (A14, AGENTS.md) asks for complete tests of contracts, rules and the
  writer matrix, names tests by behavior (no spec number, no round), and no micro-tests of
  implementation.
- R2: Coverage and mutation score are measurable per folder, and a baseline of the current
  suite is recorded before anything is deleted.
- R3: Each `src/service` functionality has one folder holding its code and tests; cross-feature
  tests live in `src/service/contract/`; `src/test/` keeps only the harness and golden render.
- R4: Every tool declares what it writes (`effects`); a tool without it does not compile.
- R5: Every tool is tried with inputs derived from its input schema (missing key, wrong type,
  out of range, empty, `null`, unknown key, two errors at once) and meets the same invariants:
  fails as `{ code, message, path }` and never throws, message in Spanish, a failed call leaves
  the project byte for byte as it was, every problem is listed, a JSON string argument is read.
- R6: Each shared rule (unique ids, shot references, shot spans, scene limits, 0–1 fractions,
  easings, icon and line targets, assets, fonts) is tested in every writer that has `effects:
  scene`; a writer with no adapter for a rule fails the suite.
- R7: Writers agree: one scene through `scene_build`, `scene_create` and `element_add` ends
  equal in `scene_get`; group then ungroup keeps the draw order; rename and back is the
  identity.
- R8: Every case of the QA reports of rounds 6–9 is an entry of a replay corpus that runs in
  Vitest and with `pnpm lienzo`.
- R9: Each old test file is deleted only after the new tests of its functionality kill at least
  the mutants the old ones killed.
- R10: Folders with no tests (`traits`, `export`) and component kinds without one have them.
- R11: QA has a written process: a closed list, a classification of each finding, a log
  instead of a spec per round, and a stop criterion.

## Design
- D1 (R1): A14 and the AGENTS.md rule change (see `planning/changes.md`): minimal means no test of
  implementation details; contracts, rules, writers and tools are tested completely.
  - _Trade-offs_: more tests to maintain and a slower suite. _Mitigation_: generated tests are one
    file driven by data; single files run while working (AGENTS.md, unchanged).
- D2 (R2, R9): `@vitest/coverage-v8` (MIT) and Stryker with its Vitest runner (Apache-2.0,
  development only, never in `dist/`) are devDependencies. Stryker runs per folder, on demand
  (`pnpm test:mutate <folder>`), not on every commit.
  - _Trade-offs_: mutation runs are slow; the renderer suite times out on some machines.
    _Mitigation_: the browser suite is excluded from Stryker; T003 measures the time first.
- D3 (R3): `src/service` is split into `scenes`, `elements`, `shots`, `assets`, `fonts`,
  `presets` (with animations), `projects`, `speech`, `render`, `compact`, `layout`, `core`
  (registry, ctx, store, verdict, round). `git mv` one functionality per commit; `pnpm
  typecheck` proves the imports. The layered top level (`model`, `engine`, `components`,
  `editor`) stays as AGENTS.md documents it; only its loose tests move.
  Each functionality is `src/service/<feature>/` with its logic and tests, and
  `src/service/<feature>/tools/` with its tool files and their tests (a tool and its logic share
  names, e.g. `image-trim.ts`, so they cannot share a folder).
  - _Trade-offs_: tool files leave `src/service/tools/` for their functionality, which changes
    A20's "one file per tool in `tools/`". _Mitigation_: `src/service/tools/index.ts` keeps the
    one `TOOLS` list; A20 is updated in T015, when the last tool has moved.
- D4 (R4): `Tool` gets a required `effects: readonly Effect[]` (`scene`, `asset`, `preset`,
  `project`, `font`, `export`; empty for a read tool).
- D5 (R5): `src/service/contract/inputs.ts` builds, from `z.toJSONSchema(tool.input)`, one valid
  base input and its variants. Own deterministic generator, no dependency (fast-check was
  considered and left out: shrinking is not needed and the cases must be stable).
- D6 (R6, R7): `src/service/contract/rules.ts` holds the rules; `writers.ts` holds one adapter
  per scene writer (how it takes a scene fragment: `element_add` → `patch`, `scene_build` →
  `compact`, `scene_create` → `data`, `scene_update` → `patch`…). A test walks `effects` and
  fails for a missing cell. Metamorphic relations are in `relations.test.ts`.
- D7 (R8): `src/service/contract/corpus/*.json` = `{ tool, input, expect }`; one runner in Vitest
  and `scripts/replay` through `pnpm lienzo`, so a replay never depends on a long-running MCP
  server.
- D8 (R9, R10): Per functionality: write the new suite, run Stryker on the folder for old and new,
  delete the old files when new ≥ old and every rule tag of the old titles (`078/R1`…) is
  covered by a new test.
- D9 (R11): `planning/qa-log.md` holds one line per finding with its class: (1) a matrix cell is
  missing → add it for every writer; (2) a rule is missing → add it to `RULES` and apply it in
  `prepareScene`; (3) text or docs; (4) a design decision → `## Ideas`. A round ends when the
  corpus is green, the matrix is complete and a QA run finds no new class.

## Layout (T004)

Inventory of `src/service` (165 files, tests included) read on 2026-10-28. A file goes to the functionality named; `core` holds what every feature uses (`ProjectCtx` is in `project-scope.ts`); `contract` holds the tests that cross functionalities and become the generated suite of T017–T023 (their cases are redistributed in T024–T034). `tools/*.ts` move to their functionality; `tools/index.ts` keeps the one `TOOLS` list.

| Functionality | Files |
|---|---|
| `scenes` (23) | patch-notices.test.ts, scene-changes.ts, scene-defaults.test.ts, scene-defaults.ts, scene-notices.test.ts, scene-notices.ts, scene-references.ts, scene-resources.test.ts, scene-resources.ts, scene-watch.test.ts, scene-watch.ts, scenes.ts, tools/background-set.ts, tools/names-and-times.test.ts, tools/scene-build-result.test.ts, tools/scene-build.ts, tools/scene-create.ts, tools/scene-delete.ts, tools/scene-get.ts, tools/scene-list.ts, tools/scene-rename.ts, tools/scene-update.ts, tools/scene-validate.ts |
| `elements` (12) | element-tree.test.ts, element-tree.ts, elements.ts, sparse-scene.ts, tools/component-list.ts, tools/counter-count-up.test.ts, tools/element-add.ts, tools/element-group.ts, tools/element-move.ts, tools/element-remove.ts, tools/element-ungroup.ts, tools/element-update.ts |
| `shots` (5) | shots.test.ts, tools/keyframe-remove.ts, tools/keyframe-set.ts, tools/shot-duration.test.ts, tools/shot-set.ts |
| `assets` (19) | asset-helpers.test.ts, asset-helpers.ts, asset-path.test.ts, asset-path.ts, asset-refs.ts, asset-tools.test.ts, image-aspect.test.ts, image-aspect.ts, image-header.test.ts, image-header.ts, image-probe.test.ts, image-probe.ts, image-trim.ts, project-assets.ts, tools/asset-add.ts, tools/asset-delete.ts, tools/asset-rename.ts, tools/image-trim.test.ts, tools/image-trim.ts |
| `fonts` (10) | font-check.test.ts, font-check.ts, font-install.test.ts, font-install.ts, font-middleware.ts, font-store.ts, google-fonts.test.ts, google-fonts.ts, tools/font-install.ts, tools/font-list.ts |
| `presets` (11) | built-in.ts, tools/animation-delete.ts, tools/animation-list.ts, tools/animation-save.ts, tools/animation-tools.test.ts, tools/preset-delete.ts, tools/preset-get.ts, tools/preset-list.ts, tools/preset-rename.ts, tools/preset-save.ts, tools/preset-validate.ts |
| `projects` (14) | project-boundary.test.ts, project-files.ts, project-middleware.test.ts, project-middleware.ts, project-result.ts, project-store.ts, project-tools.test.ts, root.test.ts, root.ts, tools/project-create.ts, tools/project-delete.ts, tools/project-inspect.ts, tools/project-list.ts, tools/project-update.ts |
| `speech` (18) | tools/scene-generate-speech.ts, tts/asset-store.ts, tts/audio-duration.test.ts, tts/audio-duration.ts, tts/config.ts, tts/factory.ts, tts/local-adapter.ts, tts/openrouter-adapter.ts, tts/pluggable-tts.test.ts, tts/preferences.ts, tts/scene-audio.test.ts, tts/scene-audio.ts, tts/speech-alignment.ts, tts/tts-config.test.ts, tts/tts.test.ts, tts/types.ts, tts-proxy.test.ts, tts-proxy.ts |
| `render` (9) | exports.test.ts, exports.ts, fake-renderer.ts, image.ts, render-target.ts, renderer.test.ts, renderer.ts, tools/scene-export.ts, tools/scene-preview.ts |
| `compact` (19) | build-compact.ts, compact/background.test.ts, compact/connections.ts, compact/defaults.test.ts, compact/defaults.ts, compact/effects.test.ts, compact/effects.ts, compact/errors.test.ts, compact/expand.test.ts, compact/expand.ts, compact/flat-glow.test.ts, compact/gradients.test.ts, compact/honest-defaults.test.ts, compact/implied.test.ts, compact/implied.ts, compact/keep-audio.test.ts, compact/keep-audio.ts, compact/layout.ts, tools/compact-input.test.ts |
| `layout` (10) | brand-constraining.test.ts, contrast.test.ts, contrast.ts, estimated-width.test.ts, layout.test.ts, layout.ts, symbols-layout.test.ts, text-extents.ts, text-layout.test.ts, tools/scene-inspect-layout.ts |
| `core` (7) | ctx.ts, project-scope.ts, registry.ts, round.ts, store.ts, tools/index.ts, verdict.ts |
| `contract` (8) | editor-parity.test.ts, parity-tools.test.ts, service.test.ts, tools/contract.test.ts, tools/descriptions.test.ts, tools/qa-round-3.test.ts, tools/qa-round-5.test.ts, tools/qa-round-6.test.ts |

Outside `src/service` (T016): `src/test/registry.test.ts` goes to `core`, `src/test/more-elements.test.ts` to `src/components`; `render.test.ts`, `golden-scenes.ts`, `render.golden.json` and the harness stay in `src/test/`; `src/presets/render-audit.test.ts` and `round-trip.test.ts` stay with `src/presets/`; the other tests already sit beside their module.

## Tasks
Order: T001–T004, then the moves (T005–T016), the tool field and generated suite (T017–T023),
the rewrites (T024–T040), the close (T041–T044).
- [x] 082/T001 [agent] Policy: A14 and the AGENTS.md test rule rewritten, entry in `planning/changes.md` — covers R1, D1
- [x] 082/T002 [agent] Tooling: `@vitest/coverage-v8` and Stryker with the Vitest runner, scripts `test:cov` and `test:mutate`, a config that excludes `renderer.test.ts` — covers R2, D2
- [ ] 082/T003 [agent] Verify: baseline — coverage per folder and mutation score per functionality with the current suite, time per run, recorded in this spec's Changes — covers R2
- [x] 082/T004 [agent] Inventory: every test file and source file of `src/service` assigned to a functionality (table in this spec) — covers R3, D3
- [x] 082/T005 [agent] Move `scenes` (scene tools, `scenes.ts`, defaults, references, resources, notices, watch, changes) — covers R3, D3
- [ ] 082/T006 [agent] Move `elements` (element tools, element-tree, elements.ts, image-trim, sparse-scene) — covers R3, D3
- [ ] 082/T007 [agent] Move `shots` and `keyframes` — covers R3, D3
- [ ] 082/T008 [agent] Move `assets` (asset tools, asset-*, image-header, image-aspect, image-probe, project-assets) — covers R3, D3
- [ ] 082/T009 [agent] Move `fonts` (font tools, font-check, font-install, font-store, google-fonts, font-middleware) — covers R3, D3
- [ ] 082/T010 [agent] Move `presets` (preset tools, animation tools, built-in) — covers R3, D3
- [ ] 082/T011 [agent] Move `projects` (project tools, project-*, root) — covers R3, D3
- [ ] 082/T012 [agent] Move `speech` (scene_generate_speech, `tts/`, tts-proxy) — covers R3, D3
- [ ] 082/T013 [agent] Move `render` (renderer, exports, image, render-target, fake-renderer, scene_preview, scene_export) — covers R3, D3
- [ ] 082/T014 [agent] Move `compact` and `layout` (layout, contrast, text-extents, scene_inspect_layout) — covers R3, D3
- [ ] 082/T015 [agent] Move `core` (registry, ctx, store, verdict, round) and the cli/mcp tests; update A20, AGENTS.md Layout and README paths — covers R3, D3
- [ ] 082/T016 [agent] Reach: loose tests of `engine`, `model`, `components`, `editor`, `presets` and `src/test/` beside their module; no file without a related one — covers R3, D3
- [ ] 082/T017 [agent] `effects` on `Tool`, declared by the 43 tools; a test that lists them — covers R4, D4
- [ ] 082/T018 [agent] Input generator from the input schema, with its own unit tests — covers R5, D5
- [ ] 082/T019 [agent] Invariants over every tool: never throws, error shape, Spanish message, no side effects, every problem listed, JSON string argument — covers R5, D5
- [ ] 082/T020 [agent] `RULES` and writer adapters; the matrix test; first rules — covers R6, D6
- [ ] 082/T021 [agent] Rules added to the matrix: shot spans and references, limits, fractions, easing, icon and line targets, assets, fonts — covers R6, D6
- [ ] 082/T022 [agent] Metamorphic relations (writers agree, group/ungroup, rename and back) — covers R7, D6
- [ ] 082/T023 [agent] Replay corpus from the QA reports of rounds 6–9, Vitest runner and `pnpm lienzo` runner — covers R8, D7
- [ ] 082/T024 [agent] Rewrite `scenes` tests; delete old files when new ≥ old — covers R9, D8
- [ ] 082/T025 [agent] Rewrite `elements` tests — covers R9, D8
- [ ] 082/T026 [agent] Rewrite `shots` tests — covers R9, D8
- [ ] 082/T027 [agent] Rewrite `presets` tests — covers R9, D8
- [ ] 082/T028 [agent] Rewrite `assets` tests — covers R9, D8
- [ ] 082/T029 [agent] Rewrite `projects` tests — covers R9, D8
- [ ] 082/T030 [agent] Rewrite `fonts` tests — covers R9, D8
- [ ] 082/T031 [agent] Rewrite `speech` tests — covers R9, D8
- [ ] 082/T032 [agent] Rewrite `render` tests — covers R9, D8
- [ ] 082/T033 [agent] Rewrite `compact` and `layout` tests — covers R9, D8
- [ ] 082/T034 [agent] Rewrite `core`, cli and mcp tests; delete `contract.test.ts`, `qa-round-*.test.ts` and the spec-numbered describes — covers R9, D8
- [ ] 082/T035 [agent] Rewrite `engine` tests — covers R9, D8
- [ ] 082/T036 [agent] Rewrite `model` tests — covers R9, D8
- [ ] 082/T037 [agent] Rewrite `components` tests; a test per kind that was missing — covers R9, R10, D8
- [ ] 082/T038 [agent] Tests for `traits` — covers R10
- [ ] 082/T039 [agent] Tests for `export` — covers R10
- [ ] 082/T040 [agent] Rewrite `editor` tests — covers R9, D8
- [ ] 082/T041 [agent] Quality gate: minimum coverage per folder and mutation score for `service`, `model`, `engine`, from the T003 baseline — covers R2
- [ ] 082/T042 [agent] QA process: `planning/qa-log.md`, README and AGENTS.md section, the closed list — covers R11, D9
- [ ] 082/T043 [agent] Review: a fresh agent reads the new suite against R1–R11 and tries to break the matrix (remove a rule from `prepareScene`, add a writer with no adapter) — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11
- [ ] 082/T044 [agent] Verify: typecheck, tests, replay with `pnpm lienzo` on a restarted MCP (commit = `HEAD`), mutation scores against the baseline — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11

## Changes
- 2026-10-28: D2 tooling findings (T002). Stryker 10.1.1 breaks on TypeScript 7 (`ts.parseConfigFileTextToJson` is gone), so `stryker.config.json` points `tsconfigFile` at a file that does not exist, which skips that step and keeps the run in the `.stryker-tmp` copy (not `inPlace`); with pnpm's strict layout the runner must be named in `plugins`. `@vitest/coverage-v8` must match Vitest exactly (5.0.3). A smoke run on `src/model/size.ts` (48 mutants, 85.42%) took 5 minutes because each mutant reruns the heavy contract tests (about 9 per mutant): the baseline of T003 measures time per folder first and runs the service folders with the contract tests only where the rule lives. Why: T003 cannot assume a whole-folder run is cheap. Work: T003.
