# 093 — compact-validation-and-error-paths

## Goal
Unify validation, reference scopes, error paths, and parameter hints across `scene_validate`, `scene_build`, `element_add`, and `background_set` for the five contract findings uncovered in the 2026-11-02 QA audit (`F-05`, `F-06`, `F-11`, `F-12`, `F-15`), keeping tool descriptions and QA log status synchronized. Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V4-dense` and `V5-errors`, 2026-11-02)
- **Origin classification against prior specs (`075`, `076`, `078`, `080`, `082`, `083`, `084`, `090`):**
  - **`F-05` (Partial non-compliance with `080/R5`, `080/D5`, `083/R1-R3` & `090/R1`, Class 1 — `src/model/compact.ts:402-410`, `src/service/scenes/tools/scene-validate.ts:32-39`, `src/service/core/registry.ts:242-260`):**
    - Spec `080/D5` relaxed `elements` and `symbols.*.children` in `CompactSceneInputSchema` (`src/model/compact.ts:402-410`) to `z.unknown()`, but left `width`, `height`, `duration`, `fps`, `size`, `background`, `defaults`, `shots`, and `audioTracks` strict in `tool.input`. Spec `083/D4` closed `083/T002` assuming all `compact` problems were already returned as verdicts, and Spec `090/R1` required the invariant *"for the same content, `compactFile` and `compact` give byte-identical saved scenes, `errors` and `notices`"*.
    - When `compact` inline has a top-level error (e.g. `duration: 601, fps: 61, elements: [{ id: "bad-el", kind: "unknown_kind_xyz" }]`), `callTool` (`src/service/core/registry.ts:242-260`) intercepts it before `scene_validate.run` / `buildCompact`: (1) `scene_validate` fails the tool call (`code: "invalid_input"`) instead of returning `{ valid: false }`, (2) omits `errors[]`, and (3) hides `compact.elements.bad-el.kind`, whereas `compactFile` returns `{ valid: false, errors: [...] }` with all 3 errors (`qa/evidence/v4-dense-limits.json`, `qa/evidence/v5-errors-battery.json`).
  - **`F-06` (Regression introduced in `080/D2` & `082/T024` (`93e66d2`), Class 1 — `src/service/scenes/scene-references.ts:76-77,135-144`, `src/service/scenes/scene-changes.ts:8-23`, `src/service/layout/layout.ts:253,473-479`):**
    - When `placedElements(scene)` (`src/service/scenes/scene-changes.ts:8-23`) was extended in `082/T024` to walk `scene.symbols.*.children` as well as `scene.elements`, `danglingReferences` (`src/service/scenes/scene-references.ts:76-77`) reused `placedElements(scene)` to build the valid `ids` set for `line` attachments.
    - Consequently, `element_add` and `scene_validate` accept a scene-level `line` with `attach: "drop-shade"` (an internal child of `symbols.solardrop`) and suggest symbol child IDs in `unknown_target` errors, while `scene_inspect_layout` (`src/service/layout/layout.ts:253,473-479`) flags it as `dangling_attachment` (`qa/evidence/v5-errors-battery.json` `writerDiscrepancyRepros.line_attached_to_symbol_child`).
  - **`F-11` (Gap in `078/R7`, `080/D6-D7` & `084/R2` (`4c90989`), Class 2 — `src/model/id-path.ts:20-23`, `src/service/elements/tools/element-add.ts:34-39`):**
    - Spec `084/R2` required every writer to reject bad IDs with the path of what the caller sent (`patch.id` in `element_add`), and `patch: { id: " padded " }` returns `path: "patch.id"`.
    - However, `patch: { id: "" }` returns `path: "elements..id"` (`idPath` at `src/model/id-path.ts:21` accepts `""`, which fails `/^elements\.([^.]+)(\..*)?$/` in `atPatch` at `element-add.ts:37`); `patch: { id: "a/b" }` returns `path: "elements.a/b.id"`; and duplicate `patch: { id: "s1-orb-a" }` returns `path: "elements.10.id"` (`idPath` keeps the numeric index `10` per `080/D7` when `twice.length > 1`, so `atPatch` compares `"10" === "s1-orb-a"`).
  - **`F-12` (Overlap between `075/D3` (`rawRuleProblems`) & `expandScene` (`expand.ts:445-449`), Class 1 — `src/service/compact/expand.ts:445-449`, `src/service/compact/build-compact.ts:177-212`, `src/service/scenes/scenes.ts:228-258`):**
    - When `075/D3` and `080/D5` added `rawRuleProblems` (`checkUniqueIds` in `scenes.ts:228`), the older `seenIds` throw in `expandScene` (`expand.ts:447`) was not removed, causing duplicate IDs in `compact.elements` to be reported twice with different messages when another schema error is present, and to fail with `code: "invalid_compact_scene"` instead of `code: "duplicate_id"` in `scene_build`.
  - **`F-15` (Gap in `076` `input-hints` & `077`/`079` `descriptions`, Class 3 — `src/service/core/registry.ts:168-190`, `background_set`):**
    - Calling `background_set` with `values: { color: "#0F172A" }` returns `"preset: Indica un preset o valores\n«values» no es un parámetro de background_set: ¿van dentro de «preset»?"`, naming `"valores"` instead of `"patch"` and suggesting `«preset»` (a string) instead of `«patch»`.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Relax `CompactSceneInputSchema` to a record so `buildCompact` is the single validator for both `compact` and `compactFile`. |
| 2 SRP | `checkUniqueIds` in `scenes.ts:228` is the single owner of duplicate-ID checks; `danglingReferences` checks attachments within their own container scope; test suites separated into single-responsibility units. |
| 3 DRY by composition | One `buildCompact` path for inline `compact` and `compactFile`. |
| 5 Stack standards | Replay corpus entries added for `F-05`, `F-06`, `F-11`, `F-12`, `F-15`; tool descriptions and docs kept in sync. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over all input partitions, boundary limits, compound errors, and writer matrix. |

## Requirements
- R1 (`F-05`): `scene_validate` and `scene_build` validate inline `compact` through `buildCompact` identically to `compactFile`.
  - Partitions:
    - Nominal: Valid compact scene object (`duration: 4, fps: 30, elements: [...]`) passes `scene_validate` with `{ valid: true }` and `scene_build` builds and saves the scene identically to `compactFile`.
    - Boundary: Valid upper limit `duration: 600, fps: 60` succeeds; invalid boundary `duration: 601, fps: 61` reports schema errors in verdicts.
    - Error: `compact` with top-level schema error (`duration: 601, fps: 61`) + element error (`kind: "unknown_kind_xyz"`).
    - Error: `compact` with invalid shot span (`shots: [{ id: "s1", start: 5, end: 2 }]`) + rule error (`icon: "nonexistent"`).
    - Parity: `compactFile` with identical payloads produces identical outputs.
    - Compound: Multiple simultaneous top-level schema errors (`duration: 601, fps: 61, width: 9999`) aggregate in verdicts without premature abort.
  - Invariant: for any compact scene object, `scene_validate` with `compact` and `scene_validate` with `compactFile` return byte-identical `{ valid: false, path, message, errors }` verdicts; `scene_build` returns byte-identical `{ code, path, message, errors }` failures.
- R2 (`F-06`): In `src/service/scenes/scene-references.ts:76-77,135-144`, `line` attachment targets (`a.attach`, `b.attach`, `from`, `to`) are validated strictly against element IDs in the same scope (`scene.elements` for scene-level lines; `symbols.<sId>.children` for lines inside a symbol), and `unknown_target` candidate lists (`ids: ...`) only list IDs from that scope.
  - Partitions:
    - Nominal: Scene-level `line` attached to a scene element (`"s1-orb-a"`) → valid (`ok: true`).
    - Error: Scene-level `line` attached to a symbol's internal child (`"drop-shade"`) via `scene_build`, `scene_create`, `scene_update`, `element_add`, `element_update`, or `scene_validate` → rejected with `code: "unknown_target"`, and `drop-shade` does not appear in the suggested `ids:` list.
    - Nominal: Symbol-internal `line` inside `symbols.sym.children` attached to a sibling child inside `symbols.sym.children` → valid.
    - Error: Symbol-internal `line` inside `symbols.sym.children` attached to a scene-level element ID outside the symbol or another symbol's child → rejected with `code: "unknown_target"`, and suggested `ids:` only contains sibling child IDs in that symbol.
    - Compound: Line with both endpoints (`a.attach` and `b.attach`) referencing invalid targets across container boundaries.
  - Invariant: no scene-level `line` accepted by `danglingReferences` is ever flagged as `dangling_attachment` by `scene_inspect_layout`.
- R3 (`F-11`): In `src/model/id-path.ts:20-23` and `src/service/elements/tools/element-add.ts:34-39`, any validation failure on the newly added element's `id` (`""`, `" padded "`, `"a/b"`, or duplicate ID) reports `path: "patch.id"`.
  - Partitions:
    - Nominal: `element_add` with valid unique `patch: { id: "valid-id" }` succeeds without ID errors.
    - Equivalence class: `patch: { id: "" }` (empty string).
    - Equivalence class: `patch: { id: " padded " }` (whitespace padded).
    - Equivalence class: `patch: { id: "a/b" }` (slash-containing path).
    - Equivalence class: `patch: { id: "<existing-id>" }` (duplicate scene ID).
    - Equivalence class: Nested element added inside a group via `parent: "group"` with invalid `patch.id` (`""`, `"a/b"`, duplicate).
  - Invariant: `element_add` never returns `elements..id`, `elements.a/b.id`, or `elements.<index>.id` for a problem on the new element's `patch.id`.
- R4 (`F-12`): Removing the duplicate `seenIds` check in `src/service/compact/expand.ts:445-449` leaves `checkUniqueIds` (`src/service/scenes/scenes.ts:228-258`) as the single duplicate-ID rule for compact scenes.
  - Partitions:
    - Nominal: Compact scene with all distinct unique IDs builds cleanly.
    - Duplicate only: `compact.elements` with duplicate ID `"dup"` only → fails with `code: "duplicate_id"` and one error entry `"ID duplicado «dup» (ya está en elements.0)"`.
    - Compound: `compact.elements` with duplicate ID `"dup"` + schema error (`opacity: 2`) → `errors` contains one entry for `compact.elements.0.opacity` and one entry for `compact.elements.1.id`.
    - Symbols: Compact scene with duplicate IDs inside `symbols.<name>.children` fails with `code: "duplicate_id"`.
  - Invariant: a duplicate ID in `compact.elements` is reported exactly once and uses `code: "duplicate_id"` across all writers.
- R5 (`F-15`): `background_set` missing-input refinement message reads `"Indica preset o patch"` and `misplacedHint` (`src/service/core/registry.ts:168-190`) suggests `«patch»` when an unknown object parameter (such as `values: { color: "#0F172A" }`) is passed.
  - Partitions:
    - Nominal: `background_set` with valid `patch: { color: "#0F172A" }` succeeds.
    - Nominal: `background_set` with valid `preset: "dark"` succeeds.
    - Missing inputs: `background_set` with neither `preset` nor `patch` fails with `"Indica preset o patch"`.
    - Misplaced object: `background_set` with `{ project, scene, values: { color: "#0F172A" } }` suggests `«patch»`.
    - Boundary/String: `background_set` with `{ project, scene, style: "dark" }` (unknown string) does not suggest placing inside `«patch»`.
  - Invariant: `misplacedHint` never suggests placing an object inside a string parameter (`«preset»`) when an object parameter (`«patch»`) exists on the tool.
- R6: Tool descriptions, agent usage skill, and QA log reflect the validation, error paths, and parameter hint contracts per AGENTS.md rules:
  - `src/service/scenes/tools/background-set.ts` and `src/service/scenes/tools/scene-validate.ts` clarify error hint and validation behaviors.
  - `docs/qa-log.md` status for `F-05`, `F-06`, `F-11`, `F-12`, and `F-15` updated to Closed upon verification.

### Who it serves
All MCP/CLI callers validating scenes, adding elements, or updating backgrounds.

### Out of scope
- Changing the compact schema's supported fields or limits.

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/model/compact.ts:402-410`, define `CompactSceneInputSchema = z.record(z.string(), z.unknown())` so any JSON object passed in `compact` reaches `buildCompact` (`src/service/compact/build-compact.ts`), where `CompactSceneSchema.safeParse` + `rawRuleProblems` + `laterProblems` collect all top-level, element, and rule errors into a single verdict/error list.
- D2 (R2): In `src/service/scenes/scene-references.ts:76-77,135-144`, build separate ID sets for `scene.elements` (walking groups only) and for each `symbols.<sId>.children`, and validate each `line`'s endpoints against the ID set of its own container.
- D3 (R3): In `src/model/id-path.ts:20-23`, only substitute an element's `id` into the path when `typeof id === "string" && id.length > 0 && !id.includes("/")`; in `src/service/elements/tools/element-add.ts:34-39`, pass the added element's numeric index `newIndex` into `atPatch(id, newIndex)` so both `elements.<id>` and `elements.<newIndex>` (as well as nested group child paths) map to `patch.id`.
- D4 (R4): Remove `seenIds` from `src/service/compact/expand.ts:445-449` and let `checkUniqueIds` (`src/service/scenes/scenes.ts:228-258`) report duplicate IDs in both `rawRuleProblems` and `prepareScene`.
- D5 (R5): In `background_set` (`src/service/scenes/tools/background-set.ts:26-29`), update refinement message to `"Indica preset o patch"`, and in `src/service/core/registry.ts:168-190` (`misplacedHint`), prefer object-valued schema keys (`patch`) when the unknown input value is an object.
- D6 (R6): Update `docs/qa-log.md` status for `F-05`, `F-06`, `F-11`, `F-12`, and `F-15` from Open to Closed, and synchronize tool descriptions in `background-set.ts` and agent usage skills in `.agents/skills/lienzo-usage/SKILL.md` with runtime validation behavior.

