# 078 — qa-round-7-fixes

## Goal
QA round 7 (144 calls over all 44 tools on `main` e8da132, through the registry the MCP
server serves) confirmed 074–077 and found eight problems; a second report adds one from a
real MCP client. Two come from the same root as earlier rounds, a rule declared per field or
per writer instead of once:
- Opacity ranges: `num()` has a UI range (`min`/`max`, the inspector slider) and a check
  (`bounds`); three opacity helpers and ten inline fields set only `max: 1`, so
  `keyframe_set opacity: 5` passes on 22 kinds (it fails on `rect`, which the round-3 test
  uses).
- 075/D2 moves a shot's bound tracks on any `start` change; an NLE moves keyframes with a
  moved clip but leaves them in place when an edge is trimmed, and the editor's "Inicio"
  field trims.

The rest: `use` naming a missing symbol passes silently; `element_add` errors name the new
element by its generated id; zod's own messages are English (A16 wants Spanish);
`preset_validate` packs all problems in one; some error paths and codes do not match the
parameter (`scene_delete` → `name`, `keyframe_remove` → `t`, compact duplicate id →
`compact`, `project_create` → `project_create_failed`); a missing asset reads "no pertenece",
an off-canvas box is unrounded, renaming a built-in preset says "No existe". And clients that
send an object argument as a JSON string (`patch: "{…}"`) are rejected.

When this spec is done each is fixed at its cause, with a regression test, and the contract
test holds the opacity and reference rules for every kind.

## Requirements
- R1: Every opacity field of every kind (`opacity`, `*.opacity`, `bgOpacity`, `opacityMin/Max`)
  accepts only 0–1, as a value and as a keyframe.
- R2: Changing a shot's `start` and `end` by the same amount moves its bound elements' tracks
  and its camera keys (a move); changing one edge, or the length, leaves them where they are
  (a trim). Rebinding and removal keep 075's rule.
- R3: A `use` naming a symbol the scene lacks fails like an unknown shot, listing the
  symbols; removing a symbol a `use` names gives a notice, like a removed line target.
- R4: An `element_add` failure about the new element points at its input: `patch.<field>`.
- R5: Validation messages from zod are Spanish.
- R6: `preset_validate` and `preset_save` list each problem in `errors`, each at its path.
- R7: Error paths name the parameter given (`scene` in `scene_delete`, `path` in
  `keyframe_remove`, `compact.elements.N.id` for a duplicate id) and an existing name fails
  with `exists` in `project_create`.
- R8: A missing asset says it does not exist; the off-canvas notice is rounded; renaming or
  deleting a built-in preset says it is built in.
- R9: A top-level object or array argument sent as a JSON string is read as that value.

## Design
- D1 (R1): `fraction(value, o)` in `src/components/fields/field.ts`: `num` with `max: 1`,
  `step: 0.01` and `bounds: [0, 1]`. `elementOpacity`, the stroke and particles helpers and
  every inline opacity field use it; the local helpers go. A test walks every registered
  descriptor and checks that each number field whose key holds `opacity` has `bounds [0, 1]`.
  - _Trade-offs_: A stored value outside 0–1 stops a scene from opening.
  - _Mitigation_: A scan of the 65 JSON files in `presets/` and `projects/` finds none; the
    editor's sliders already capped at 1.
- D2 (R2): In `setShotIn` the shift is `start − old.start` only when the new length equals the
  old one; otherwise 0. The tool description and the docs say "move" vs "trim". Checked
  against Premiere users' reports: in-point trims leave keyframes at their timeline place,
  moving a clip carries them.
  - _Trade-offs_: The editor edits `start` and `end` one field at a time, so it trims and never
    moves; moving a shot with its animation is `shot_set` with both.
  - _Mitigation_: Stated in the shots section's docs and the usage skill; a move control is
    an idea, not built (YAGNI).
