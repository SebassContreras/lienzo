# QA log

How a QA run of the MCP tools works and what it found. A finding is one line in the log below.
A round no longer gets its own spec (082/D9). Only a class-2 or class-4 finding that needs
design work gets one.

## Before a run

1. Rebuild (`pnpm build:cli`), restart the MCP server and check that the commit in its `instructions` is `git rev-parse --short HEAD` and that the build time is after your last change (`+dirty` = uncommitted changes).
2. `pnpm test` and `pnpm replay` pass at that commit.
3. A finding counts only with the calls that show it: the exact `setup` and `call`, replayed
   at `HEAD` (`pnpm lienzo <tool>` or a corpus case). A finding that does not reproduce is
   logged as "not reproduced" with the calls tried, not fixed and not dropped silently; the
   reporter says what was different (a preset name, an earlier write, the MCP build).

## The closed list

A run checks these, and only these, through the tools:

- **Rules in every writer**: each rule of `RULES` (`src/service/contract/rules.ts`) through each
  tool with `effects: scene`. They cover shot references, spans and ids, unique element ids, a
  group's id, opacity and spotlight fractions, icons, line attachments, easings, scene limits
  (fps, side, duration), `use` symbols and overrides, track paths, animation presets, and the
  notices for fonts, last-keyframe easings, camera channels, transitions, missing audio and
  images, off-canvas elements, keys the input dropped and a position track over `at`. Every
  notice rule also holds two properties across all writers: it names what it is about by the
  id the caller gave (`names` in `rules.ts`, `matrix.test.ts`) and it is said once, never
  repeated by a write that leaves the content as it was (`silence.test.ts`).
- **Inputs**: every tool with a missing key, a wrong type, an out-of-range value, an empty
  value, `null`, an unknown key, two errors at once, and its arguments as a JSON string. Each
  must fail as `{ code, message, path }` in Spanish, list every problem and change nothing.
- **Writers agree**: one scene through `scene_build`, `scene_create` and `element_add`; `scene_get`
  then written back; group then ungroup; rename and back; an update applied twice.
- **Outside the matrix**: render and export (`scene_preview`, `scene_export`), speech, font
  install, asset add/trim, and the tool descriptions against what the tools do.

## Classifying a finding

| Class | What it is | What to do |
|---|---|---|
| 1 | A matrix cell is missing: a rule holds in some writers and not in another | Add the writer's adapter or the case for every writer, then fix the writer |
| 2 | A rule is missing: no entry of `RULES` covers it | Add it to `RULES`, apply it in `prepareScene` (or the one place AGENTS.md names), and check it in every writer |
| 3 | Text or docs: a message, a description or a doc is wrong or unclear | Fix the text; `descriptions.test.ts` covers the descriptions |
| 4 | A design decision: the behavior is as built, but debatable | A line in the roadmap's `## Ideas` |

Every finding the code can show also goes into the replay corpus (`src/service/contract/corpus/`)
as `{ id, source, call, expect }`, so `pnpm replay` reruns it.

## When a round ends

- the corpus is green (`pnpm replay`);
- the matrix is complete (`matrix.test.ts`: every rule in every writer);
- a run of the closed list finds no new **class** of bug. A new case of a known class means a
  missing cell (class 1), not a new round.

## Log