### Trade-offs & Mitigations
- D1. Pros: makes `compact` and `compactFile` 100% consistent in `scene_validate` and `scene_build`. Cons: `CompactSceneInputSchema` in the MCP JSON schema becomes a generic object at the outer tool wrapper. Mitigation: `CompactSceneSchema` inside `buildCompact` still validates every field and returns the exact same Spanish messages and paths.
- D2. Pros: eliminates `dangling_attachment` discrepancies between `danglingReferences` and `scene_inspect_layout`. Cons: requires separate ID collection traversals per container scope instead of a single flattened list. Mitigation: scenes and symbols have shallow nesting hierarchies; per-container sets are small and transient.
- D3. Pros: eliminates internal/leaked scene indices and paths (`elements..id`, `elements.10.id`) when `element_add` fails on `patch.id`. Cons: requires tracking insertion index to translate both positional and named paths. Mitigation: insertion index is immediately available from `elements.length` (or group `children.length`).
- D4. Pros: removes duplicate error reporting and consolidates duplicate-ID validation into `checkUniqueIds`. Cons: expansion does not early-abort on the first duplicate ID before building subsequent elements. Mitigation: `expandScene` already wraps element builds in `try/catch`, enabling full error aggregation.
- D5. Pros: prevents misleading hint suggestions (suggesting a string parameter `preset` for an object payload). Cons: introduces lightweight type inspection on foreign parameters. Mitigation: heuristic only triggers when unknown parameters are present alongside schema errors.
- D6. Pros: maintains documentation integrity and keeps QA findings auditable across releases per AGENTS.md. Cons: requires updating documentation files alongside code. Mitigation: verified by automated doc and test assertions.

