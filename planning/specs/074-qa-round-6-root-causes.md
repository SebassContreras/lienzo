# 074 — qa-round-6-root-causes

## Goal
The sixth QA run (42 tools on a scratch project) lists 8 bugs, 5 inconsistencies, 7 weak
checks and 5 learning gaps. Specs 067–073 fixed each report case by case: several fixes were a
notice where the input was simply wrong (069/D4, 069/D13), helpers were duplicated
(two `slugify`), and each tool resolved its own defaults, so every round found the same
families of failure in a new tool. When this spec is done, the round-6 cases are fixed at
their cause: one rule for wrong input (reject with the valid options), one source for scene
defaults, sizes, slugs and asset paths, preset timing aligned to shots, and a
contract test that walks the tools with the same wrong inputs.

## Requirements
- R1: Wrong input is rejected, not noticed. A `size` that is no `WxH`, ratio or size preset;
  a `shot` naming no shot of the scene; an icon lucide does not have (after normalizing its
  case); a line end attached to an id the scene lacks (on an element the write changed); an
  `element_move` index past the last sibling; an unknown easing; a recipe with unknown keys or
  a `set` value of the wrong type. Every such error lists the valid options. Notices stay for
  what is valid but may surprise (a missing asset file, a target the same write removed).
- R2: `size` takes `WxH`, `[w, h]`, a ratio (`9:16`, `4:5`, `1:1`, `16:9`) and a preset name.
- R3: One source of scene defaults: `scene_create`, and `scene_build` with or without `save`,
  start from the project's canvas (size, duration, fps, palette background); descriptions say
  so.
- R4: A preset element (counter, chart, progress, draw-on) bound to a shot runs its recipe
  tracks from the shot's start, in `scene_build` and `element_add`.
- R5: Asset references are stored in one form (`/projects/<project>/assets/<path>`), so a bare
  `logos/x.png` from `asset_add`'s `filename` survives `asset_rename`.
- R6: Names become slugs with accents folded (`Caja Ámbar` → `caja-ambar`) by one `slugify`;
  files stored under the old slug are still found.
- R7: In compact, `from`/`to` are a line's targets on a line and the kind's own fields
  elsewhere (`to: 1500` on a counter or a counter preset).
- R8: Camera tracks take the same short form in `shot_set` as in `scene_build` (easing
  optional); camera keyframe `t` is scene time, documented, with a notice for keys outside
  the shot.
- R9: `scene_validate` reports every problem it finds (errors list), not only the first;
  `data` may hold partial elements (filled from their kind's defaults, as `scene_create`
  does); error paths use the element's id when the input gave one, else its index.
- R10: `element_group` takes an optional `id` for the new group and reports every bad id in
  one error.
- R11: A text with no `w` placed by `at` that would be wider than the container wraps at
  the container's width minus the safe margins.
- R12: `scene_get` returns each element as `id`, `kind` and the fields that differ from its
  kind's defaults, unless `full: true`.
- R13: `keyframe_remove` with no keyframe at `t` lists the track's times; `effects.glow` and
  other element fields given under `effects` say which element field to use.
- R14: Tool descriptions document the preset recipe format (`set`, `traits`), the two
  animation models (`anim` in/loop/out vs `tracks`) and the `anim: "fade"` shorthand.
- R15: A contract test walks the scene-writing tools with the same wrong inputs (bad size,
  unknown shot, unknown icon, loose line target, unknown easing) and expects each to fail
  naming the options.

## Design
- D1 (R1): Rejection lives where the value is checked once for every write:
  `checkScene`/`prepareScene` (`src/service/scenes.ts`) gain `checkReferences(scene,
  previous?)`, a pure function next to `checkShots` that fails on unknown shots, unknown
  icons and loose line ends of changed elements (same "changed" rule as `resourceNotices`,
  071/D3). `resourceNotices` keeps only asset and removed-target notices.
  - _Trade-offs_: A stored scene that already has an unknown shot or icon fails its next write
    only if that element is touched; an agent used to the notice now gets an error.
  - _Mitigation_: Only changed elements are checked; the error names the valid shots, the
    closest icon names (`closestKey`) and the scene's ids, so the fix is one call.
- D2 (R1, R2): `resolveSceneDimensions` (`src/service/compact/expand.ts`) moves to
  `src/model/size.ts` as `parseSize(size)`: `{ width, height }` or an error listing the forms
  and presets. Ratios map to the Instagram/TikTok/YouTube canvases (9:16 → 1080x1920, 4:5 →
  1080x1350, 1:1 → 1080x1080, 16:9 → 1920x1080), the sizes `SIZE_PRESETS` already lists.
  - _Trade-offs_: A compact scene with a misspelled size that used to build square now fails.
  - _Mitigation_: The message lists every accepted form; the square fallback was the bug.
