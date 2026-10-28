# 081 — qa-round-9-input-gaps

## Goal
Two QA runs of the MCP tools on 2026-10-28 (server at 6ac43cc = `HEAD`; report A: all 44 tools
on `qa-scratch`, 22 findings; report B: 49 tools on `qa-probe` from another session, 13
findings, pasted under Sources) agree on one picture: the tools fail well on a single wrong
value and badly on the second one. Input that should fail is stored (duplicate ids, a shot
that ends before it starts, an `fps` of 500), a writer stays silent where its sibling gives a
notice, and a failing call shows a part of its problems, so the caller fixes and retries.
Both reports repeat what 075 named and 080 fixed once more: a rule lives on the path that was
reported, not at the one point every writer passes through (A27).

When this spec is done:
- every writer of a scene, a recipe or a shot applies each rule below at its one shared
  point, with one written-out case per writer in `contract.test.ts`;
- a failing call lists every problem it can find, in Spanish, each with the path of what the
  caller sent;
- the two reports' cases are a replay list (Sources) that runs against a restarted server.

Every task starts with a test that fails on `HEAD` with the reported case. An existing test
whose expectation changes is named, with why, in Changes — never weakened to pass.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Four new pure functions (`duplicateIds`, `sameName`, `looksLikeAudio`, `assertTimeWithin`), one constants module, no new tool, no new interface. The notices every writer needs join the `sceneNotices`/`saveScene` points that exist; no `elementNotices` layer. Extras are under Not doing. |
| 2 SRP | Each rule is one function in `src/model/` (or `src/presets/`); a tool only calls it. One task per rule. |
| 3 DRY by composition | `setShot` and `shotProblems` share one span check; the off-canvas notice moves out of `element_add` into a function every writer calls; `findPreset` and the animation lookup share `sameName`. No inheritance. |
| 4 Service layer / DIP | `scene_generate_speech` opens the scene, then calls the injected `ctx.tts` (the adapter stays swappable); asset and render checks go through `ctx.projects` and `ctx.renderer`, never a vendor. |
| 5 Doubt | Small interfaces: every new function is pure, takes plain data, and is tested without a ctx. |
| 6, 7 Tests | Regression test first, one per behavior and per writer, Given-When-Then, no loops or conditionals; fakes only at boundaries (`fakeRenderer`, fake TTS). New cases extend `contract.test.ts` (written out, as 074/R15 and 070/R4 say) and each source's own `*.test.ts`. |
| 8 Stack standards | Zod 4 as 078/D5 and 080/D1 use it (`superRefine`, transform on parse, `z.config`); Biome; Spanish messages (A16). |
| 9 Research | Zod 4 locales and per-parse `error` ([error customization](https://zod.dev/error-customization)), refinements ([zod refinements](https://www.mintlify.com/colinhacks/zod/concepts/refinements)); half-open shot windows are 073's NLE finding; a fresh process was probed on 2026-10-28 (D1). What the search did not confirm (the `unrecognized_keys` issue shape) is read from `node_modules/zod` in T012 before it is relied on. |
| 10 Trade-offs | Every D lists pros, cons and the mitigation. |

## Requirements
- R1: Element ids are unique among a scene's elements at any depth (a symbol's body is its own
  namespace) in every writer: `scene_create`, `scene_update`, `scene_validate data`,
  `scene_build`, `element_add`, `element_group`, and the editor's JSON import. A stored scene
  that already repeats an id still opens; the `ambiguous_id` error names every occurrence and
  how to fix them.
- R2: Shot rules hold in every writer (compact, `data`, `shot_set`, `scene_update`): `end >
  start` (a zero-length shot or `start > end` fails), shot ids are unique, `name` is optional
  everywhere (the id when left out), and an audio track's `id` is optional everywhere
  (generated). A transition longer than its shot gives a notice.
- R3: Camera tracks go through the checks element tracks get: an unknown channel and an easing
  on a last keyframe each give a notice, in `shot_set` and every scene writer. A repeat-only
  `keyframe_set` call (no keyframe, no easing) does not repeat the dead-easing notice.
- R4: Bounds, one module: `width` and `height` 1–7680, `fps` 1–60, `duration` 0–600 s; every
  field documented as 0–1 (background `spotlight`, a progress `value`) is a `fraction()`; an
  `angle` is any number.
- R5: Assets. `asset_rename` keeps the file's type (a PNG stays `.png`). `asset_add` accepts an
  audio file only when its header says it is that kind of audio. `scene_export` and
  `scene_preview` list in `notices` the assets the scene references that the project lacks.
- R6: Presets and animation presets.
  - A user preset cannot take a built-in preset's name (`preset_save`, `preset_rename`).
  - `preset_save` and `animation_save` return `notices`: an unknown `set` key (preset), and a
    file name that differs from the one asked for.
  - `animation_save` runs `tracks` through the track schema (duplicate and unsorted times) and
    refuses a recipe with neither `anim` nor `tracks`.
  - Lookups by name ignore case and accents (`preset_get`, `_rename`, `_delete`, `element_add`,
    `animPreset`), and `animPreset` takes the animation's name or its file, as presets do.
- R7: Every writer of an element tells the same things: a font not installed, a weight the
  family lacks, an element off the canvas (one without a position track). A write that changes
  an element fails on a track path it has no field for and on a `use` override naming a child
  its symbol lacks, listing the valid ones (074/R1). `scene_validate data` gives the ignored-key
  notice `element_update` gives.
- R8: A brand font declaring weights that are not installed gives a notice naming them
  (`project_update`, and `font_install` when `weights` was left out).
- R9: A failing call lists every problem it can find, in one `errors` list:
  - compact: a bad `size` does not hide element errors; element values, `anim`, `tracks` and
    references come together;
  - `preset_validate` and `preset_save`: structure, trait parameters and `set` values together;
  - `scene_validate data`: schema problems and the shot, id and reference rules together;
  - `data` plus `compact` (`scene_validate`) and `scene` plus `data` (`scene_inspect_layout`)
    fail the same way.
- R10: Messages. No zod message in English in any tool, ever; a rejected extra key has the key
  as its `path`; each of these says what to do:
  - compact `tracks.x: 5` and `anim.loop.cycles: 0.5`;
  - `element_add` without `kind` or `preset`;
  - `font_install` with a bad file (path `file`) and a Google Fonts 400 (family not found);
  - `element_group` for a nested id (it exists, it is not top-level);
  - `project_create` with an existing id (pass `project` for another id);
  - `scene_preview out` whose extension changes (the notice `scene_export` gives).
- R11: `scene_inspect_layout` fails with `invalid_time` for a `t` past the duration, like
  `scene_preview`; an element bound to a missing shot has no layout diagnostics except
  `unknown_shot`, reported at the requested time.
- ~~R12: `element_group` then `element_ungroup` gives back the same draw order whatever order
  the ids were given in (B10 reports otherwise; the first task decides if it is a bug).~~ → R17
- R13: The valid options of every closed set reach the caller before a failure: animation
  `in`/`loop`/`out` kinds, easings and shot transition kinds appear in `component_list`'s and
  the writing tools' descriptions, built from the constants the schemas use.
- R14: `project_inspect` names scenes, presets and animations the way the tools take them
  (without `.json`).
- R15: `scene_generate_speech` opens the scene before it synthesizes; every failure has the path
  of the parameter at fault (`provider`, `apiKey`, `baseUrl`, `scene`, `script`); with a local
  provider that is down, the message says the URL tried and how to start the service (README).
- R16: `contract.test.ts` holds R1–R9 with one case per writer; README, `docs/components.md`,
  the usage skill, `RULES` and the tool descriptions say what changed; AGENTS.md names the
  point that applies each new rule.
- R17 (R12): Group and ungroup keep the members' own draw order, whatever order the ids were
  given in (the code does; B10 is not a bug), and the descriptions say that the group takes the
  place of its topmost member, so a non-member that was between two members ends below them;
  `element_group` then `element_ungroup` is the identity only when the members are adjacent.

## Design
Where each rule lives, read from the code on 2026-10-28. `prepareScene` (`src/service/scenes.ts`)
is the one path every scene write passes: it runs `checkWholeScene`, whose `ruleFailures` run
`checkAnimPresets`, `checkShots` and `checkReferences`. New scene rules join that list, so every
writer gets them (A27). Opening a stored scene does not run them (072/D4), so a scene that
breaks a new rule can still be read and fixed.

- D1 (R10): **Locale.** Findings: (a) in a fresh `tsx` process importing the registry alone makes
  zod Spanish (probed); the MCP server on `6ac43cc` answered English for about thirty calls, then
  Spanish, for top-level input and nested schemas alike, in two sessions (reports A and B), so
  the cause is specific to the long-running server. (b) `genericUnion()` in
  `src/model/zod-issues.ts` caches zod's «Entrada inválida» message at its first call; if that
  call happens under another locale, `flatIssues` never recognizes a failed union, which is the
  `tracks.x: Entrada inválida` of R10. Steps: T001 replays the early calls through a restarted
  server and bisects the call after which messages turn Spanish; the fix goes where the cause is
  (candidates: a second zod copy that the SDK or a lazy chunk loads, a lazy module that imports
  `zod` before `zod-locale.ts`). Independently, `genericUnion` stops caching: it recomputes per
  call (a `safeParse` on a two-branch union, microseconds).
  - _Pros_: the cache fix is local and removes one locale-dependent state; the replay finds the
    real cause instead of adding a second place that sets the locale.
  - _Cons_: the cause may be outside the repo (SDK, bundler).
  - _Mitigation_: if so, the one adapter that parses tool input (`callTool` in `registry.ts`)
    passes the Spanish error map per parse (`safeParse(x, { error })`, which zod documents as
    per-parse customization; a schema's own message still wins), with a test that the first call
    of a fresh server is Spanish.
- D2 (R1): **Unique ids.** `duplicateIds(elements): { id; first; again }[]` in
  `src/model/ids.ts` (pure; walks `children` with `src/model/element-walk.ts`; path of each
  occurrence as `idPath` names it). A fourth entry in `ruleFailures`
  (`checkUniqueIds(scene, previous)`) fails with code `duplicate_id` and one problem per repeated
  id at `elements.<path>.id`: «ID duplicado «x» (también en elements.0)». With `previous`, only
  ids of changed elements fail (`changedSince`, `src/service/scene-changes.ts`), as
  `checkReferences` does. A symbol's children are checked per symbol (the compact expansion
  already does, `expand.ts`). `element_add` loses its inline `mapElementsDeep` check: its
  failure for the new element is re-rooted to `patch.id` by `remapFailure`, so the path and the
  code stay. `element_group` keeps its pre-check for the `id` parameter, calling `duplicateIds`.
  The editor's JSON import calls `duplicateIds` and refuses with a Spanish message. The
  `ambiguous_id` failure (`src/service/element-tree.ts`) lists each occurrence's index path and
  says to rebuild the scene (`scene_get`, rename, `scene_create` with `overwrite`).
  - _Pros_: one function, every writer; the next writer that goes through `prepareScene` is
    covered.
  - _Cons_: a stored scene with a repeat fails any write that touches the repeated element; the
    `ambiguous_id` way out is manual.
  - _Mitigation_: only changed elements fail; the message says exactly how to fix; a repeat in a
    stored scene can no longer be created by any tool.
- D3 (R2): **Shots.** `shotProblems` (`src/model/shots.ts`) gains `end <= start` and a repeated
  id; the span check is one exported function `shotSpan(shot)` that `setShot` also uses, replacing
  its own `end < start` test (DRY, and the zero-length case). `ShotSchema.name` becomes
  `z.string().optional()` followed by a transform to `name ?? id`, so the output type keeps `name:
  string` and no reader changes; `rulesView` then keeps shots that lacked a name, so the shot
  rules also run when elements fail. Windows stay half-open `[start, end)` (073).
  - _Pros_: three writers inherit it from `checkShots`; no reader of `shot.name` changes.
  - _Cons_: `ShotSchema`'s input type differs from its output (the precedent is 080/D1's tracks);
    a zero-length shot that exists in stored scenes still opens.
  - _Mitigation_: code typed as `Shot` is output-typed; new inputs say `unknown`; `checkShots`
    does not run on open.
