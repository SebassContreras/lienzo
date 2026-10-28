# 080 — qa-round-8-every-writer

## Goal
QA round 8 (all 43 tools on `prueba-herramientas-nandu`, server at 1104620 = `HEAD`) lists 6
bugs, 14 inconsistencies, 7 surprising defaults and 4 minor points. Replayed on `HEAD` through
the registry and the MCP server, and read against specs 067–079, none is a fix that broke
something that used to work:
- 10 are a rule an earlier spec applied on one path and not on the others that write the
  same data: short-form tracks (074/R8: `shot_set` and compact only), defaults filled
  (074/D9: `scene_create`/`scene_validate data` only), canonical asset refs (074/D5:
  element refs only, not `audioTracks`), the shot of a group (069/D13: the tool only, not
  `ungroup` nor the editor's Ctrl+G), id paths and one error list (074/R9, 075/R4: inside
  `scene_validate.run`, while compact element values fail earlier at the tool's input
  schema, with an index path and one error), paths that name the parameter (078/R7: not
  `findPreset`), valid options listed (074/R1: not presets nor animation presets), strict
  recipe keys (074/D14: presets, not animations), field bounds (078/D1: opacity only),
  ignored-key notices (067/D3: by index).
- 2 come with an earlier spec's own new code: `shape_overlap` (071/D4) counts a `use`'s
  instances as top-level shapes; the moved-tracks notice (075/D1) names elements with no
  tracks.
- 9 are older code no spec touched: speech cue timing and ids (029, 060), contrast over
  particles, text overflow inside a kind's box, font weights, `project_inspect`, icon
  padding, the counter's `+` (already 065/R3, never done).
- 1 does not reproduce: English zod messages (`keyframe_set`/`element_update` answer
  «Demasiado grande…» on this server); the OpenRouter 401 already says to set
  `OPENROUTER_API_KEY` or use `provider: "kokoro"`.

The root cause is the one 075 named and 074–078 kept repeating: a fix goes into the tool
that was reported, and the next tool that writes the same data is found by the next round.
When this spec is done, each shared rule is applied at the one point every writer passes
through (a schema, `prepareScene`/`saveScene`, a model helper the editor shares), each has
one written-out contract case per writer, and the other findings are fixed with a
regression test each. Every task starts with a test that fails on `HEAD` with the reported
case; an existing test whose expectation a requirement changes is named, with why, in
Changes (074 did the same), never weakened to pass.

## Requirements
- R1: Tracks take the short form everywhere: `[t, value, easing?]` and `{ t, value,
  easing? }` (easing `auto` when left out), in `element_add`, `element_update`,
  `animation_save`, scene `data` (`scene_create`, `scene_validate`, `scene_update`) and
  the editor's JSON import, as in `scene_build` and `shot_set`. Stored tracks keep the
  full form.
- R2: Partial elements are filled from their kind's defaults wherever a scene comes in:
  every scene write, `symbols` children included (`scene_update`), and
  `scene_inspect_layout data` (what `scene_get` returns goes back in as it is).
- R3: Audio references (`audio.assetId`, `audioTracks[].assetId`) are stored in the
  same form as element assets, `/projects/<project>/assets/<path>`. `asset_delete`
  counts them as uses, and a write or `scene_validate` gives a notice when the file is
  missing.
- R4: Grouping elements of one shot gives the group that shot, and ungrouping gives the
  group's shot back to its children, in the tools and in the editor alike.
- R5: `scene_build` and `scene_validate` list every problem of a compact scene in one
  `errors` list: wrong element values, shot problems (all of them, not only the first),
  unknown animation presets (all of them) and references. Each problem names an element
  by the id the input gave, else by its index.
- R6: Ignored-key notices name an element the same way errors do: by the id the input
  gave, else by its index.