- D3 (R3): `danglingReferences` (`src/service/scene-references.ts`) checks a changed `use`'s
  `symbol` against `scene.symbols`; `resourceNotices` notes a `use` whose symbol the write
  removed.
- D4 (R4): `remapFailure(error, from, to)` in `src/service/registry.ts` rewrites a failure's
  path prefix in `path`, `message` lines and `errors`; `buildCompact` (prefix `compact`) and
  `element_add` (`elements.<id>` → `patch`) use it.
- D5 (R5): `z.config(z.locales.es())` once in `src/model/zod-locale.ts`, imported first by
  `src/model/schema.ts` and `src/model/compact.ts`, which every entry loads. Zod is the
  stack's validator, used directly as everywhere in the codebase; no wrapper (KISS).
  - _Trade-offs_: Zod's Spanish wording ("Demasiado pequeño: se esperaba que número fuera
    >=0") is generic.
  - _Mitigation_: Our own messages (colors, sizes, references) stay as they are.
- D6 (R6): `preset_validate` and `preset_save` fail through `failAll` with `parsed.issues`.
- D7 (R7): `removeIn(ctx, folder, name, field)`; `keyframe_remove` path `path`; the compact
  duplicate id throws at `elements.N.id`; `project_create` maps "ya existe" to `exists`.
- D8 (R8): `checkAsset` says "no existe en assets/" for a missing file of the project;
  the off-canvas notice uses `round2`; `refuseBuiltIn(ctx, name, field)` next to
  `findPreset` (`src/service/scenes.ts`), used by `preset_rename` and `preset_delete`.
- D9 (R9): `jsonArgs(input, issues)` in `src/service/registry.ts`: for a top-level key whose
  issue expects an object or array and whose value is a string that parses to one, the
  parsed value; `callTool` re-parses once with it. Checked against client reports (Claude
  Desktop, Cowork, Cursor stringify object arguments; servers accept both as mitigation).
  - _Trade-offs_: Looser than the schema says.
  - _Mitigation_: Only top-level keys, only when the string parses to the type the schema
    expects, and the parsed value still goes through the full schema.

## Tasks
- [x] 078/T001 [agent] `fraction()` for every opacity field; descriptor test — covers R1, D1
- [x] 078/T002 [agent] Shot move vs trim in `setShotIn`; descriptions — covers R2, D2
- [x] 078/T003 [agent] Unknown symbol fails; removed symbol notice — covers R3, D3
- [x] 078/T004 [agent] `remapFailure`; `element_add` errors at `patch` — covers R4, D4
- [x] 078/T005 [agent] Zod messages in Spanish — covers R5, D5
- [x] 078/T006 [agent] Recipe problems one by one — covers R6, D6
- [x] 078/T007 [agent] Paths and codes: `scene_delete`, `keyframe_remove`, duplicate id, `project_create` — covers R7, D7
- [x] 078/T008 [agent] Missing asset wording, rounded off-canvas notice, built-in preset refusal — covers R8, D8
- [x] 078/T009 [agent] Object arguments sent as JSON strings — covers R9, D9
- [ ] 078/T010 [agent] Docs: README, usage skill, components, AGENTS.md — covers R1, R2, R3, R5, R9
- [ ] 078/T011 [agent] Verify: typecheck, lint on touched files, tests, the round-7 script re-run (144 calls) plus the new cases — covers R1, R2, R3, R4, R5, R6, R7, R8, R9

## Changes
- 2026-10-27: `service.test.ts` expected `elements.bad.animPreset` for an `element_add` naming an unknown animation preset; R4 points that failure at the input, `patch.animPreset`, so the expectation changes. Work: T004.
- 2026-10-27: `brand-constraining.test.ts` expected "no pertenece a los assets" for `assets/unapproved-foreign-image.png`, a missing file of the same project (the misleading wording R8 fixes); it now expects "no existe en assets/". `parity-tools.test.ts` expected `not_found` when deleting a built-in preset; R8 answers `built_in`. Work: T008.