- D4 (R2, R3): **Shot notices.** Pure `shotNotices(scene)` in `src/service/scene-notices.ts`,
  beside `deadKeyframeEasingNotices`: a transition longer than its shot, a camera track key the
  camera does not have (`x`, `y`, `zoom` are its channels), an easing on a camera track's last
  keyframe (reusing `deadEasingNotice`). `sceneNotices` appends it, so `scene_validate`,
  `scene_build` and the editor's Revisión get it; `shot_set` calls it for the shot it wrote.
  `keyframe_set` raises the dead-easing notice only when its call wrote a keyframe or an easing.
  - _Cons_: one more notice source. _Mitigation_: it joins the list that exists; no new channel.
- D5 (R4): **Limits.** `src/model/limits.ts` exports `MAX_SIDE = 7680`, `MAX_FPS = 60`,
  `MAX_DURATION = 600`; `SceneSchema`, the compact schema and `project_create`/`project_update`
  import them; `fraction()` (`src/components/fields/field.ts`) is applied to every field whose
  label or doc says 0–1 (T-first: read `progress.value`'s descriptor to confirm it is a
  fraction), and `field.test.ts`, which walks every descriptor, gets the check.
  - _Pros_: one place to change. _Cons_: a real 16K scene is refused.
    _Mitigation_: 8K is the largest social format; one constant raises it.