## Tasks
- [x] 093/T001 [agent] Parameterized tests in `src/service/scenes/tools/scene-tools.test.ts` (`test.each` tables with shape `[name, { input, isFile }, { expectedValid, expectedCode, expectedErrors }]` covering R1 partitions: nominal valid compact, boundary limits `duration: 600/601` and `fps: 60/61`, compound top-level schema + element/rule errors, and `compact` vs `compactFile` parity), plus replay corpus case for `F-05` — covers R1
      verified: scene-tools.test.ts compact validation suite and F-05 corpus case pass
- [x] 093/T002 [agent] Parameterized tests in `src/service/scenes/scene-references.test.ts` (`test.each` tables with shape `[name, { scene, line }, { expectedOk, expectedCode, expectedIds }]` covering R2 partitions: scene-level line attached to scene element, scene-level line attached to symbol child rejected with `unknown_target`, symbol-internal line attached to sibling child, symbol-internal line attached to scene element rejected, and compound dangling attachments), plus replay corpus case for `F-06` — covers R2
      verified: scene-references.test.ts line container scoping suite and F-06 corpus case pass
- [x] 093/T003 [agent] Parameterized tests in `src/service/elements/tools/element-tools.test.ts` (`test.each` tables with shape `[name, { parent?, patch }, { expectedPath, expectedCode }]` covering R3 equivalence classes: empty string `""`, whitespace padded `" padded "`, slash path `"a/b"`, duplicate existing ID, and nested group child IDs), plus replay corpus case for `F-11` — covers R3
      verified: element-tools.test.ts ID path mapping suite and F-11 corpus case pass
