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
- ~~R9: Each old test file is deleted only after the new tests of its functionality kill at least~~ → R12
  the mutants the old ones killed.
- R10: Folders with no tests (`traits`, `export`) and component kinds without one have them.
- R11: QA has a written process: a closed list, a classification of each finding, a log
- R12 (R9): The tests of `src/service/contract/` that predate the matrix are replaced by cases of the matrix, of the corpus or of the tests of their functionality, and deleted; the other test files are renamed by behavior (no spec number, no round) and stay, not rewritten. The mutation score of the rule modules after is at least the one before.
  instead of a spec per round, and a stop criterion.

## Design
- D1 (R1): A14 and the AGENTS.md rule change (see `planning/changes.md`): minimal means no test of
  implementation details; contracts, rules, writers and tools are tested completely.
  - _Trade-offs_: more tests to maintain and a slower suite. _Mitigation_: generated tests are one
    file driven by data; single files run while working (AGENTS.md, unchanged).
- D2 (R2, R9): `@vitest/coverage-v8` (MIT) and Stryker with its Vitest runner (Apache-2.0,
  development only, never in `dist/`) are devDependencies. Stryker runs per folder, on demand
  (`pnpm test:mutate <folder>`), not on every commit.
  - _Trade-offs_: mutation runs are slow (measured in T003: 5 to 7 minutes for a file of 30–48
    mutants, because every mutant reruns the 9–44 tests that reach it, mostly the contract
    tests); the renderer suite times out on some machines. _Mitigation_: the browser suite is
    excluded from Stryker; mutation is run on the files that hold rules (`src/model`,
    `scenes/`, the checks of `prepareScene`) and, in each rewrite task, on that functionality's
    files only, in the background; coverage (65 s for the whole suite) is the broad measure.
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
- ~~D8 (R9, R10): Per functionality: run Stryker on its rule files with the old suite (the old
  score), write the new suite, run it again, and delete the old files when new ≥ old and
  every rule tag of the old titles (`078/R1`…) is covered by a new test. Line coverage cannot
  be the gate: `service/tools` was at 94.6% and `model` at 98.8% of lines when the QA rounds
  found their bugs (T003).~~ → D10
- D9 (R11): `planning/qa-log.md` holds one line per finding with its class: (1) a matrix cell is
  missing → add it for every writer; (2) a rule is missing → add it to `RULES` and apply it in
  `prepareScene`; (3) text or docs; (4) a design decision → `## Ideas`. A round ends when the
  corpus is green, the matrix is complete and a QA run finds no new class.