- D6 (R5): **Assets.** `renameAsset` (`src/service/project-assets.ts`, shared with the assets
  tab) refuses a different `extname` (`asset_type_changed`). `looksLikeAudio(bytes, ext)` in
  `src/service/asset-helpers.ts`: magic bytes per extension (mp3: `ID3` or an MPEG sync;
  wav: `RIFF…WAVE`; ogg: `OggS`; aac: ADTS sync or `ftyp`), the audio counterpart of
  `imageSize(bytes)`; `asset_add` fails `invalid_audio`. `scene_export` and `scene_preview` call
  `resourceNotices(ctx, scene)` (no `previous`, so every reference) through a helper in
  `render-target.ts`.
  - _Pros_: header reads only, no decoder, no dependency. _Cons_: a truncated or corrupt file
    with a valid header passes. _Mitigation_: the rule is «not something else renamed»,
    documented in the tool description; decoding stays the renderer's job.
- D7 (R6): **Presets.** `sameName(a, b) = slugify(a) === slugify(b)` in `src/presets/slug.ts`,
  used by `findPreset` (`src/service/scenes.ts`) and the animation lookups, which keep
  matching the file name too. `refuseBuiltInName(ctx, name, field)` (beside `refuseBuiltIn`)
  fails `built_in_name` in `preset_save` (at `recipe.name`) and `preset_rename` (at `to`); a
  collision already stored is not touched. `preset_save`/`animation_save` output gains
  `notices`: unknown `set` keys through `ignoredFields` on the element the recipe resolves to
  (067/D3), and «se guardó como…» when `slugify(file ?? name)` differs from the asked name
  (the text `preset_rename` uses). `parseAnimPreset` parses `tracks` with `TracksSchema` and
  refuses a recipe with neither `anim` nor `tracks`; field ranges stay unchecked without a kind.
  - _Pros_: lookups match what `slugify` already does for files. _Cons_: two presets whose names
    differ only by accent now collide on lookup; the output shape grows.
  - _Mitigation_: `slugify` already makes their files collide, so the case cannot exist; new
    output keys are additive.