- [x] 093/T004 [agent] Parameterized tests in `src/service/compact/expand.test.ts` (`test.each` tables with shape `[name, { elements, symbols? }, { expectedCode, expectedErrorsCount }]` covering R4 partitions: nominal distinct IDs, duplicate IDs in elements, duplicate IDs in symbol children, and compound duplicate ID + schema error), plus replay corpus case for `F-12` — covers R4
      verified: expand.test.ts duplicate IDs suite and F-12 corpus case pass
- [x] 093/T005 [agent] Parameterized tests in `src/service/scenes/tools/scene-tools.test.ts` and `src/service/core/tool-input.test.ts` (`test.each` tables with shape `[name, { tool, input }, { expectedMessage, suggestedParam }]` covering R5 partitions: nominal `preset` / `patch`, missing both parameters, unknown object parameter `values: {...}` suggesting `patch`, and unknown string parameter), plus replay corpus case for `F-15` — covers R5
      verified: tool-input.test.ts background_set misplaced hint suite and F-15 corpus case pass
- [x] 093/T006 [agent] Relax `CompactSceneInputSchema` in `src/model/compact.ts:402-410` so inline `compact` routes through `buildCompact` identically to `compactFile` (D1) — covers R1, D1
      verified: CompactSceneInputSchema accepts record shape; top-level and element errors uniform with compactFile
