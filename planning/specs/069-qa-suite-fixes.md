# 069 — qa-suite-fixes

## Goal
A first-time QA run of all 43 tools (scratch project `qa-suite`) found 22 problems: data that saves but breaks the preview, partial updates that reset fields, orphaned elements, missing validation and silent fallbacks. When this spec is done, invalid colors and out-of-range values are rejected where they are written, partial edits keep what they do not name, every silent fallback (placeholder, ignored key, changed name or extension) comes back as a notice, and new users get consistent placement and defaults.

## Requirements
- R1: A color that is not a CSS color (hex, `rgb()`/`rgba()`/`hsl()`/`hsla()`, a CSS color name or `transparent`) fails validation in element fields, backgrounds, gradient stops, color keyframes and project palettes.
- R2: `project_update` with a partial `canvas` keeps the stored values of the fields it does not give.
- R3: Removing a shot unbinds the elements bound to it (with a notice naming them), and `scene_inspect_layout` reports an element bound to a shot that does not exist.
- R4: `animation_delete` deletes an animation preset; the animation tools take an optional `project` and then work on that project's `presets/animations/`.
- R5: Sizes (`w`, `h`) below 0, keyframe values outside their field's bounds and a background `dotGap` below 1 fail validation.
- R6: `element_update` and `background_set` return a notice for each patch key that is unknown or does not change (`id`, `kind`), as `element_add` does.
- R7: A scene write returns a notice for an icon name that does not exist, an image `src` that is not in the project's assets, and a line `from`/`to` naming no element; `asset_add` rejects an image file that is not a decodable image.
- R8: `shot_set` rejects a shot ending after the scene's duration and a shot overlapping another.
- R9: `scene_export` and `scene_preview` reject a `t` past the scene's duration, as `keyframe_set` does.
- R10: `project_update` returns a notice for a brand font family that is not installed; `font_list` lists every bundled weight.
- R11: In `scene_build`, a top-level element with no `at`, `x`, `y` or `fit: "canvas"` is centred, as in `element_add`.
- R12: Edge anchors (`top`, `bottom-left`, …) keep a safe margin of 5% of the container's shorter side from the edges they touch.
- R13: An element given both `at` and a track on `x` or `y` gets a notice that the track overrides the placement.
- R14: Compact `list.items` also takes an array of strings; a failure inside a compact element reports the element's real path (`compact.elements.0.anim.in.kind`); an unknown trait lists the known ones; an unknown Kokoro voice lists the voices.
- R15: `preset_validate`/`preset_save` accept a recipe without `traits`, and `animation_save` fills the missing fields of `anim.in`/`anim.loop`/`anim.out` with their defaults.
- R16: `preset_list` and `preset_get` take an optional `project` and then include its presets; `project_inspect` lists only preset files, not the `animations` folder.
- R17: An unknown `animPreset` fails naming the preset and the element id.
- R18: `scene_rename`, `scene_create`, `preset_rename` and `scene_export` return a notice when the stored name or file extension differs from the one given.
- R19: `element_group` of elements bound to different shots returns a notice naming the shot the group keeps.
- R20: An image added with a `src` and no `aspect` takes the picture's own aspect; `component_list` and the `counter` description say that it shows its final value until `progress` is keyframed.
- R21: `scene_generate_speech`'s `audioDuration` and an image's computed `aspect` are rounded (3 decimals for aspect, 2 for seconds).
- R22: `scene_build` reports every missing preset at once, each with its path.

## Design
- D1 (R1): `isColor(s)` in `src/model/color.ts` (pure: hex 3/4/6/8 digits, `rgb[a]`/`hsl[a]` functions, the CSS named colors, `transparent`); `ColorSchema` refines with it and replaces `z.string()` in the `color` field builder, `BackgroundSchema`, gradient stops and `ColorPaletteSchema`.
  - _Trade-offs_: A scene already on disk with a non-CSS color stops opening until fixed.
  - _Mitigation_: Every color in the repo's presets and projects is hex; the error names the path.