- D8 (R7, R8): **Notices on every writer.** `saveScene` already appends `resourceNotices` for
  changed elements; it also appends `fontNotices(scene, installed, previous)`: the existing
  `missingFonts`/`missingWeights` (`src/service/font-check.ts`) limited to changed elements, with
  the faces from `ctx.fonts` as `scene_validate` takes them, and `offCanvasNotices(scene,
  previous)`: `element_add`'s inline check, moved out as a pure function (an element with an `x`
  or `y` track is skipped, since entering from outside is normal; the text hint stays). Track
  paths and `use` overrides join `checkReferences`, failing on changed elements only.
  `scene_validate data` gets ignored keys through the existing `sceneNotices(raw, …)`. The
  brand-font weight notice compares `project.fonts[].weights` with the installed faces in
  `project_update` and in `font_install` when `weights` was left out.
  - _Pros_: no new layer; `element_add`, `element_update`, `scene_build`, `scene_create` and
    `scene_update` get the same sentences. _Cons_: more notices per write.
    _Mitigation_: changed elements only, each notice once (`Set`, as `resourceNotices`).
- D9 (R9): **Complete lists.** Read `src/service/compact/expand.ts` and `build-compact.ts`
  first (T012): a bad `size` becomes one more `Problem`, and the element stage runs on the
  default size; anim, tracks and reference stages run on what parsed. `preset_validate`/`_save`
  run the structure check and then the `superRefine` stage on the keys that parsed, as
  `checkWholeScene` does with `rulesView`. `data` plus `compact`, and `scene` plus `data`, share
  one `exactlyOne` check in `registry.ts` that both tools use.
  - _Cons_: a later stage may report noise after an earlier error.
    _Mitigation_: a stage runs only on the parts that parsed, and the first problem keeps the
    first path.
- D10 (R10): **Messages.** The extra-key path comes from the `unrecognized_keys` issue
  (`issue.keys[0]`; shape confirmed in `node_modules/zod` at T012) mapped once in
  `src/model/zod-issues.ts`. `anim.loop.cycles`: the schema message says «ciclos enteros por
  bucle» (A6) through `.int({ error })`. `element_add`: the `refine` has two messages, one for
  neither and one for both. The others are one-line fixes in their tool (`font_install` path
  `file`; Google Fonts 400 says the family was not found; `element_group` says the id exists but
  is not top-level; `project_create` exists adds «pasa `project` para otro id»;
  `scene_preview` appends the extension notice `scene_export` has, from one shared function).
- D11 (R11, R14): **Times and names.** `assertTimeWithin(scene, t, path)` is extracted from
  `resolveAndRenderScene` (`src/service/render-target.ts`) and also used by
  `scene_inspect_layout` for each `times[i]` (path `times.i`); `inspectLayout` skips elements
  bound to a missing shot apart from the existing `unknown_shot`, whose `t` becomes the first
  requested time. `project_inspect` strips `.json` from scene and preset names.
  - _Cons_: `project_inspect` output changes for clients that read `.json`. _Mitigation_: the new
    names are what the other tools accept; README and the usage skill say it (T-docs).
- D12 (R13): **Options.** `src/model/options.ts` exports `ANIM_KINDS`, `EASING_NAMES` (already
  in `src/engine`; re-exported, not copied) and `TRANSITIONS`; the schemas use them, and
  `component_list`, `element_update`, `scene_build` and `shot_set` descriptions interpolate
  them; `descriptions.test.ts` asserts each constant appears.
- D13 (R15): **Speech order.** `scene_generate_speech` runs `openScene` first, then
  `ctx.tts ?? createTtsService(…)`; adapter errors become `Problem`s with the parameter that
  caused them (`apiKey` for a missing key, `baseUrl` for an unreachable service), the local one
  saying the URL it tried (default `http://localhost:8880`) and linking README's how-to.
  - _Pros_: no paid call for a scene that is not there. _Cons_: a second read of the scene file.
    _Mitigation_: the tool reads it anyway to attach the audio; one read moves earlier.
- D14 (R17): **Group order.** `groupElements` builds children from the scene's draw order and
  places the group at its topmost member (`src/engine/groups.ts`); two tests hold it, and the
  descriptions of `element_group`/`element_ungroup` replace «gives back the scene» with the
  adjacent-members condition.
  - _Cons_: a non-member between members changes its stacking relative to them; that is what a
    group is, and the editor's Ctrl+G does the same. _Mitigation_: documented, not changed.