- R7: A name lookup that fails lists the valid names, closest first, at the path of the
  parameter given: presets (`preset_get` → `name`, `background_set` and `element_add` →
  `preset`, compact → `compact.elements.<id>.preset`) and animation presets.
- R8: `animation_save` and `scene_validate` reject an animation recipe with unknown keys,
  as preset recipes are rejected (074/R1).
- R9: A length (radius, padding, blur, size, stroke and line widths, gaps) below 0 fails,
  as a value, in a recipe's `set` and as a keyframe.
- R10: An unknown key that names a field nested one level down suggests those paths
  (`colour` on a rect → «fill.color», «border.color», «label.color»). `component_list`
  says what an unknown icon gets: the closest names when one is close, examples
  otherwise.
- R11: `scene_inspect_layout` treats a `use`'s instances as content held by the `use`: no
  `shape_overlap` between a `use` and its own instances.
- R12: The moved-tracks notice (rebind, shot move, shot removal) names only elements
  whose keyframes moved.
- R13: Speech cues fill the clip, from `startOffset` to `startOffset + audio duration`,
  and every cue of a subtitles element has a unique id after clips are added with
  `asTrack: true`.
- R14: Text over a particles element whose dots are one color (no template, no color
  variation) is checked for contrast against both the backdrop and the dot color, the
  worse one counting; other particles stay unverifiable.
- R15: `scene_inspect_layout` reports `text_overflow` when the text a kind draws leaves
  that element's box (chat bubble text past its `h`, code past its right edge, a steps
  label outside the box), for every kind that draws text.
- R16: Fonts:
  - A text or subtitles weight the installed family lacks gives a notice naming the
    weight that is drawn instead.
  - Measuring and drawing pick that weight the same way, by the CSS weight matching
    rule.
  - The «Subtítulos virales» preset uses a weight Poppins has.
  - `font_install` with a `file` and more than one weight fails, saying that a file is
    one weight.
  - A Google Fonts failure names the HTTP status as such.
- R17: `project_inspect` lists the project's animation presets and fonts.
- R18: Defaults:
  - A new counter has no suffix (065/R3).
  - A new icon whose input gives a size and no `tile.padding` gets a padding in
    proportion to its size, 28/120 of its shorter side, as the default 120 px icon has
    today.
  - `defaults: "flat"` makes an icon's tile a flat color.
  - Docs say the tile is on by default.
- R19: Zod messages through the MCP stdio server are Spanish: replayed with the
  report's calls, fixed only if a case comes back in English.
- R20: The contract test holds R1–R6 with one written-out case per writer, and AGENTS.md
  names, for each shared rule, the one point that applies it.

## Design
- D1 (R1): The short form is read by the track schema itself.
  - In `src/model/track.ts`, `KeyframeSchema` takes a tuple or an object with optional
    `easing` and outputs `{ t, value, easing }` (`auto` when left out). It becomes
    `z.ZodType<Keyframe, unknown>`.
  - `normalizeTracks`/`normalizeKeyframe` (`src/service/compact/tracks.ts`) go. Their only
    callers (`expandScene`, `normalizeCamera`) parse with `TracksSchema`, and
    `CompactTracksSchema` is `TracksSchema`.
  - Every writer already parses with `SceneSchema` or `AnimPresetSchema`, so none needs a
    change, and the next writer gets the short form for free.
  - Zod transforms are the stack's way to normalize on parse (zod.dev, "transform").
  - _Trade-offs_:
    - The schema's input type differs from its output type, so code that typed a parse
      input as `Scene` must say `unknown`.
    - Tracks that a caller reads back from its own input before parsing are not
      normalized.
  - _Mitigation_:
    - `pnpm typecheck` finds every such place.
    - The tools read tracks only from parsed scenes.
    - A schema test pins the tuple form, the object without easing and that the output
      is canonical.
