# 093 — compact-validation-and-error-paths

## Goal
Unify validation, reference scopes, error paths, and parameter hints across `scene_validate`, `scene_build`, `element_add`, and `background_set` for the five contract findings uncovered in the 2026-11-02 QA audit (`F-05`, `F-06`, `F-11`, `F-12`, `F-15`). Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

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
| 2 SRP | `checkUniqueIds` in `scenes.ts:228` is the single owner of duplicate-ID checks; `danglingReferences` checks attachments within their own container scope. |
| 3 DRY by composition | One `buildCompact` path for inline `compact` and `compactFile`. |
| 5 Stack standards | Replay corpus entries added for `F-05`, `F-06`, `F-11`, `F-12`, `F-15`. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over input partitions and writer matrix. |

## Requirements
- R1 (`F-05`): `scene_validate` and `scene_build` validate inline `compact` through `buildCompact` identically to `compactFile`.
  - Partitions:
    - `compact` with top-level schema error (`duration: 601, fps: 61`) + element error (`kind: "unknown_kind_xyz"`).
    - `compact` with invalid shot span (`shots: [{ id: "s1", start: 5, end: 2 }]`) + rule error (`icon: "nonexistent"`).
    - `compactFile` with the same payloads.
  - Invariant: for any compact scene object, `scene_validate` with `compact` and `scene_validate` with `compactFile` return byte-identical `{ valid: false, path, message, errors }` verdicts; `scene_build` returns byte-identical `{ code, path, message, errors }` failures.
- R2 (`F-06`): In `src/service/scenes/scene-references.ts:76-77,135-144`, `line` attachment targets (`a.attach`, `b.attach`, `from`, `to`) are validated strictly against element IDs in the same scope (`scene.elements` for scene-level lines; `symbols.<sId>.children` for lines inside a symbol), and `unknown_target` candidate lists (`ids: ...`) only list IDs from that scope.
  - Partitions:
    - Scene-level `line` attached to a scene element (`"s1-orb-a"`) → valid (`ok: true`).
    - Scene-level `line` attached to a symbol's internal child (`"drop-shade"`) via `scene_build`, `scene_create`, `scene_update`, `element_add`, `element_update`, or `scene_validate` → rejected with `code: "unknown_target"`, and `drop-shade` does not appear in the suggested `ids:` list.
    - Symbol-internal `line` inside `symbols.sym.children` attached to a sibling child inside `symbols.sym.children` → valid.
  - Invariant: no scene-level `line` accepted by `danglingReferences` is ever flagged as `dangling_attachment` by `scene_inspect_layout`.
- R3 (`F-11`): In `src/model/id-path.ts:20-23` and `src/service/elements/tools/element-add.ts:34-39`, any validation failure on the newly added element's `id` (`""`, `" padded "`, `"a/b"`, or duplicate ID) reports `path: "patch.id"`.
  - Partitions: `patch: { id: "" }`, `patch: { id: " padded " }`, `patch: { id: "a/b" }`, `patch: { id: "<existing-id>" }`.
  - Invariant: `element_add` never returns `elements..id`, `elements.a/b.id`, or `elements.<index>.id` for a problem on the new element's `patch.id`.
- R4 (`F-12`): Removing the duplicate `seenIds` check in `src/service/compact/expand.ts:445-449` leaves `checkUniqueIds` (`src/service/scenes/scenes.ts:228-258`) as the single duplicate-ID rule for compact scenes.
  - Partitions:
    - `compact.elements` with duplicate ID `"dup"` only → fails with `code: "duplicate_id"` and one error entry `"ID duplicado «dup» (ya está en elements.0)"`.
    - `compact.elements` with duplicate ID `"dup"` + schema error (`opacity: 2`) → `errors` contains one entry for `compact.elements.0.opacity` and one entry for `compact.elements.1.id`.
  - Invariant: a duplicate ID in `compact.elements` is reported exactly once and uses `code: "duplicate_id"` across all writers.
- R5 (`F-15`): `background_set` missing-input refinement message reads `"Indica preset o patch"` and `misplacedHint` (`src/service/core/registry.ts:168-190`) suggests `«patch»` when an unknown object parameter (such as `values: { color: "#0F172A" }`) is passed.
  - Partitions: `background_set` with neither `preset` nor `patch`; `background_set` with `{ project, scene, values: { color: "#0F172A" } }`.
  - Invariant: `misplacedHint` never suggests placing an object inside a string parameter (`«preset»`) when an object parameter (`«patch»`) exists on the tool.

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
- D3 (R3): In `src/model/id-path.ts:20-23`, only substitute an element's `id` into the path when `typeof id === "string" && id.length > 0 && !id.includes("/")`; in `src/service/elements/tools/element-add.ts:34-39`, pass the added element's numeric index `newIndex` into `atPatch(id, newIndex)` so both `elements.<id>` and `elements.<newIndex>` map to `patch`.
- D4 (R4): Remove `seenIds` from `src/service/compact/expand.ts:445-449` and let `checkUniqueIds` (`src/service/scenes/scenes.ts:228-258`) report duplicate IDs in both `rawRuleProblems` and `prepareScene`.
- D5 (R5): In `background_set`, change the refinement message to `"Indica preset o patch"`, and in `src/service/core/registry.ts:178-189` (`misplacedHint`), prefer object-valued schema keys (`patch`) when the unknown input value is an object.

### Trade-offs & Mitigations
- D1. Pros: makes `compact` and `compactFile` 100% consistent in `scene_validate` and `scene_build`. Cons: `CompactSceneInputSchema` in the MCP JSON schema becomes a generic object at the outer tool wrapper. Mitigation: `CompactSceneSchema` inside `buildCompact` still validates every field and returns the exact same Spanish messages and paths.
- D2–D5. Pros: removes duplicate code in `expand.ts`, fixes misleading paths/hints, and closes the `dangling_attachment` gap between `danglingReferences` and `scene_inspect_layout`. Cons: none. Mitigation: guarded by `matrix.test.ts` and new replay corpus cases.

## Tasks
- [ ] 093/T001 [agent] Write failing tests in `src/service/scenes/tools/scene-tools.test.ts`, `src/service/elements/tools/element-tools.test.ts`, and `src/service/contract/` covering R1–R5 partitions, plus replay corpus cases for `F-05`, `F-06`, `F-11`, `F-12`, and `F-15` — covers R1–R5
- [ ] 093/T002 [agent] Relax `CompactSceneInputSchema` in `src/model/compact.ts:402-410` so inline `compact` runs through `buildCompact` identically to `compactFile` (D1) — covers R1, D1
- [ ] 093/T003 [agent] Scope `line` attachment target validation in `src/service/scenes/scene-references.ts:76-77,135-144` to `scene.elements` (or the enclosing symbol's `children`) (D2) — covers R2, D2
- [ ] 093/T004 [agent] Fix `idPath` (`src/model/id-path.ts:20-23`) and `atPatch` (`src/service/elements/tools/element-add.ts:34-39`) for `""`, `"a/b"`, and duplicate IDs (D3), and remove the duplicate `seenIds` throw in `src/service/compact/expand.ts:445-449` (D4) — covers R3, R4, D3, D4
- [ ] 093/T005 [agent] Update `background_set` refinement message and `misplacedHint` in `src/service/core/registry.ts:168-190` to name `patch` (D5) — covers R5, D5
- [ ] 093/T006 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, update `docs/qa-log.md` status for `F-05`, `F-06`, `F-11`, `F-12`, and `F-15`, and record `verified:` — covers R1–R5, D1–D5
