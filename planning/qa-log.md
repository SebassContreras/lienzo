# QA log

How a QA run of the MCP tools works and what it found. A finding is one line in the log below.
A round no longer gets its own spec (082/D9). Only a class-2 or class-4 finding that needs
design work gets one.

## Before a run

1. Restart the MCP server and check that the commit in its `instructions` is `git rev-parse --short HEAD`.
2. `pnpm test` and `pnpm replay` pass at that commit.

## The closed list

A run checks these, and only these, through the tools:

- **Rules in every writer**: each rule of `RULES` (`src/service/contract/rules.ts`) through each
  tool with `effects: scene`. They cover shot references, spans and ids, unique element ids, a
  group's id, opacity and spotlight fractions, icons, line attachments, easings, scene limits
  (fps, side, duration), `use` symbols and overrides, track paths, animation presets, and the
  notices for fonts, last-keyframe easings, camera channels, transitions, missing audio and
  images, and off-canvas elements.
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