| Date | Commit | Finding | Class | Where it went |
|---|---|---|---|---|
| 2026-10-28 | `91064ee` | Writers gave different content notices: three places built the list | 1 | `contentNotices`, called by `saveScene`, `buildCompact` and `sceneNotices` (082) |
| 2026-10-28 | `93e66d2` | `scene_update` stored an unknown `animPreset` inside a symbol body | 1 | `checkAnimPresets` and `expandAnimPresets` walk symbol bodies (082) |
| 2026-10-28 | `2a60135` | `scene_validate` reports a failure as an error or as a verdict, depending on the kind of problem | 4 | Roadmap `## Ideas` |
| 2026-10-29 | `4c90989` | `element_add` with `patch.id: ""` generated an id while ` a` and `a/b` were refused | 1 | Refused like the rest; empty-id cell added to the id rule of the matrix (compact forms take it as an id left out) |
| 2026-10-29 | `efb6e3c` | Live run on the rebuilt MCP: ids, build/create/add agree, group/ungroup, rename and back, preview | — | No new class of bug found |
| 2026-10-29 | `ef608b8` | `scene_validate` takes an empty id in the compact form (reported as a hole) | 3 | Not a hole: the compact form reads it as an id left out and `scene_build` generates one; `RULES` now says so |
| 2026-10-29 | `ef608b8` | `scene_update { symbols: { card: null } }` left `use` elements of a symbol that no writer accepts; later writes mixed those errors in | 1 | `danglingReferences` also checks a `use` whose symbol a write removed or changed; corpus C3; `scene_get` drops an empty `symbols` |
| 2026-10-29 | `ef608b8` | A camera's last-keyframe easing was noticed again by every write of the scene | 1 | `contentNotices` reads only the shots a write changed (`changed.shots`); corpus C4 |
| 2026-10-29 | `ef608b8` | A line with no shot between elements of different shots gave no notice | 2 | New rule in `RULES` (`lineShotNotices`); corpus C5 |
| 2026-10-29 | `ef608b8` | `scene_rename` keeps no trace of the name typed (`Escena Principal` → `escena-principal`) | 3 | Said in the tool's description |
| 2026-10-29 | `ef608b8` | `scene_inspect_layout` misses composites (chart, table, steps, list) that overlap by less than half of the smaller; reported as "composites are not checked" | 4 | Roadmap `## Ideas`: they are checked, at the 50 % rule |
| 2026-10-29 | `ef608b8` | `scene_inspect_layout` gives `w: 0` / `h: 0` at t=0 for an element whose `in` animation starts at scale 0 | 4 | Roadmap `## Ideas` |
| 2026-10-29 | `ea009d7` | `scene_build` with a group preset (Ventana de navegador, Terminal, Móvil con chat) "loses `frame`" | — | Not reproduced: `frame` is kept through the CLI and the MCP server at `ea009d7`, with `at`, `w`/`h`, `children`, `shot` and `tracks`. Reporter asked for the exact calls |
| 2026-10-29 | `ea009d7` | `scene_create` ignored an unknown key of `data` (`at` on an element) with no notice | 1 | `saveScene` takes `reportIgnored`; `scene_create` and `scene_update` use it; rule "a key the scene does not know is ignored with a notice" (matrix); `element_add` notices a `patch` key its kind lacks; corpus D1 |
| 2026-10-29 | `ea009d7` | The `at` + x/y track notice named the element by index (`elements.2`) though the input gave an id | 1 | Expansion notices go through `idPath` (`buildCompact`); `idPath` also names symbol-body children; rule "a position track wins over `at`" with `names` (matrix); corpus D2 |
| 2026-10-29 | `ea009d7` | A write repeated notices about the element it touched (a weight, a dead easing on another path) and about shots it left alone | 1 | A notice is said once: `contentNotices` returns only what the replaced scene did not say, and a missing asset only when the write points the element at it; new `silence.test.ts` runs every notice rule through writes that leave it; corpus D4, D5. The earlier fix (`changedSince`, shots only) cut at one level and the report came back one level down |
| 2026-10-29 | `ea009d7` | «Inter no tiene peso 500; se dibuja 400» did not say which element | 3 | Font, weight and estimated-width notices end with `(en «a», «b» y N más)`; `names` checked in the matrix; corpus D3 |
| 2026-10-29 | `ea009d7` | `shot_set remove` "cuts a group child's tracks wrongly" (keys at 4 and 5.5 s in a shot that starts at 4.5 s became 0 and 1) | 4 | By design: a track key cannot be before the scene's start, and one placed before its shot's start has nothing to keep. The notice names the group, not the child: Ideas |
| 2026-10-29 | `ea009d7` | An unknown `kind` has no `code` in `errors` while an unknown icon or symbol has | — | Not a bug: `errors` entries are `{ path, message }`; the `code` is the call's, and is `invalid_scene` for a kind and `unknown_icon` when the references are all that fails |
| 2026-10-29 | `ea009d7` | No notice for a gap between two shots | 4 | Roadmap `## Ideas` (a gap may be wanted: a still background) |
| 2026-10-29 | `cf33234` | Live run on the rebuilt MCP (43 tools): the fixes D1–D5 hold through the server; group/ungroup, rename and back, shot gaps, preview, png and mp4 export, asset and trim guards | — | No regression of a known class |
| 2026-10-29 | `cf33234` | After `animation_delete`, any write that touches an element whose `animPreset` names the deleted preset fails with `unknown_anim_preset`, and `{ animPreset: null }` is refused: the element cannot be edited, though `animation_delete` says scenes keep their copied values | 1 | Open. `animPreset` is provenance (019/D10): a name the library lacks must not fail a write that did not set it, and null must clear it. Roadmap `## Ideas` |
| 2026-10-29 | `cf33234` | `element_update` with `animPreset` on an element that already animates (a track or an `anim` of its own) stores the name and copies nothing, with no notice; scene_create, scene_build and element_add copy it into an element that does not | 2 | Open. `expandAnimPresets` skips an element that animates on its own (019/D10) without saying so: a notice rule is needed. Roadmap `## Ideas` |
| 2026-10-29 | `cf33234` | A line with no `shot` between two elements of the same shot is drawn in every other shot, with both ends loose (`lineShotNotices` reports only ends in different shots) | 2 | Open. Extend the rule: a line whose ends share a shot another than its own gets the notice (or the shot). Roadmap `## Ideas` |
| 2026-10-29 | `cf33234` | Two problems at once are listed as one in `keyframe_set` (unknown path and unknown easing), `element_group` (a missing id and a taken group id) and `font_install` (weights and a missing file) | 1 | Open. Inputs of the closed list ask for every problem; these tools check semantics in sequence. Roadmap `## Ideas` |
| 2026-10-29 | `cf33234` | `scene_update { duration: -1 }` adds a «termina… después de la escena (-1s)» error per shot, besides the duration's own | 3 | Open. Skip the shot checks that read a duration that failed |
| 2026-10-29 | `cf33234` | `scene_generate_speech` with `provider: "custom"` and no `baseUrl` calls `localhost:8880` and says the local service is down | 3 | Closed. Spec 095/R1 (`F-07`, `src/service/speech/tools/scene-generate-speech.ts:48-64`) |
| 2026-10-29 | `cf33234` | `data: null` through the MCP reads «recibido texto» where the CLI reads «recibido nulo» | — | Not a server finding: the MCP client sends the string `"null"` |
| 2026-11-02 | `7b7b45c` | `element_update` with `at` on a group child (`id: "g/child"`) places the child against the root scene canvas (`s.width × s.height`) instead of the parent group's content box (`group.cw × group.ch`), disagreeing with `scene_build` and `element_add` (`parent`). `setup`: `scene_build {"project":"qa-test","name":"repro-group-at","overwrite":true,"compact":{"duration":4,"fps":30,"width":1000,"height":800,"elements":[{"id":"g","kind":"group","x":100,"y":100,"w":400,"h":300,"children":[{"id":"child","kind":"shape","shape":"rect","w":50,"h":50,"at":"center","fill":"#ff0000"}]}]}}` (`child` at `x:175, y:125`). `call`: `element_update {"project":"qa-test","scene":"repro-group-at","id":"g/child","patch":{"at":"center"}}` (`child` moves to `x:475, y:375`) | 1 | Closed. Spec 092/R2 (`F-04`, `src/service/elements/tools/element-update.ts:65`) |
| 2026-11-02 | `7b7b45c` | A `counter` (or `preset` with tracks) inside a shot-bound `group` (`shot: "s2"`, `4..8 s`) gets its default `progress` track timed from `0..1.5 s` in `scene_build` and `element_add` (`parent`), whereas `element_update` (`shot`) and `shot_set` shift group children's tracks with the group's shot (`4..5.5 s`). `setup`: none. `call`: `scene_build {"project":"qa-test","name":"repro-group-shot-counter","overwrite":true,"compact":{"duration":8,"fps":30,"width":1080,"height":1920,"shots":[{"id":"s1","start":0,"end":4},{"id":"s2","start":4,"end":8}],"elements":[{"id":"g2","kind":"group","shot":"s2","x":100,"y":100,"w":400,"h":300,"children":[{"id":"cnt","kind":"counter","to":100,"x":0,"y":0,"w":200}]}]}}` | 1 | Closed. Spec 092/R1 (`F-03`, `src/service/compact/expand.ts:291-293,319-331`, `src/service/elements/tools/element-add.ts:120-124`) |
| 2026-11-02 | `7b7b45c` | `scene_validate` and `scene_build` with inline `compact` validate top-level fields (`duration`, `fps`, `width`, `height`, `shots`, `background`) in `tool.input` before `buildCompact`: `scene_validate` fails the tool call (`code: "invalid_input"`) instead of returning `{ valid: false }`, omits `errors[]`, and hides element/rule errors, disagreeing with `compactFile` and `data`. `setup`: write the same payload to `compactFile`. `call`: `scene_validate {"project":"qa-test","compact":{"duration":601,"fps":61,"width":1080,"height":1920,"shots":[{"id":"s1","start":5,"end":2}],"elements":[{"id":"bad-icon","kind":"icon","icon":"nonexistent_xyz","x":100,"y":100,"size":48,"color":"#ffffff"}]}}` | 1 | Closed. Spec 093/R1 (`F-05`, `src/model/compact.ts:402-410`, `src/service/scenes/tools/scene-validate.ts:32-39`) |
| 2026-11-02 | `7b7b45c` | `danglingReferences` includes `symbols.*.children` IDs in the valid target set for scene-level `line` attachments (`from`/`to`/`attach`) and suggests them in `unknown_target` errors, while `scene_inspect_layout` flags them as `dangling_attachment`. `setup`: `scene_build` a scene with `symbols.badge.children: [{ id: "sym-child", ... }]`. `call`: `element_add {"project":"qa-test","scene":"errors","patch":{"id":"bad-line-sym","kind":"line","points":[[0,0],[100,100]],"stroke":"#ffffff","from":{"element":"sym-child"}}}` followed by `scene_inspect_layout {"project":"qa-test","name":"errors"}` | 1 | Closed. Spec 093/R2 (`F-06`, `src/service/scenes/scene-references.ts:76-77,135-144`) |
| 2026-11-02 | `7b7b45c` | `element_add` with invalid or duplicate `patch.id` returns internal or malformed scene paths (`elements..id` for `""`, `elements.a/b.id` for `"a/b"`, `elements.10.id` for duplicate ID) instead of `patch.id`. `setup`: scene `errors` exists with `"s1-title"`. `call`: `element_add {"project":"qa-test","scene":"errors","patch":{"id":"","kind":"text","text":"x","x":0,"y":0,"w":100,"fontSize":24,"fill":"#ffffff"}}` and `element_add {"project":"qa-test","scene":"errors","patch":{"id":"s1-title","kind":"text","text":"dup","x":0,"y":0,"w":100,"fontSize":24,"fill":"#ffffff"}}` | 2 | Closed. Spec 093/R3 (`F-11`, `src/model/id-path.ts:20-23`, `src/service/elements/tools/element-add.ts:34-39`) |
| 2026-11-02 | `7b7b45c` | Duplicate element IDs in `compact.elements` are reported twice with different messages (`"ID duplicado «dup» (ya está en elements.0)"` and `"ID duplicado «dup» en la escena compacta"`) when another schema error is present, and fail with `code: "invalid_compact_scene"` instead of `"duplicate_id"` in `scene_build`. `setup`: none. `call`: `scene_validate {"project":"qa-test","compact":{"duration":4,"fps":30,"width":1080,"height":1920,"elements":[{"id":"dup","kind":"text","text":"A","x":0,"y":0,"w":100,"fontSize":24,"fill":"#ffffff"},{"id":"dup","kind":"text","text":"B","x":0,"y":100,"w":100,"fontSize":24,"fill":"#ffffff"},{"id":"bad","kind":"shape","shape":"rect","x":0,"y":0,"w":100,"h":100,"fill":"not-a-color"}]}}` | 1 | Closed. Spec 093/R4 (`F-12`, `src/service/compact/expand.ts:445-449`) |
| 2026-11-02 | `7b7b45c` | `scene_inspect_layout` (`shapesStack`) treats full-frame `particles` as a solid shape (reporting `shape_overlap` against `s1-bg`) and reports `shape_overlap` against `s2-bg` whenever a shape protrudes slightly off-canvas (`out_of_bounds`) while >50 % of its area stays inside. `setup`: `scene_build` `videos/qa-test/dense/scene.json`. `call`: `scene_inspect_layout {"project":"qa-test","name":"dense"}` | 4 | Closed. Spec 094/R1–R2 (`F-08`, `F-14`, `src/service/layout/layout.ts:404,411-429`) |
| 2026-11-02 | `7b7b45c` | `background_set` error message and `misplacedHint` say `"preset: Indica un preset o valores\n«values» no es un parámetro de background_set: ¿van dentro de «preset»?"` when the parameter is `patch` and `preset` is a string. `setup`: scene `errors` exists. `call`: `background_set {"project":"qa-test","scene":"errors","values":{"color":"#000000"}}` | 3 | Closed. Spec 093/R5 (`F-15`, `src/service/core/registry.ts:168-190`) |
| 2026-11-02 | `7b7b45c` | `chart` (`pie`/`donut`) draws slice arcs and labels in the same `data.forEach` loop (`src/components/chart/draw.ts:143-166`), so subsequent slices paint over narrow slice labels, and `d.label \|\| short(d.value)` hides the value when `showValues: true`. `setup`: `scene_build` `videos/qa-test/claims/scene.json`. `call`: `scene_preview {"project":"qa-test","scene":"claims","t":14,"scale":0.5}` | 2 | Closed. Spec 094/R3 (`F-10`, `src/components/chart/draw.ts:143-166`) |
| 2026-11-02 | `7b7b45c` | `scene_generate_speech` hardcodes `format: "mp3"` (`src/service/speech/tools/scene-generate-speech.ts:115,142`), miscalculating duration (`2.33 s` for a `4.00 s` WAV clip) and saving `.mp3` when a local/custom TTS server returns a WAV buffer (`RIFF....WAVE`). `setup`: local TTS returning WAV. `call`: `scene_generate_speech {"project":"qa-test","scene":"product","text":"Every day, your roof receives enough sunlight to power your entire home.","provider":"local","baseUrl":"http://127.0.0.1:18880","asTrack":true}` | 2 | Closed. Spec 095/R2 (`F-16`, `src/service/speech/tools/scene-generate-speech.ts:145-185`, `src/service/speech/audio-duration.ts:88-105`) |
| 2026-11-02 | `7b7b45c` | A shot-bound element (`shot: "s2"`, `5.5..11.0 s`) with `anim.in.delay: 0.15` or `anim.out.delay: 5.25` finishes its animation before `s2` starts with no notice, and `rebindShot` shifts `tracks` without shifting `anim.in.delay`/`anim.out.delay`. `setup`: element in `shot: "s2"` with `anim.out.delay: 5.25, duration: 0.25`. `call`: `scene_validate` / `shot_set` | 4 | Closed. Spec 094/R4 (`F-17`, `src/model/shot-timing.ts:1-6,86-97`, `src/service/scenes/scene-notices.ts:159-196`) |