- D3 (R3): `sceneDefaults(ctx)` in `src/service/scene-defaults.ts` returns `defaultScene()`
  overlaid with the project manifest's canvas and palette background. `scene_create` uses it
  (its inline copy goes) and `buildCompact` passes it to `expandScene` as `base`.
  - _Trade-offs_: `scene_build` without `save` now depends on the project (it already takes
    `project`), so the same compact input builds differently in two projects.
  - _Mitigation_: That is the point of a project canvas; the descriptions say "the project's
    canvas" instead of hard-coded numbers.
- D4 (R4): `fromShotStart(tracks, shot)` in `src/model/shots.ts` shifts keyframe times by the
  shot's start. `expandScene` and `element_add` apply it to the tracks that came from a
  preset recipe when the element is bound to a shot; tracks the input gave are scene time,
  as before. `withCountUp` stays for kind-built counters.
  - _Trade-offs_: Re-binding the element to another shot later (`element_update shot`) does
    not move its tracks.
  - _Mitigation_: Documented in `element_update`; moving keys on re-bind would rewrite times
    the user may have set on purpose.
- D5 (R5): `canonicalAssetRefs(el, project)` in `src/service/asset-refs.ts` rewrites each ref
  a descriptor's `assets(el)` returns that has no prefix and is not external to
  `/projects/<project>/assets/<ref>`. `saveScene` applies it to every element before
  writing. The rename and delete logic stays as is.
  - _Trade-offs_: The stored value differs from the one given.
  - _Mitigation_: It is the same form `asset_add` returns in `src`; no notice needed.