- [x] 093/T007 [agent] Scope `line` attachment target validation in `src/service/scenes/scene-references.ts:76-77,135-144` to container scope (scene elements vs symbol children) (D2) — covers R2, D2
      verified: danglingReferences validates line attach targets strictly within scene or symbol scope
- [x] 093/T008 [agent] Fix `idPath` (`src/model/id-path.ts:20-23`) and `atPatch` (`src/service/elements/tools/element-add.ts:34-39`) so empty, invalid, and duplicate IDs on added elements report `path: "patch.id"` (D3) — covers R3, D3
      verified: idPath ignores empty/slashed ids; atPatch maps insertion index and id to patch.id
- [x] 093/T009 [agent] Remove duplicate `seenIds` check in `src/service/compact/expand.ts:445-449` allowing `checkUniqueIds` to serve as single duplicate-ID authority (D4) — covers R4, D4
      verified: duplicate seenIds check removed in root elements expandScene; checkUniqueIds handles reporting
- [x] 093/T010 [agent] Update `background_set` refinement message (`src/service/scenes/tools/background-set.ts:26-29`) and `misplacedHint` in `src/service/core/registry.ts:168-190` to suggest `patch` for object payloads (D5) — covers R5, D5
      verified: refinement points to patch; missing parameter hint suggests patch on object values
- [x] 093/T011 [agent] Docs: update `docs/qa-log.md` status for `F-05`, `F-06`, `F-11`, `F-12`, and `F-15` to Closed, and verify tool descriptions and `.agents/skills/lienzo-usage/SKILL.md` (D6) — covers R6, D6
      verified: docs/qa-log.md updated with Closed status for all five findings
- [x] 093/T012 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, confirming all test suites and replay corpus cases pass; record `verified:` — covers R1–R6, D1–D6
      verified: vitest (229 files, 2546 tests passed), pnpm replay (40/40 cases passed), pnpm typecheck (clean)

## Changes
- 2026-11-02: Audit corrections applied before task execution (F1–F6):
  - F1: Added Requirement R6, Design D6, and Task T011 covering synchronization of tool descriptions and `.agents/skills/lienzo-usage/SKILL.md`, and updating finding statuses (`F-05`, `F-06`, `F-11`, `F-12`, `F-15`) in `docs/qa-log.md` to Closed per AGENTS.md rules.
  - F2: Added systematic input space partitions across R1–R5 covering nominal valid cases, boundary values (`duration: 600/601`, `fps: 60/61`), symbol cross-container attachments, nested element ID errors in `element_add`, and compound errors (TEST-I1, TEST-I2, TEST-I3).
  - F3: Replaced invalid "Cons: none" in `### Trade-offs & Mitigations` with concrete technical trade-offs and mitigations for D2–D6 (ENG-6).
  - F4: Restructured tasks to respect SRP (ENG-2) by splitting monolithic test and implementation tasks (T001, T004) into dedicated units and isolating documentation updates into T011.
  - F5: Specified explicit parameterized test table shapes (`test.each`), exact test file paths, boundary conditions, and equivalence classes for regression assertions (TEST-I1, TEST-I2, TEST-H2, TEST-I3).
  - F6: Added `## Changes` section documenting audit discrepancies F1–F6.