- D2 (R2): Fill defaults in `prepareScene`.
  - `withElementDefaults` (`src/model/fill-defaults.ts`) also fills
    `symbols.<name>.children`.
  - `prepareScene` (`src/service/scenes.ts`), which every write goes through, runs it
    before `checkWholeScene`.
  - `scene_inspect_layout data` builds its scene with `sceneFromData`, as `scene_create`
    and `scene_validate` already do.
  - `sceneFromData` keeps doing the scene-level merge, and its own call to
    `withElementDefaults` goes, so the filling is written once.
  - _Trade-offs_:
    - A write that forgets a required field now saves the default instead of failing
      (074/D9's trade-off, now for every write).
    - `prepareScene` does one more walk.
  - _Mitigation_:
    - Unknown keys are still noticed and values are still checked.
    - It is what the editor does when it creates an element.
    - The walk is in memory and linear.
- D3 (R3): Canonical audio refs.
  - `withCanonicalAudio(scene, project)` sits in `src/service/asset-refs.ts`, next to
    `withCanonicalAssets`, and shares its bare-ref test, extracted as `canonicalRef(ref,
    project)`. `saveScene` applies both.
  - `resourceNotices` checks the audio refs that differ from the `previous` scene with
    `checkAsset`, as it checks element refs.
  - `usesAsset` already finds a canonical ref, so `asset_delete` needs no change.
  - It also fixes playback: `audio-player.ts` and `export.ts` `fetch` the `assetId` as a
    URL, so a bare `0d80….mp3` loaded nothing.
  - _Trade-offs_:
    - Scenes already saved with a bare `assetId` (the QA project's `voz`) stay bare
      until their next write, and `asset_delete` does not see them until then.
  - _Mitigation_:
    - Any write (even `scene_update {}`) canonicalizes them.
    - The Verify task re-saves `voz` and checks it.
    - Rewriting files on read would make opening a scene write to disk.
- D4 (R4): The shot rule moves into `src/engine/groups.ts`, so the tool and the editor
  (`src/editor/app.tsx`) share it (AGENTS.md "one rule, one place").
  - `groupElements` takes the members' shared shot onto the group and clears it on the
    children (from `element_group`, 069/D13). It returns `mixedShots: string[]` for the
    tool's notice.
  - `ungroupElement` gives each child the group's `shot` when it has none of its own.
  - _Trade-offs_:
    - The editor's Ctrl+G now changes children's `shot`, which it did not before.
  - _Mitigation_:
    - The drawing is the same: a group bound to a shot shows its children in that shot
      (063).
    - Ungrouping gives the shot back, so a group/ungroup round trip restores the
      scene, and a test holds that.
- D5 (R5): Compact checks happen inside the tool, in one pass.
  - The `compact` input of `scene_build` and `scene_validate` keeps its JSON Schema.
    Its `elements` (and `symbols.*.children`) are `z.array(z.unknown())` in the input
    schema, which is already what the MCP listing shows (`items: {}`).
  - `buildCompact` (`src/service/build-compact.ts`) parses the elements with
    `CompactElementSchema`.
  - On failure it fails once, through `failAll`, with each element problem at
    `compact.<idPath(compact, path)>` and the rules from `ruleFailures` over a rules view
    of the raw compact. That view reads a line's `from`/`to` as its targets (074/D7).
  - `shotProblem` becomes `shotProblems` (every late or overlapping shot); `shot_set`
    takes the first.
  - `checkAnimPresets` lists every unknown name.
  - Checked against MCP SEP-1303: argument validation failures should come back as tool
    results the model can read and correct, not as protocol errors. One answer with
    every problem saves a retry per problem.
  - _Trade-offs_:
    - A client that relied on the input schema rejecting a bad element before the tool
      ran now gets `invalid_scene` from the tool instead of `invalid_input`.
    - The rules see a raw element, which may itself be wrong.
  - _Mitigation_:
    - Same `{ code, message, path, errors }` shape, and the descriptions already say
      `errors`.
    - The rules read only ids, kinds, `shot`, `icon`, `symbol`, targets and
      `animPreset.name`, each checked before use (075/D3).
- D6 (R6): `withIgnored` (`src/service/registry.ts`) maps each ignored path
  `<param>.<rest>` through `idPath(input[param], rest)`, the function errors use (073/D3).
  `buildCompact`'s ignored notices go through `idPath(compact, …)` too.
- D7 (R7): One lookup helper.
  - `findPreset(ctx, name, field)` takes the parameter's path, as `refuseBuiltIn` does
    (078/D8).
  - On a miss it lists the closest preset names (`closestKey`), else the first ones with
    `preset_list` to see them all.
  - `checkAnimPresets` adds the library's names the same way.
  - The list sits in one pure `namesHint(name, names)` in `src/model/ignored.ts`, next
    to `closestKey`, used by both and by `unknown_icon`.
  - _Trade-offs_:
    - Callers of `findPreset` pass a path, which is one more argument.
  - _Mitigation_:
    - There are four callers, and each states its own path, so no guess is needed.
- D8 (R8): `AnimPresetSchema` (`src/model/anim-preset.ts`) is `strict()` on its top-level
  keys, as `PresetRecipeSchema` (074/D14).
  - _Trade-offs_:
    - A stored animation recipe with an extra key stops loading, and `animLibrary` skips
      it.
  - _Mitigation_:
    - A scan of `presets/**/animations` and `projects/*/presets/animations` before the
      change finds none (as 078/D1 scanned opacities).
    - `animation_list` shows what loads.
- D9 (R9): `length(value, o)` sits next to `fraction` in `src/components/fields/field.ts`.
  - It is `num` with `bounds: [0, Infinity]`, and every length field uses it.
  - Bounds already reach keyframes and recipes through `fieldAt`/`ElementSchema` (069/D2,
    074/D14).
  - A test asserts the written list of number fields with no lower bound (`x`, `y`,
    angles, offsets…), computed by a helper that walks the descriptors. A new unbounded
    field changes that list on purpose.
  - _Trade-offs_:
    - A stored negative length stops a scene from opening, and the field list is a
      judgment per field.
  - _Mitigation_:
    - The same scan as D8 over the JSON in `presets/` and `projects/` runs before the
      change.
    - The field list is in the spec's Changes when it differs from the one above.
- D10 (R10): When `closestKey` finds nothing among an object's own keys, `ignoredFields`
  (`src/model/ignored.ts`) looks at the keys one level down. It suggests every
  `<object>.<key>` path whose key is the closest (at most three), phrased as a question.
  The `component_list` icon line is corrected.
  - _Trade-offs_:
    - Several suggestions are vaguer than one.
  - _Mitigation_:
    - Only when the object itself has no close key; at most three.
- D11 (R11): `placedElementsAt` (`src/service/layout.ts`) gives a `use`'s instances
  `parentGroup` = the `use` (as group children get their group), so `shapesStack` and
  every top-level check skip them.
  - _Trade-offs_:
    - Two instances of one symbol that overlap each other are not reported.
  - _Mitigation_:
    - That is a symbol's own design, made in its editor.
    - A `use` overlapping another top-level shape is still reported.
- D12 (R12): `rebindShot` and `setShotIn`/`removeShotIn` (`src/model/shot-timing.ts`,
  `src/model/shots.ts`) report a move only for elements whose tracks or camera keys
  changed, and `movedNotice` gets only those.
- D13 (R13): Two fixes in the shared speech code, which the tool and the editor's TTS
  dialog both call.
  - `alignScriptToCues` (`src/service/tts/speech-alignment.ts`) spreads cues over
    `totalDuration` (the audio's length, as its own doc says), starting at
    `startOffset`. Today it subtracts `startOffset` from the duration, so a clip at 2 s
    of 1.32 s gets 0.1 s.
  - `mergeCues` (`src/service/tts/scene-audio.ts`) numbers the merged list `cue-1…n` by
    start time.
  - Checked against WebVTT: cue identifiers are unique within a file (W3C bug 24674),
    which is what an export to `.vtt` expects.
  - _Trade-offs_:
    - Renumbering changes the ids of existing cues when a clip is added.
  - _Mitigation_:
    - Nothing refers to a cue id (`::cue(#id)` is not used). The editor's pause tools
      look cues up by time; the test checks that.
- D14 (R14): `resolveBackdropUnder` (`src/service/contrast.ts`) treats such a particles
  element as see-through for the backdrop and returns its dot color as a second
  background. `checkTextContrast` takes the worse ratio.
  - This is the "lightest and darkest color" approach proposed for axe-core (issue
    #708); axe itself marks such cases "needs review", as we do for images.
  - _Trade-offs_:
    - Particles with hue variation or a template stay unverifiable.
  - _Mitigation_:
    - Those really have no single color; the message says why.
- D15 (R15): Text extents are recorded while drawing.
  - `src/service/text-extents.ts` holds a minimal 2D context that tracks the transform
    (`save/restore/translate/scale/rotate/setTransform`), measures with
    `measureTextWidth` and records each `fillText`/`strokeText` box.
  - The transform math in `src/test/recording-ctx.ts` moves to
    `src/engine/matrix.ts`, shared by both.
  - `scene_inspect_layout` draws each element that holds text through its descriptor's
    `draw` into that context (in the element's box, at `t`) and reports `text_overflow`
    for a box past the element's own box by more than 1 px.
  - Drawing is the only place each kind lays out its text (bubble wrap, code lines,
    steps labels), so this reuses it instead of a second layout per kind.
  - _Trade-offs_:
    - It is one more pass per text kind and `t`.
    - A kind that clips its text on purpose is reported.
    - It measures with the fonts Node has, so an estimated font gives an estimated
      overflow.
  - _Mitigation_:
    - Only kinds whose draw calls `fillText`.
    - The message says the text is cut or outside, which is what the viewer sees.
    - The estimate notice (064/D3) already names such fonts.
- D16 (R16): One weight rule, `matchedWeight(available, wanted)` in `src/model/fonts.ts`
  (pure), per CSS Fonts 4 §5.2:
  - 400–500 look up to 500, then down, then up.
  - Above 500, up then down.
  - Below 400, down then up.

  It replaces `findClosestWeight` in `text-measure.ts`, so measurement picks what the
  browser draws (today 500 among [400, 600] can differ).
  - `missingFonts` returns `{ family, weight, drawn }` for installed families that lack
    the weight. `fontNotices` writes «Poppins no tiene peso 900; se dibuja 800».
  - The preset `44-subtitulos-virales.json` takes `weight: 800`.
  - `font_install` fails `invalid_input` at `weights` for a `file` with more than one
    weight.
  - `google-fonts.ts` writes `(HTTP 400)`.
  - _Trade-offs_:
    - Measured widths change for weights between two installed ones.
  - _Mitigation_:
    - They now match what is drawn, which is the purpose of measuring.
    - The layout tests that pin widths use installed weights.
- D17 (R17): `ProjectDetailsSchema` gains `animations: string[]` (the `animations` folder
  of the project's `presets/`, listed by `animationsDir`) and `fonts: string[]` (the
  project's font store, as `font_list` reads it). 069/R16 kept the folder out of
  `presets`; this lists it under its own name.
- D18 (R18): Defaults.
  - The counter's `suffix` defaults to `""` (065/D3).
  - `impliedFields` (`src/service/compact/implied.ts`), which `element_add` and the
    compact build already share (068/D2), gives an icon whose input has `w`/`h` and no
    `tile.padding` a padding of `round(min(w, h) × 28 / 120)`.
  - `FLAT_KINDS` (`src/service/compact/defaults.ts`) gains `icon`, whose tile gets
    `gradient: false`.
  - `docs/components.md` and the `component_list` description say the tile is on by
    default.
  - _Trade-offs_:
    - The editor's library icon keeps 28 px, and a resize in the editor does not change
      padding (same as today).
    - A counter written sparse (a `scene_get` result, a recipe) with no `suffix` is
      filled from the new default and loses its `+`.
  - _Mitigation_:
    - The 120 px default gives 28, the same as today.
    - A scan of `projects/` and `presets/` before the change lists counters with no
      stored `suffix`; any found gets `suffix: "+"` written in the same task.
- D19 (R19): Replay `keyframe_set opacity: 5`, `element_update opacity: 5` and the short
  tracks with an MCP client over the stdio server started by `pnpm lienzo mcp` (not the
  registry). Only a case in English gets a failing test and a fix; otherwise the Verify
  note records it (073/D1).
- D20 (R20):
  - `src/service/tools/contract.test.ts` gains one case per (rule, writer), written out
    with no loops (070/R4):
    - R1: `element_add`, `element_update`, `animation_save`, `scene_create`,
      `scene_validate`, `scene_update`.
    - R2: `scene_update symbols`, `scene_inspect_layout data`.
    - R3: `scene_update`, `scene_build`, `scene_generate_speech` with a stub TTS.
    - R4: `element_group`/`element_ungroup` and the editor helper.
    - R5, R6: `scene_build`, `scene_validate`.
  - AGENTS.md's "One rule, one place" line names where each shared rule is applied: the
    track and element schemas, `prepareScene`, `saveScene`, `src/engine/groups.ts`,
    `buildCompact`, `idPath`.

## Tasks
- [x] 080/T001 [agent] Short-form keyframes in `TracksSchema`; compact normalizer removed; contract cases — covers R1, D1
- [x] 080/T002 [agent] Defaults filled in `prepareScene` and `symbols`; `scene_inspect_layout data` through `sceneFromData`; contract cases — covers R2, D2
- [x] 080/T003 [agent] Canonical audio refs, missing-audio notice; contract cases — covers R3, D3
- [x] 080/T004 [agent] Shot rule in `groupElements`/`ungroupElement`, used by the tool and the editor; round-trip test — covers R4, D4
- [x] 080/T005 [agent] Compact elements parsed in `buildCompact`; every shot problem and unknown animation preset in one `errors`; contract cases — covers R5, D5
- [x] 080/T006 [agent] Ignored-key notices by id — covers R6, D6
- [x] 080/T007 [agent] `findPreset` path and names, animation preset names, `namesHint` — covers R7, D7
- [x] 080/T008 [agent] Scan stored animation recipes and lengths; strict `AnimPresetSchema` — covers R8, D8
- [x] 080/T009 [agent] `length()` for length fields; unbounded-field list test — covers R9, D9
- [x] 080/T010 [agent] Nested-key suggestions; `component_list` icon wording — covers R10, D10
- [x] 080/T011 [agent] `use` instances held by their `use` in layout — covers R11, D11
- [x] 080/T012 [agent] Moved-tracks notice only for moved keys — covers R12, D12
- [x] 080/T013 [agent] Speech cues over the clip; unique cue ids after merge — covers R13, D13
- [ ] 080/T014 [agent] Contrast over one-color particles — covers R14, D14
- [ ] 080/T015 [agent] Failing tests with the bubble, code and steps cases, then `text_overflow` from recorded text extents; `matrix.ts` shared with `recording-ctx.ts` — covers R15, D15
- [ ] 080/T016 [agent] `matchedWeight`; missing-weight notice; preset weight; `font_install` weights and HTTP status — covers R16, D16
- [ ] 080/T017 [agent] `project_inspect` lists animations and fonts — covers R17, D17
- [ ] 080/T018 [agent] Counter suffix `""` (ticks 065/T003), icon padding by size, `flat` icon tile — covers R18, D18, 065/R3, 065/D3
- [ ] 080/T019 [agent] Replay the English-message cases over the stdio MCP server; test and fix only if one reproduces — covers R19, D19
- [ ] 080/T020 [agent] Docs: README, usage skill, `docs/components.md`, tool descriptions, AGENTS.md rule points and QA line — covers R1, R2, R3, R4, R5, R10, R15, R16, R17, R18, R20, D20
- [ ] 080/T021 [agent] Verify: typecheck, biome on touched files, `pnpm test`, every round-8 case replayed through an MCP client on a restarted server (commit = `HEAD`) and with `pnpm lienzo`, `voz` in `prueba-herramientas-nandu` re-saved and `asset_delete` of its audio refused — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19, R20

## Changes
- 2026-10-27: 080/D1 adds `flatIssues` (`src/model/zod-issues.ts`), used by `parseWith` and the registry: a failed union that one branch explains reports that branch's issues, so a bad keyframe says «…0.easing: easing desconocido» instead of «Entrada inválida». A union with its own message keeps it (`at`). `generateCompactJsonSchema` writes the input side (`io: "input"`), since the keyframe form is a transform; `schemas/compact-scene.json` is regenerated. Why: the tester's «Invalid input» was this union message. Work: T001.
- 2026-10-27: `scene-build-result.test.ts` expected `compact.elements.0.glw` for an element given `id: "title"`; R6 names it `compact.elements.title.glw`. `expand.test.ts` passes short camera keys to `expandScene` with a cast, since `CompactScene` is the parsed type. Work: T005.
- 2026-10-27: 080/D2 has `scene_inspect_layout data` fill and check only the schema (`checkScene` over `withElementDefaults(sceneFromData(…))`), not `prepareScene`. Why: the rules would fail an unknown shot or symbol that the tool reports as `unknown_shot` / `missing_symbol`. Work: T002.
- 2026-10-27: `service.test.ts` ("keeps a scene's audioTracks…") expected the bare `assetId: "voice"` back and one notice; R3 stores it as `/projects/mi-proyecto/assets/voice` and notes that the file is missing, both true of that scene. The TTS tests' hand-built `projects` fakes gain `checkAsset`, the boundary the audio check now calls. Work: T003.
- 2026-10-27: 080/D6 moves `idPath` to `src/model/id-path.ts` (pure), so the registry, `buildCompact` and `sceneNotices` name ignored keys with it without importing `scenes.ts`. `service.test.ts` ("warns about a misspelled element key in scene_validate") expected `elements.0.glw` for data whose element has an id; R6 names it by that id. Work: T006.
- 2026-10-27: 080/D7 takes `findPreset(ctx, name, { field, kind })`: `kind` limits the listed names (`background_set` lists background presets only). The compact expansion gets the names through an optional `presetHint`, and its failures become one `errors` list named by id. `idPath` keeps the index of an element whose id a sibling repeats, so a duplicate id stays at `compact.elements.1.id` (078/R7). Work: T007.
- 2026-10-27: T008 scan: the only stored animation recipe (`projects/prueba-herramientas-nandu/presets/animations/latido.json`) holds `name` and `tracks`; the global `presets/animations/` is empty and the editor writes no other keys. Work: T008.
- 2026-10-27: T009 uses `length()` for `radius`, `padding`, `paddingX/Y`, `pad`, `blur`, `size`, `width` (`strokeWidth`), `lineWidth`, `thickness`, `stroke`, `distance`, `dot`, and the sizes outside `box()` (`icon.w/h`, `image.w/h`, `group.cw/ch`); `effects.blur` keeps its own `[0, 200]`. The scan of the 71 JSON files in `presets/` and `projects/` finds no negative length. The fields left with no lower bound are the list in `field.test.ts` (coordinates, angles, offsets, timing, counts, `letterSpacing`). Work: T009.