- D6 (R6): `src/presets/slug.ts` folds accents (`normalize("NFD")` and strip combining marks,
  as Django's and npm `slugify` do); the editor's copy in `brand-manager-dialog.tsx` is
  removed and imports it. `readJson`/store reads fall back to `legacySlug(name)` (the old
  rule) when the new file is missing.
  - _Trade-offs_: Two slugs for one name during a transition; the slug test expectation
    `tarjeta-ne-n` was wrong and changes.
  - _Mitigation_: Writes always use the new slug; the fallback is read-only and tested.
- D7 (R7): In `src/model/compact.ts`, `from`/`to` in `baseSpecialFields` accept a string or
  a number (the kind's own field schema still wins for kinds that declare them); in
  `buildElement`, a line's `from`/`to` go to `resolveLineConnections` and any other kind's
  are merged as fields (`!== undefined`, so `from: 0` counts).
- D8 (R8): `shot_set` takes `CompactShotCameraSchema` and normalizes `camera.tracks` with
  `normalizeTracks`, as `expandScene` does. `SHOT_RULES` says camera `t` is scene time;
  `shot_set` and `checkReferences` add a notice for camera keys outside `[start, end]`.
- D9 (R9): `parseWith` returns all issues (`errors: { path, message }[]`); `Verdict` gains
  `errors`. `withElementDefaults(data)` (`src/model/fill-defaults.ts`) deep-merges each
  element over `defaultElement(kind)` (children too) and the scene over `defaultScene()`,
  used by `scene_validate data` and `scene_create data`. `idPath` takes the input whose ids
  count (the compact input in `buildCompact`), so generated ids never appear.
  - _Trade-offs_: A full-scene `data` with a forgotten field is now valid with the default.
  - _Mitigation_: That is what `scene_create` should do with what `scene_get` returns (R12);
    unknown keys are still noticed.
- D10 (R10): `element_group` input `id?`; `groupElements` takes it. Missing ids are collected
  and each says whether it does not exist or sits inside which group.
- D11 (R11): `placeAt` (`src/service/compact/layout.ts`), the one placement used by every
  tool, gives a text with no `w` a `w` of `container.width − 2·margin` when its box is wider.
- D12 (R12): `deepDiff` (`src/presets/diff.ts`) is exported; `sparseScene(scene)` in
  `src/service/sparse-scene.ts` returns elements as `{ id, kind, …diff }` (children too).
  `scene_get` returns it unless `full: true`.
  - _Trade-offs_: A client that read a default field from `scene_get` now misses it.
  - _Mitigation_: `full: true`; D9 lets the sparse form go back into `scene_create`.
- D13 (R13, R1): `keyframe_remove` fails with the track's times; `expandEffects` names the
  element field (`glow: { enabled: true }`) for a key that is a field of the element; the
  easing error lists `EASING_NAMES` and `cubic-bezier(…)`; `element_move` fails past the
  last index with the range.
- D14 (R1): `PresetRecipeSchema` is strict on its keys and, once resolved, parses the element
  with `ElementSchema`, reporting failures under `set.<field>`.
- D15 (R14): Descriptions: `preset_validate`/`preset_save` describe a recipe; `scene_build`
  and `element_update` describe `anim` vs `tracks` and the string shorthand.
- D16 (R15): `src/service/tools/contract.test.ts` — one test per (tool, wrong input),
  written out, no loops (070/R4), each asserting the failure and that the message names
  the options.

## Tasks
- [x] 074/T001 [agent] Sizes: `parseSize` in `src/model/size.ts`, ratios, reject unknown — covers R1, R2, D2
- [x] 074/T002 [agent] Scene defaults from the project in `scene_create` and `scene_build` — covers R3, D3
- [x] 074/T003 [agent] Reject unknown shots, icons and loose line ends (`checkReferences`); icon case normalized — covers R1, D1
- [x] 074/T004 [agent] Preset tracks start at the element's shot — covers R4, D4
- [x] 074/T005 [agent] Asset refs stored in one form — covers R5, D5
- [x] 074/T006 [agent] One `slugify` with accents folded, legacy read fallback — covers R6, D6
- [x] 074/T007 [agent] Compact `from`/`to` per kind — covers R7, D7
- [x] 074/T008 [agent] Camera tracks short form in `shot_set`, scene-time note and notice — covers R8, D8
- [x] 074/T009 [agent] Preset recipes: strict keys, typed `set` — covers R1, D14
- [x] 074/T010 [agent] `scene_validate`: every error, partial elements, id-or-index paths — covers R9, D9
- [x] 074/T011 [agent] `element_group` id and all bad ids; `element_move` range; easing options; keyframe times; effects field hint — covers R10, R13, D10, D13
- [x] 074/T012 [agent] Long text wraps when placed — covers R11, D11
- [x] 074/T013 [agent] Sparse `scene_get` — covers R12, D12
- [x] 074/T014 [agent] Descriptions: recipes, animation models, defaults — covers R14, D15
- [x] 074/T015 [agent] Contract test across tools — covers R15, D16
- [x] 074/T016 [agent] Docs: AGENTS.md QA line and usage skill for 074 — covers R1, R3, R12
- [x] 074/T018 [agent] A failing path is named once in the message, and messages do not name a generated id — covers R9, D9
      found: the replay of a loose line printed `compact.elements.0.b.attach: elements.0.b.attach: elements.0.b.attach: «qx5dhck8»: …`
- [x] 074/T019 [agent] Align the remaining descriptions and docs: element_add, component_list (counter, icon), asset_add, keyframe_remove, AGENTS.md 069 line, docs/components.md — covers R1, R4, R5, R13, R14
- [x] 074/T017 [agent] Verify: typecheck, lint on touched files, tests, every round-6 case replayed with `pnpm lienzo` — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, R15
      verified: `pnpm typecheck`, biome on the 52 touched source files, `pnpm test` (1253 tests, 152 files); replayed with `pnpm lienzo` on a scratch project `qa-074` (1080x1920, 6 s), deleted after: `size: "9:16"` → 1080x1920 and `"potato"` fails listing the forms; no size → the project's canvas; a «Contador animado» in s2 (3–6 s) with `to: 1500` → progress keys at 3 and 5, `to` 1500; icon `star` → `Star`; a line to `nope` fails once-prefixed; `scene_validate` with a partial text is valid; `preset_validate` lists `values` and `set.w`; `preset_rename` → `caja-ambar`; `element_group` with `id: "caja"`; `element_move to: 99` fails with the range; `scene_get` returns the sparse group — found: the triple path prefix and generated id in messages (fixed in T018); schema errors still stop before shot/reference rules (recorded in Changes)

## Changes
- 2026-10-27: 074/D1 puts `checkReferences` in `src/service/scene-references.ts` (with `canonicalIcon`), not in `scenes.ts`, and the "changed element" test in `src/service/scene-changes.ts`, shared with `resourceNotices`. Why: SRP; `scenes.ts` already reads, writes and checks. Work: T003.
- 2026-10-27: 074/D9 runs the rules through one `checkSceneRules` (anim presets, shots, references) used by `prepareScene` and `buildCompact`; schema errors still stop before the rules, which need a parsed scene. Why: one place for "every problem". Work: T010.
- 2026-10-27: 074/D13 names every field of the element whose name holds the `effects` key (`borderGlow, bgGlow` for `glow` on a rect). Why: a rect has no `glow` field of its own. Work: T011.
- 2026-10-27: Reference messages drop the element id; the path names the element. Why: a compact element given no id has a generated one. Work: T018.
- 2026-10-27: Tests whose expectation 074 changed on purpose, and why each was wrong for the new rule (R1, R6, R9, R12): `scene-resources.test.ts` expected notices for an unknown icon and a loose line (now errors; its 5 tests keep the notice cases with a missing image and add the error cases); `slug.test.ts` expected `tarjeta-ne-n` (the bug R6 fixes); `schema.test.ts` compared a parse failure with `toEqual`, which the new `issues` list breaks without changing what it checks; `service.test.ts` expected the index path `elements.1.animPreset` for a stored element, which 073/D3 names by id; `service.test.ts` and `editor-parity.test.ts` compared `scene_get` with the stored scene, so they ask `full: true`. Work: T003, T006, T009, T010, T013.
- 2026-10-27: The schema-first limit of D9 is lifted by 075/D3 (`checkWholeScene`); `element_update`'s note that a new `shot` leaves tracks in place is replaced by 075/D1.