- D15 (R16): Each Sources case that is a rule joins `contract.test.ts`, one `it` per writer,
  written out (no loops or conditionals in tests). A case that is only a message or a notice goes
  in its tool's own test file. Cases already held by an existing test are not duplicated.

## Not doing
- Shot and element id charset (`"Bad Id!"` is stored): ids are free text today and stored
  scenes use them; revisit only if a tool needs ids as paths with spaces. → Ideas.
- Asking confirmation before normalizing a name (B12): the result already returns the stored
  name and a notice; a prompt would break non-interactive agents. The rule goes in `RULES`.
- Starting a TTS service for the user (B1): environment, not a defect; README says how.
- A notice for undecodable audio at export (the renderer decodes, the service cannot know):
  `asset_add` refuses non-audio at the door (D6).
- Per-field range checks for `animation_save` tracks without a kind (D7): the kind that gets
  the preset checks them when it is applied.

## Tasks
Order: T001–T002 first (every later replay reads messages), then T003–T011 in any order (each
one rule), T012–T015, docs, review, verify.
- [x] 081/T001 [agent] Verify: replay the Sources lists on a restarted server and with `pnpm lienzo` on the commit each earlier spec closed at; record which still fail and bisect the call after which zod messages turn Spanish — covers R10, D1
      verified: replayed 12 English-prone calls (project_create, scene_validate, element_move, element_group, scene_build, shot_set, preset_validate, animation_save, scene_update) through an MCP client over a fresh `pnpm lienzo mcp` at 6ac43cc — every message came back Spanish, so the English run of the long-lived server could not be reproduced or bisected from here; found the `genericUnion` cache and fixed the locale defensively (T002)
- [x] 081/T002 [agent] Locale: failing test (a union failure flattens whatever the locale at first call), `genericUnion` without cache, then the fix T001 found with a test that the first call of a fresh server is Spanish — covers R10, D1
- [x] 081/T003 [agent] Shot rules and optional ids: tests (zero-length and reversed shot, repeated id, shot without `name`, audio track without `id` generated like element ids) through `scene_validate` data and compact, `scene_build`, `scene_create`, `scene_update`, `shot_set`; `shotProblems`/`shotSpan`, `ShotSchema.name`, the audio track schema's `id`, `rulesView` — covers R2, D3
- [x] 081/T004 [agent] Shot notices: tests (transition longer than the shot; camera channel `rotation`; easing on a camera last keyframe; repeat-only `keyframe_set` quiet), `shotNotices` in `sceneNotices` and `shot_set` — covers R2, R3, D4
- [x] 081/T005 [agent] Unique ids: tests per writer (`scene_create`, `scene_update` symbols, `scene_validate` data, `scene_build`, `element_add`, `element_group`, editor import), `duplicateIds`, `checkUniqueIds` in `ruleFailures`, `ambiguous_id` message — covers R1, D2
- [x] 081/T006 [agent] Limits: tests (`fps 500`, `duration 100000`, `size 20000x20000`, `spotlight 7`, `progress.value 1.5`) per writer, `src/model/limits.ts`, `fraction()` on documented 0–1 fields, `field.test.ts` — covers R4, D5
- [x] 081/T007 [agent] Assets: tests (rename PNG to `.jpg`; random bytes as `.mp3`; export and preview of a scene with a missing asset), `renameAsset`, `looksLikeAudio`, render-target notices — covers R5, D6
- [x] 081/T008 [agent] Presets: tests (built-in name on save and rename, accent-blind `preset_get`, `animPreset` by file and by name, unknown `set` key notice, file-name notice, animation tracks with repeated times, empty recipe), `sameName`, `refuseBuiltInName`, `parseAnimPreset` — covers R6, D7
- [x] 081/T009 [agent] Writer notices: tests (missing font and weight in `element_add`/`element_update`/`scene_create`; off-canvas in `scene_build`; unknown track path and `use` override failing; ignored key in `scene_validate` data), `fontNotices`, `offCanvasNotices` moved from `element_add`, `checkReferences` — covers R7, D8
- [x] 081/T010 [agent] Brand-font weights: tests (`project_update` weights `[700, 900]` with 900 missing; `font_install` without `weights`), the notice — covers R8, D8
- [x] 081/T011 [agent] Complete lists: tests (compact bad `size` plus bad element; `preset_validate` bad trait plus bad `set`; `scene_validate` data bad opacity plus shots; `data` plus `compact`; `scene` plus `data`), compact size as a `Problem`, `preset_validate`/`_save` stages, `exactlyOne` — covers R9, D9
- [x] 081/T012 [agent] Messages: read `unrecognized_keys` in `node_modules/zod`, tests for each R10 case, the one-line fixes and `zod-issues.ts` mapping — covers R10, D10
- [x] 081/T013 [agent] Times and names: tests (`times: [99]` fails `invalid_time`; element on a missing shot has only `unknown_shot`; `project_inspect` names), `assertTimeWithin`, `inspectLayout`, `project_inspect` — covers R11, R14, D11
- [x] 081/T014 [agent] Options module and descriptions: tests in `descriptions.test.ts`, `src/model/options.ts`, schemas and descriptions from it — covers R13, D12
- [x] 081/T015 [agent] Speech: tests with a fake TTS (missing scene fails before synthesis; paths `apiKey`/`baseUrl`; local-down message), reorder in the tool — covers R15, D13
- [ ] 081/T016 [agent] Group order: the two tests (ids in the other order; a non-member between two members) pass on `HEAD`; change only the descriptions — covers R17, D14
- [ ] 081/T017 [agent] Docs: README, `docs/components.md`, usage skill, `RULES`, tool descriptions, AGENTS.md rule points, the new `project_inspect` names — covers R16, D15
- [ ] 081/T018 [agent] Review: a fresh agent reads every file this spec touched against R1–R17 and the ten principles — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R13, R14, R15, R16, R17
- [ ] 081/T019 [agent] Verify: typecheck, biome on touched files, `pnpm test`, the replay list on a restarted server (commit = `HEAD`) and with `pnpm lienzo` — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R13, R14, R15, R16, R17