- D2 (R5, R1): `SceneSchema` `superRefine`s every element track (any depth): a keyframe on a field path must pass that field's schema (`fieldAt`), so color tracks need a color and number tracks the field's bounds; `checkKeyframe` checks the same for `keyframe_set`. `box()` gives `w`/`h` `bounds: [0, Infinity]`; `dotGap` gets `.min(1)`.
- D3 (R2): `project_update`'s `canvas` input is the partial canvas schema; the tool merges it over the stored canvas before `update`.
- D4 (R3): `shot_set remove` deletes `shot` from every element (any depth) bound to the removed id and adds a notice listing their ids; `inspectLayout` adds `unknown_shot` for an element whose `shot` is not in `scene.shots`.
- D5 (R8): `shotProblem(shots, duration)` in `src/model/shots.ts` (pure) returns the first error: an `end` past `duration` or two shots whose `[start, end)` intersect; `shot_set` fails with it.
- D6 (R4, R15, R16): one `animationsDir(ctx, project?)` picks `projects/<project>/presets/animations/` or the global folder; `animation_list`, `animation_save` and the new `animation_delete` use it. `animation_save` merges each given `anim.<phase>` over the descriptor default of that phase before parsing. `PresetRecipeSchema.traits` defaults to `[]`. `preset_list`/`preset_get` read `inProject(ctx, project).store` when `project` is given. `project_inspect` lists `presets/*.json` only.
- D7 (R6): `element_update` compares the patch with the parsed patched element (`ignoredFields`, prefix `patch`) and notes an `id`/`kind` key that differs from the element's; `background_set` does the same against `BackgroundSchema`.
- D8 (R7): `resourceNotices(scene, assets)` in `scene-notices.ts` (pure): icon names not in the icon list, image `src` that is not an asset of the project (URLs and `data:` are left alone); `saveScene` appends them, `sceneNotices` includes them. `resolveLineConnections` returns a notice for a `from`/`to` with no element. `asset_add` probes an image's header (`image-probe.ts`) and fails `invalid_image` when it is not one.
- D9 (R9): `scene_export`/`scene_preview` fail `invalid_time` when `t > duration`.
- D10 (R10): `project_update` returns `notices` for families not in `availableFonts`; `model/fonts.ts` lists each bundled family's weights and `availableFonts` returns one row per weight.
- D11 (R11, R12, R13): `buildElement` sets `at: "center"` for a top-level element with none of `at`, `x`, `y`, `fit: "canvas"` (lines excluded); `resolveAnchorPosition` insets edge anchors by `round(0.05 × min(w, h))`; `buildElement` and `element_add`/`element_update` note `at` plus a track on `x`/`y`.
  - _Trade-offs_: Existing callers relying on `at: "top"` touching the edge move by the margin.
  - _Mitigation_: `offset` still applies, so `{ anchor: "top", offset: [0, -54] }` touches the edge again; `top-left` with `x`/`y` stays exact.
- D12 (R14, R17, R22): the compact `list.items` schema takes `string | string[]` and the expansion joins an array with `\n`; `buildCompact` prefixes the scene path with `compact.`; `buildElement` collects missing-preset errors and the expansion fails once with all of them; `resolvePreset`'s unknown-trait error lists the trait names; the Kokoro adapter turns an unknown-voice failure into a message listing its voices; `prepareScene` names the preset and element id.
- D13 (R18, R19): rename/create/export compare the given name with the stored slug or written file and add a notice; `element_group` notes when its members name different shots.
- D14 (R20, R21): `element_add` and `scene_build` set an image's `aspect` from `probeImage` of its project asset when the input gives `src` and no `aspect`, rounded to 3 decimals; `audioDuration` is rounded with `round2`; the counter description is updated.

## Tasks
- [x] 069/T001 [agent] CSS colors and value bounds (colors, `w`/`h`, `dotGap`, keyframe values) — covers R1, R5, D1, D2
- [x] 069/T002 [agent] Partial canvas in project_update; font notices and bundled weights — covers R2, R10, D3, D10
- [ ] 069/T003 [agent] Shots: unbind on remove, unknown shot in layout, end and overlap checks — covers R3, R8, D4, D5
- [ ] 069/T004 [agent] Animation and preset tools by project, animation_delete, recipe defaults, project_inspect presets — covers R4, R15, R16, D6
- [ ] 069/T005 [agent] Patch notices in element_update and background_set — covers R6, D7
- [ ] 069/T006 [agent] Missing resource notices, line connections, image check in asset_add — covers R7, D8
- [ ] 069/T007 [agent] Time checks in export/preview; name and extension notices; group shot notice — covers R9, R18, R19, D9, D13
- [ ] 069/T008 [agent] Placement: centred default in scene_build, anchor margin, `at` + track notice — covers R11, R12, R13, D11
- [ ] 069/T009 [agent] Compact errors: list items array, real paths, all missing presets, traits and voices listed, animPreset message — covers R14, R17, R22, D12
- [ ] 069/T010 [agent] Image aspect from file, rounding, counter description — covers R20, R21, D14
- [ ] 069/T011 [agent] Docs: usage skill, README, AGENTS.md for the 069 behavior — covers R4, R11, R12
- [ ] 069/T012 [agent] Verify: typecheck, lint of touched files, tests, the QA cases replayed with the CLI — covers R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22