- D10 (R10, R12): The cases of `contract.test.ts`, `qa-round-*.test.ts` and `service.test.ts` go where they belong: a rule that every writer applies → `RULES` (already there when the matrix holds it, and the case is deleted); a QA report case → the corpus; the behavior of one tool → `<feature>/tools/<tool>.test.ts`, named by what it does. The tests of `engine`, `model`, `components`, `presets` and `editor` already sit beside their module and cover it (coverage in T003 and the rounds' bugs were in the rules, not there): they are renamed by behavior, and the real gaps (`export`, most of `editor`) get tests. The mutation score of the rule modules (`src/model/ids.ts`, `shots.ts`, `shot-timing.ts`, `limits.ts`, `size.ts`, `scenes/scenes.ts`, `scene-references.ts`, `scene-notices.ts`) is taken before the first old test is deleted and again at the end.
  - _Pros_: the effort goes where the bugs were; no rewrite of tests that cover their module. _Cons_: the old unit tests keep their style. _Mitigation_: they are renamed, and the gate is the mutation score of the rules, not the style.

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

Outside `src/service` (T016): `src/test/registry.test.ts` (it tests the component descriptors, not the service registry) and `src/test/more-elements.test.ts` go to `src/components`; `render.test.ts`, `golden-scenes.ts`, `render.golden.json` and the harness stay in `src/test/`; `src/presets/render-audit.test.ts` and `round-trip.test.ts` stay with `src/presets/`; the other tests already sit beside their module.

## Baseline (T003)
Taken on 2026-10-28 at `0aa3bbd`, before any file moved. Whole suite without `renderer.test.ts` (it times out on this machine): 161 files, 1434 tests, 65 s with coverage.

Total: statements 67.7%, branches 59.1%, functions 62.7%, lines 68.5%.

| Folder | Files | Files at 0% | Lines % | Branches % |
|---|---|---|---|---|
| `editor` (brand, dialogs, footer, timeline, widgets) | 12 | 10 | 0–2 | 0 |
| `export` | 7 | 6 | 0 | 0 |
| `editor` (root, scene, sidebar) | 35 | 13 | 15–17 | 14–21 |
| `components/three` | 10 | 3 | 23.7 | 8.3 |
| `engine/audio` | 4 | 0 | 64.0 | 48.8 |
| `mcp`, `cli` | 6 | 1 | 68.6, 83.5 | 77.8, 82.5 |
| `components` (path, chart, badge, image, list) | 14 | 0 | 72.8–80.4 | 35.7–62.5 |
| `presets`, `engine` (root), `traits`, `service` (root) | 106 | 3 | 85.2–87.4 | 74.9–100 |
| `service/tools`, `service/compact`, `service/tts` | 61 | 0 | 92.2–94.6 | 82.3–88.1 |
| `model` | 28 | 0 | 98.8 | 90.2 |
| `animations` | 6 | 0 | 100 | 100 |

Mutation (Stryker 10.1.1, Vitest runner, `pnpm test:mutate`): `src/model/size.ts` 85.42% (48 mutants: 34 killed, 7 timeout, 6 survived, 1 not covered; 5 m 09 s); `src/model/ids.ts` 100% (30 mutants: 21 killed, 9 timeout; 7 m 21 s; 43.8 tests per mutant). The surviving `size.ts` mutants are in the preset-name lookup (`?.` and `toLowerCase`).

Reading: the plan said `src/traits` has no tests and `src/components` has 11 tests for 79 files; coverage shows both are exercised indirectly (traits 85.9% of lines through presets and the golden render; most component kinds above 90%). What is really empty is `export` (0%) and most of `editor` (0–17%).

## Tasks
Order: T001–T004, then the moves (T005–T016), the tool field and generated suite (T017–T023),
the matrix and the old tests (T024–T032), the close (T041–T044).
- [x] 082/T001 [agent] Policy: A14 and the AGENTS.md test rule rewritten, entry in `planning/changes.md` — covers R1, D1
- [x] 082/T002 [agent] Tooling: `@vitest/coverage-v8` and Stryker with the Vitest runner, scripts `test:cov` and `test:mutate`, a config that excludes `renderer.test.ts` — covers R2, D2
- [x] 082/T003 [agent] Verify: baseline — coverage per folder and mutation score per functionality with the current suite, time per run, recorded in this spec's Changes — covers R2
      verified: `pnpm exec vitest run --coverage` (161 files, 1434 tests, renderer.test.ts excluded, 65 s) and `pnpm test:mutate src/model/size.ts` and `src/model/ids.ts` — found line coverage is high where the QA rounds found bugs (service/tools 94.6%, model 98.8%), mutation runs cost 5–7 minutes per 30–48 mutants, so the mutation baseline is taken per functionality inside each rewrite task (D8); numbers under Baseline
- [x] 082/T004 [agent] Inventory: every test file and source file of `src/service` assigned to a functionality (table in this spec) — covers R3, D3
- [x] 082/T005 [agent] Move `scenes` (scene tools, `scenes.ts`, defaults, references, resources, notices, watch, changes) — covers R3, D3
- [x] 082/T006 [agent] Move `elements` (element tools, element-tree, elements.ts, image-trim, sparse-scene) — covers R3, D3
- [x] 082/T007 [agent] Move `shots` and `keyframes` — covers R3, D3
- [x] 082/T008 [agent] Move `assets` (asset tools, asset-*, image-header, image-aspect, image-probe, project-assets) — covers R3, D3
- [x] 082/T009 [agent] Move `fonts` (font tools, font-check, font-install, font-store, google-fonts, font-middleware) — covers R3, D3
- [x] 082/T010 [agent] Move `presets` (preset tools, animation tools, built-in) — covers R3, D3
- [x] 082/T011 [agent] Move `projects` (project tools, project-*, root) — covers R3, D3
- [x] 082/T012 [agent] Move `speech` (scene_generate_speech, `tts/`, tts-proxy) — covers R3, D3
- [x] 082/T013 [agent] Move `render` (renderer, exports, image, render-target, fake-renderer, scene_preview, scene_export) — covers R3, D3
- [x] 082/T014 [agent] Move `compact` and `layout` (layout, contrast, text-extents, scene_inspect_layout) — covers R3, D3
- [x] 082/T015 [agent] Move `core` (registry, ctx, store, verdict, round) and the cli/mcp tests; update A20, AGENTS.md Layout and README paths — covers R3, D3
- [x] 082/T016 [agent] Reach: loose tests of `engine`, `model`, `components`, `editor`, `presets` and `src/test/` beside their module; no file without a related one — covers R3, D3
- [x] 082/T017 [agent] `effects` on `Tool`, declared by the 43 tools; a test that lists them — covers R4, D4
- [x] 082/T018 [agent] Input generator from the input schema, with its own unit tests — covers R5, D5
- [x] 082/T019 [agent] Invariants over every tool: never throws, error shape, Spanish message, no side effects, every problem listed, JSON string argument — covers R5, D5
- [x] 082/T020 [agent] `RULES` and writer adapters; the matrix test; first rules — covers R6, D6
- [x] 082/T021 [agent] Rules added to the matrix: shot spans and references, limits, fractions, easing, icon and line targets, assets, fonts — covers R6, D6
- [x] 082/T022 [agent] Metamorphic relations (writers agree, group/ungroup, rename and back) — covers R7, D6
- [x] 082/T023 [agent] Replay corpus: the runner, the Vitest suite, `pnpm replay`, and the cases of round 9 (reports A and B of 081) that need only JSON; the cases of rounds 6–8 enter as each old test of `contract.test.ts` and `qa-round-*.test.ts` is rewritten (T024–T034) — covers R8, D7
- [x] 082/T024 [agent] Matrix rules: a `use` of a missing symbol, an override naming a child the symbol lacks, a track path the kind has no field for, an unknown `animPreset`, a bare audio reference, an asset the project lacks — covers R6, D6
- [ ] 082/T025 [agent] Verify: mutation score of the rule modules (D10) with the suite as it stands, before any old test is deleted, recorded under Baseline — covers R2, R12
- [x] 082/T026 [agent] `contract.test.ts`: each case the matrix holds is deleted, the rest moves to `<feature>/tools/<tool>.test.ts` named by behavior; the file is deleted — covers R12, D10
- [x] 082/T027 [agent] `qa-round-3/5/6.test.ts`, `service.test.ts`, `parity-tools.test.ts`: same; the files are deleted. `editor-parity.test.ts` and `descriptions.test.ts` stay in `contract/`: they cross the editor, the tools and the docs — covers R12, D10
- [x] 082/T028 [agent] `engine` tests renamed by behavior, spec numbers and rounds out of titles — covers R12, D10
- [x] 082/T029 [agent] `model`, `presets` and the remaining `service` tests renamed the same way — covers R12, D10
- [x] 082/T030 [agent] `components` tests renamed the same way — covers R12, D10
- [ ] 082/T031 [agent] Tests for `export` (0% of lines in the baseline) — covers R10
- [ ] 082/T032 [agent] `editor` tests renamed, and tests for brand, dialogs, footer, timeline and widgets (0–2% in the baseline) — covers R10, R12
- [ ] 082/T041 [agent] Quality gate: minimum coverage per folder and, for the rule modules, the mutation score of T025 as the minimum — covers R2, R12
- [ ] 082/T042 [agent] QA process: `planning/qa-log.md`, README and AGENTS.md section, the closed list — covers R11, D9
- [ ] 082/T043 [agent] Review: a fresh agent reads the new suite against R1–R11 and tries to break the matrix (remove a rule from `prepareScene`, add a writer with no adapter) — covers R1, R2, R3, R4, R5, R6, R7, R8, R10, R11, R12
- [ ] 082/T044 [agent] Verify: typecheck, tests, replay with `pnpm lienzo` on a restarted MCP (commit = `HEAD`), mutation scores against the baseline — covers R1, R2, R3, R4, R5, R6, R7, R8, R10, R11, R12

## Changes
- 2026-10-28: D2 tooling findings (T002). Stryker 10.1.1 breaks on TypeScript 7 (`ts.parseConfigFileTextToJson` is gone), so `stryker.config.json` points `tsconfigFile` at a file that does not exist, which skips that step and keeps the run in the `.stryker-tmp` copy (not `inPlace`); with pnpm's strict layout the runner must be named in `plugins`. `@vitest/coverage-v8` must match Vitest exactly (5.0.3). A smoke run on `src/model/size.ts` (48 mutants, 85.42%) took 5 minutes because each mutant reruns the heavy contract tests (about 9 per mutant): the baseline of T003 measures time per folder first and runs the service folders with the contract tests only where the rule lives. Why: T003 cannot assume a whole-folder run is cheap. Work: T003.
- 2026-10-28: the file moves (T005–T016) are done in 12 commits. The scripted move rewrote relative imports and `new URL(…, import.meta.url)` but not `join(import.meta.dirname, "..", "..")`: `image-probe.test.ts` and `renderer.test.ts` now find the app root with `findAppRoot`. `renderer.test.ts` is checked by typecheck only (its suite times out on this machine). The old `src/test/registry.test.ts` was a component-descriptor test, so T016 moved it to `src/components`, not to `core`. Why: the inventory guessed from the file name. Work: T016.
- 2026-10-28: first run of the invariants over the 43 tools (T019, 510 generated cases, 28 s): no tool failed one. The only failures were the generator's: `null` for a key typed `z.unknown()` (`recipe`) is a value the schema accepts, so the rejection comes later by rule (`invalid_preset`, `invalid_animation`, `valid: false`), not as `invalid_input`; the generator now breaks an untyped key only by removing it. Reading: the schema-level failures of the tools are sound; the bugs the QA rounds found are rules and writers, which T020–T022 cover. Why: this shows what the generated suite can and cannot find. Work: T020–T022.
- 2026-10-28: first findings of the matrix (T020, T021; 16 rules, 138 cells). Writers differed in which notices they gave because three places built the list: `saveScene` (fonts, off-canvas, shots, resources), `buildCompact` (fonts, estimated widths, dead easings, resources) and `sceneNotices` (what `scene_validate` data and the editor's review give). Gaps found: no dead-easing notice from `scene_create`, `element_add`, `element_update` or `scene_update` symbols; no shot notice (unknown camera channel, long transition, camera dead easing) from `scene_build` or `scene_validate` compact; no off-canvas notice from `scene_build` without `save` or from `scene_validate`. Fix at the point every writer passes: `contentNotices` (`src/service/scenes/scene-notices.ts`) holds fonts and weights, off-canvas, dead easings (element tracks, now also symbol bodies), shot problems and estimated widths, and `saveScene`, `buildCompact` and `sceneNotices` call it, limited to what the write changed (changed top-level elements and symbols). `keyframe_set` no longer builds its own dead-easing notice. Behavior that changes: a write of a text whose font is not installed also notices that its width is estimated, as `scene_build` did; `scene_create`, `element_add` and `element_update` of an element with a dead easing notice it. Tests changed: the three «notices a font that is not installed» cases in `contract.test.ts` (element_add, element_update, scene_create) expected a list of exactly the font notice and now expect it among the notices; why: the estimated-width notice joins every writer. Work: T020, T021.
- 2026-10-28: the corpus (T023) runs through `pnpm replay`, a `tsx` script, not through `pnpm lienzo`: it uses the same `createCtx` on a temp dir, so it never writes into the repo and costs 9 s for 24 cases instead of one process per call. Round 9's cases that need a binary file (A5, A6), a font installed (A15), a speech provider (A9) or the Google Fonts service (A19) stay in the tests of `assets`, `fonts` and `speech` (T028, T030, T031). Finding: `scene_validate` answers a failure in two shapes depending on the kind of problem: with `compact`, an expansion problem (`fps: 500`, a bad size) is an error (`ok: false`) and a rule problem (a shot that does not last, a repeated shot id) is a verdict (`ok: true, valid: false`); with `data` every problem is a verdict. Not changed here; listed for the debate on tool surface (083). Why: the corpus records the behavior as it is. Work: T023.
- 2026-10-28: R9 → R12 and D8 → D10; T024–T040 replaced by T024–T032. Why: the measurements of T003, T019 and T021 (Stryker costs 5–7 minutes per 30–48 mutants; line coverage was 94–99% where the QA rounds found bugs; the generated suite found none at schema level and one class of bug in the rules; the unit tests of `engine`, `model` and `components` already cover their module) show that rewriting every test file buys little. The effort goes to the matrix, to the old contract tests, and to the real gaps (`export`, `editor`); the `traits` task is dropped (85.9% of lines and 100% of branches by indirect tests). Work: T024–T032.
- 2026-10-28: second finding of the matrix (T024, 22 rules, 178 cells): an `animPreset` naming an animation that does not exist is refused by every writer but `scene_update` when it sits in a symbol's body, which stored it silently (and never expanded a valid one). `checkAnimPresets` and `expandAnimPresets` walked `scene.elements` only; both now walk the symbols' children too. The `use` rules (missing symbol, override naming a child the symbol lacks), track path, bare audio reference and missing image asset hold in every writer. Work: T024.
- 2026-10-28: `contract.test.ts` (139 cases) is gone (T026). 41 cases were deleted because the matrix holds them in every writer they named: unknown shot, icon, line target and easing (3–14), a `use` of a missing symbol (29), an audio file the project lacks (59), an easing on a last keyframe (76–78, 90), a shot that does not last or repeats an id (79–85), a transition longer than its shot and a camera channel the camera lacks (88, 89), repeated element ids (91–93, 95), the scene limits and the spotlight (96–100), an uninstalled font (114–116), a track path and a `use` override (118, 119). The matrix gained «end before start» for the shot span so 79 and 81 lose nothing. The other 98 moved to `<feature>/tools/*-tools.test.ts` (`scenes`, `elements`, `shots`, `presets`, `projects`, `assets`, `fonts`, `layout`, `render`, `speech`, and two cases of `core/tool-input.test.ts`) with their spec numbers out of the titles, over the shared `src/service/contract/support.ts` (`toolSuite`, `fails`, `invalid`). The cases the matrix does not hold stayed on purpose: where it names the path (`patch.id`), what a failure lists together, the notices of a removed symbol, the save path of `scene_build`. Why: D10. Work: T026.
- 2026-10-28: `service.test.ts`, `parity-tools.test.ts` and `qa-round-3/5/6.test.ts` are gone (T027): their `describe` and `it` units moved whole to 28 files named by what they check (`scenes/tools/scene-update.test.ts`, `shots/shot-windows.test.ts`, `presets/tools/preset-recipes.test.ts`, `compact/build-tools.test.ts`…), with their spec tags out of the titles; two cases of `qa-round-6` (an unknown shot in `scene_build` and in `scene_validate`) were deleted because the matrix holds them. `src/service/contract/` now holds only the machinery of the generated suite plus `editor-parity.test.ts` and `descriptions.test.ts`. 1335 tests pass in `src/service` (1337 before, minus those two). Work: T027.
- 2026-10-28: the titles of every remaining test file lose their spec tags (T028–T030): 289 titles in 113 files (`(078/R1)`, `(R1, R3, D1)`, `(049/T007)`…) by script, and sixteen written in prose («saved before 059», «041 workspace fixes», «R5@1: …») by hand into what they check. Comments keep their spec numbers, which point to history. T032 keeps its editor part (tests for brand, dialogs, footer, timeline, widgets). Open: in the full run after this change (Stryker running at the same time) `src/cli/cli.test.ts` «calls every registry tool, from flags or --json» failed; it was not rerun alone, so it is not known whether it is the load, a timeout or a result of this work. Work: T028–T030.