## Audit of specs 050–080 against the findings
Method: each finding looked up in the requirements, designs and `verified:` lines of the
earlier specs, and in the code where a spec claimed it. Verdicts:
- **Regression**: a spec required it, its task is ticked and verified, and it fails now.
- **Incomplete**: a spec required it, and the implementation covers only part of the cases.
- **Gap**: no spec required it; same family as before (a rule on one path, not its siblings).
- **Not a bug**: behavior is by design.

This is a reading of the specs and their `verified:` lines plus the code named in the
evidence column; history was not bisected, so «regression» here means «a verified spec rule
that fails now», not «a commit that broke it». T001 settles the doubtful ones by replaying on
the commit each spec closed at. The one finding that comes closest to a regression is A17.

| Finding | Verdict | Evidence |
|---|---|---|
| A17, B11 English zod messages | **Unresolved, reported fixed** | 078/R5, D5 (`871fccd`, verified); 080/R19 closed it as "does not reproduce". Two independent sessions saw English on `6ac43cc`; a fresh process is Spanish. Highest priority. |
| A18, B2, B3 only some errors listed | **Incomplete** | 075/R4, 078/R6, 080/R5 say every problem in one list; compact `size`, the `anim`/`tracks` stage and `preset_validate`'s `set` are hidden. 080/R5's own text names «unknown animation presets». |
| A19 `element_move to` «Invalid input» | Symptom of A17 | 074/R1; the same call answers with the options once the locale is Spanish. |
| A19 `tracks.x: 5`, `cycles: 0.5`, `element_add` no kind/preset, `font_install` path | Gap | 074/R1 lists options, not wording or path of these. `tracks.x` is also the `genericUnion` cache (D1). |
| A22 `element_group` nested id wording | Incomplete | 074/T011: «fails listing every id that is not a top-level element»; the message says «no hay un elemento». |
| A22 `project_inspect` `.json` mix | **New, from 080/R17** | 069/D6 lists `presets/*.json`; 080/R17 added animations without the extension. |
| A21, B6 `scene_inspect_layout` times | Gap | 069/D9 covers `scene_export` and `scene_preview` only. |
| A21 element on a missing shot gets diagnostics | Incomplete | 069/D4 adds `unknown_shot`; 073/R2 wants "drawn and placed, or neither". |
| A1, B2 duplicate ids | Gap | 068/D4 (`element_add`), 078/R7 (compact); 073 assumes "unique per scene"; no schema rule. |
| A2, A3 shot `start ≥ end`, repeated shot id | Gap | 069/R8, 072/R4: end past duration and overlap only. |
| B5 transition longer than its shot | Gap | 055, 063 never state it. |
| A4 `fps`, `duration`, `size`, `spotlight` bounds | Gap | 069/R5, 078/D1, 080/R9: `w`, `h`, `dotGap`, opacity, lengths. |
| A5, A6 asset type checks | Gap | 069/R18 is a notice on names; nothing checks type on rename or audio on add. |
| A7 `preset_save` built-in name, unknown `set`, file name | Gap | 078/R8 refuses delete/rename of built-ins only; 069/R18 names `scene_rename`, `scene_create`, `preset_rename`, `scene_export`. |
| A16 `scene_preview` extension | Gap | same 069/R18 list. |
| A8 `animation_save` tracks | Gap | 069/R15, 080/R1, R8 cover defaults, short form and keys, not track values. |
| A9, B1 speech order and path | Gap | 029, 060 (older code); no spec on order. |
| A10, A11 notices in `element_add`, `scene_build` | Gap | 067/D3, 069/D7 cover `element_update`; 068 covers off-canvas in `element_add`. |
| A12 camera track notices | Gap | 065/R4 and `bb5588f` («every writer») cover element tracks; 074/R8 covers the short form. |
| A13, A14 track path, `use` overrides | Gap | 069/D2 checks values of known fields; 056 checks the symbol, not its children. |
| A15, B7 brand-font weights | Gap | 069/R10 notices families only. |
| A20 `name` and `id` optional in some tools | Gap | 074/D9 made one source of defaults, not of required keys. |
| A22 accent in `preset_get`, `animPreset` file | Gap | 073/D1 looked at the display name; 074 slug rules cover files. |
| B8 options in `component_list`, B9 export of missing assets | Gap | no spec. |
| B10 ungroup order | **Not a bug** | `groupElements` takes children in scene order and places the group at its topmost member. |
| B12 normalized names | Not a bug | 069/R18: a notice is the contract. |
| B13 `project_create` exists | Not a bug | 078/R7 maps it to `exists`; only the hint is missing. |

Reading: 1 unresolved, 3 incomplete, 1 new bug introduced by 080, about 20 gaps, 3 not a bug.
Almost every gap is the family 075 and 080 named: the rule exists on the path that was
reported. That is why R1–R9 are applied at the shared points and carry one case per writer.

## Sources

### Report A — this session (44 tools, `qa-scratch`, 6ac43cc)
Replay each as written; "expect" is the behavior this spec requires.

| # | Case | Today | Expect | R |
|---|------|-------|--------|---|
| A1 | `scene_create` data with two elements `id: "x"` | stored; `element_update x` → `ambiguous_id` with no way out | fails, lists the repeat | R1 |
| A2 | `scene_validate compact` shot `start 3, end 1` | `valid: true` | fails | R2 |
| A3 | `shot_set` `start 4, end 4`; compact two shots both `id: "s"` | stored / valid | fails | R2 |
| A4 | compact `fps 500, duration 100000, size "20000x20000"`; background `spotlight 7`; progress `value 1.5` | valid | fails | R4 |
| A5 | `asset_rename` a PNG to `x.jpg` | renamed | fails, keeps type | R5 |
| A6 | `asset_add` 3000 random bytes as `.mp3` | stored | fails | R5 |
| A7 | `preset_save` named «Tarjeta neón» (a built-in) with `set.zzz`, `file: "../../hack"` | stored under `hack`, no notice; `preset_rename from` the name says not found | fails; notices | R6 |
| A8 | `animation_save` tracks `nofield`, duplicate times, `opacity 5`; empty recipe | stored | duplicate times and empty recipe fail | R6 |
| A9 | `scene_generate_speech` on a missing scene, local provider down | connection error, `path: "script"` | `not_found` on `scene` first; path `baseUrl` | R15 |
| A10 | `element_add` with `nope`, a missing font and weight; `element_update` with a missing font | no notice | notices | R7 |
| A11 | `scene_build` with a list at `x: -60` | no notice | off-canvas notice | R7 |
| A12 | `shot_set` camera tracks `rotation`, easing on last key | stored silently | notices | R3 |
| A13 | compact tracks `nofield`, `x` duplicate times | no notice | fails | R7 |
| A14 | `use` with `overrides: { nochild }` | accepted | fails listing children | R7 |
| A15 | `project_update` fonts weights `[700, 900]` with 900 not installed | no notice | notice | R8 |
| A16 | `scene_preview out: "x.jpg"` | writes `x.png`, no notice | notice | R10 |
| A17 | same invalid input early and late in one server run | English, then Spanish | always Spanish | R10 |
| A18 | `scene_validate data` with one bad opacity and shots with no `name`; compact bad `size`; `preset_validate` bad trait plus bad `set` | later problems hidden | all listed | R9 |
| A19 | `element_move to: "sideways"`; compact `tracks.x: 5`; `cycles: 0.5`; `element_add` with no kind/preset; `font_install` `.txt`; Google 400 | vague or wrong path | clear, right path | R10 |
| A20 | shots without `name` in `data`; `audioTracks` without `id` in `scene_update`; `scene` plus `data` in `scene_inspect_layout` | differs per tool | same everywhere | R2, R9 |
| A21 | `scene_inspect_layout times: [99]`; element on a missing shot gets `out_of_bounds` | computed; diagnostics for an undrawn element | `invalid_time`; `unknown_shot` only | R11 |
| A22 | `preset_get "Tarjeta neon"`; `element_group` a nested id; `project_inspect` extensions; `animation_list` `file` vs `name` | not found / wrong wording / mixed | accent-blind, clear, uniform | R6, R10, R14 |

### Report B — other session (49 tools, `qa-probe`), pasted as received
> Probé las 49 herramientas de lienzo en un proyecto desechable, qa-probe. Ya lo borré y
> mi-proyecto quedó intacto. Todas respondieron, salvo scene_generate_speech, que falló
> porque no hay servicio de voz. La mayoría de los errores salen claros, con ruta y
> alternativas.
>
> **Fallos del entorno**
> 1. scene_generate_speech (provider local) falla con tts_generation_failed: no hay servicio
>    de TTS en localhost:8880. No pude probar openrouter porque no tengo clave. Hay que
>    levantar Kokoro o pasar apiKey.
>
> **Validaciones que se quedan cortas**
> 2. scene_create con datos malos solo informa algunos errores. Con un id duplicado y un
>    campo desconocido, solo avisó de opacity y kind. Hay que corregir y reintentar varias
>    veces.
> 3. preset_validate con un trait inválido y un set.w: "abc" solo reporta el trait. El segundo
>    error aparece cuando arreglas el primero.
> 4. scene_validate no avisó de la clave font en un text, que no existe. Debería llevar un
>    notice de campo ignorado. En cambio element_update sí avisa de patch.bogus, así que es
>    inconsistente.
> 5. shot_set acepta una transición de 5 s en una toma de 3 s sin ningún aviso.
> 6. scene_inspect_layout acepta times mayores que la duración y calcula igual. scene_preview
>    y keyframe_set sí fallan con invalid_time.
>
> **Comportamiento que puede confundir**
> 7. project_update con una fuente de marca en pesos [400, 700]: font_install instala solo el
>    400 por defecto, y no avisa de que falta el 700. Hay que pasar weights a mano.
> 8. scene_build con anim.in.kind desconocido falla bien y lista las opciones. Pero la lista
>    de kinds válidos solo sale en el error, no en component_list.
> 9. scene_export del PNG funciona aunque la escena tenga assets inexistentes (el avisos sí
>    aparecieron al añadirlos). Se exporta con un marcador.
> 10. element_ungroup devuelve los hijos en otro orden (r1,t1) del que tenían al agrupar
>     (t1,r1). Puede alterar el apilado.
> 11. animation_save con una clave extra devuelve el error en inglés (Unrecognized key:
>     "extra") y con path vacío. El resto de mensajes están en español y con ruta.
> 12. preset_rename y los nombres de archivo normalizan sin pedir confirmación («Caja Verde»
>     pasa a caja-verde). Lo notifica en notices, pero hay que leerlo para saber el nombre
>     real.
> 13. project_create con el mismo nombre falla con exists, porque el id sale del nombre. Funciona
>     como se espera, pero hay que pasar project explícito si quieres otro id.
>
> **Cosas que funcionaron bien**: built_in en presets integrados y «¿quisiste decir…?»; in_use
> al borrar un asset referenciado; out_of_project al escapar de exports/; solapes de tomas,
> duplicate_id, easings desconocidos y paths de keyframe inválidos; scene_validate y
> scene_build informan de varios errores a la vez.

How report B maps (the cases are replayed in T001; B4 may mean another kind than `text`, whose
`font` is a real field: T001 finds the exact case):

| B | Requirement | Note |
|---|-------------|------|
| B1 | R15 | environment; the code part is the message and path |
| B2, B3 | R9, R1 | same cause as A1, A18 |
| B4 | R7 | `scene_validate data` gives the ignored-key notice `element_update` gives |
| B5 | R2 | notice for a transition longer than its shot |
| B6 | R11 | same as A21 |
| B7 | R8 | |
| B8 | R13 | |
| B9 | R5 | |
| B10 | R17 | not a bug: grouping keeps the scene's draw order (read in `groups.ts`); docs only |
| B11 | R10 | extra key `path` is the key, message in Spanish (A17) |
| B12 | Not doing | the notice is the contract; documented in `RULES` |
| B13 | R10 | message says to pass `project` |

## Changes
- 2026-10-28: R12 → R17. Why: `groupElements` already keeps the members' draw order and places the group at its topmost member (read in `src/engine/groups.ts`), so B10 is not a bug; the work is two tests and the descriptions. Work: T016.
- 2026-10-28: design and tasks rewritten from a read of `scenes.ts`, `shots.ts`, `registry.ts`, `scene-notices.ts`, `scene-resources.ts`, `render-target.ts`, the tools named in D6–D13 and `contract.test.ts`. R5 drops «undecodable audio at export» (the service cannot decode; `asset_add` checks the header instead), R7 reuses the `saveScene`/`sceneNotices` points instead of a new `elementNotices`, R2 and R3 gain the shot notices, R10 gains the `genericUnion` cache. Work: all tasks.
- 2026-10-28: R4 loses «a progress `value` as a fraction». Why: `progress.value` is 0–100 by its descriptor ("A bar or a ring filled to value (0–100)"), so 1.5 is valid; report A4 was wrong on that field. Work: T006.
- 2026-10-28: R8 drops the `font_install` half. Why: `font_install` answers a bare array of the faces it installed, so a notice would change its output shape; `project_update` names the missing weights and says how to install them. Work: T010.
- 2026-10-28: the contract case «preset_validate lists each recipe problem at its own path (078/R6)» expected the extra key `values` at path ""; R10 puts a rejected key at its own path, so it expects "values" now. R11 changes: `unknown_shot` is not an error about an undrawn element when the scene has no shots (`isElementActiveInShot` draws a bound element then), so the message says so and only its `t` changes. Work: T012, T013.
- 2026-10-28: the speech tests in `src/service/tts/tts-config.test.ts` and `pluggable-tts.test.ts` build a hand-made ctx with no `fonts` store; `saveScene` now reads the installed fonts (D8), so the fixtures gain `fonts: { list: async () => [] }`, as the real `Ctx` always has. No expectation changed. Work: T009, T015.
