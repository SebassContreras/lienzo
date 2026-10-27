# 072 — qa-round-4-fixes

## Goal
The fourth QA run lists 5 problems as still open and 2 new ones. Items 1–3 (`element_update` with `w: -50`, `keyframe_set` with `opacity: 5`, `preset_list`/`preset_get` with `project`) are already covered by `src/service/tools/qa-round-3.test.ts` and pass on `main` (90aee32). The MCP server loaded in this session still shows `preset_list` with no `project` input, so the tester ran a stale server again. When this spec is done, a stale server is easy to spot, and the 4 real problems are fixed: two identical shapes are reported as overlapping, a new counter in a shot counts inside that shot, every scene write rejects a shot that ends after the scene, and a group's box includes its animated children.

## Requirements
- R1: The fourth QA run's items 1–3 are replayed against a freshly started MCP server. Any case that still fails gets a regression test and a fix. A tester can tell from a tool's output which build the server runs.
- R2: `scene_inspect_layout` reports `shape_overlap` for two top-level shapes with the same box (for example a rect and an ellipse both centred).
- R3: A counter's default count-up track starts at its shot's `start` (or at 0 when it has no shot) and runs for `COUNT_UP_SECONDS`, capped by the shot's `end` and by the scene's duration.
- R4: `scene_update`, `scene_build`, `scene_validate` and `shot_set` all apply the same rule: a scene whose shots end after its `duration` (or overlap each other) is rejected with the same message.
- R5: A group's box at time `t` is the union of its children's boxes at that `t`, including their tracks. `out_of_bounds` and the clip use that box.

## Design
- D1 (R1): Replay the three cases with `pnpm lienzo` and with a restarted MCP server before changing any code. `project_inspect` (or the MCP server's `serverInfo`) returns `version` + the git short sha read at startup, and the AGENTS.md QA note says to check it against `git rev-parse --short HEAD`.
  - _Trade-offs_: This adds a field to the output just for diagnosis.
  - _Mitigation_: It is read once at startup (no cost per call) and it saves a whole QA round of false "still open" reports.
- D2 (R2): In `shapesStack` (`src/service/layout.ts`), containment only excuses the pair when the inner box is clearly smaller (area < 90% of the outer one). Two boxes that are equal or almost equal contain each other but are not a card holding its content.
  - _Trade-offs_: A card that is just barely bigger than its content gets reported.
  - _Mitigation_: The 90% threshold is a named constant with a test on each side of it.
- D3 (R3): `withCountUp(el, given, scene)` in `src/components/counter/count-up.ts` reads the shot window: `start = shot?.start ?? 0` and `end = min(start + COUNT_UP_SECONDS, shot?.end ?? duration, duration)`. Its callers (`element_add`, `buildElement`) pass the scene (or its shots) instead of `duration`. Keyframe `t` is scene time (see the `keyframe_set` description), so no conversion is needed.
  - _Trade-offs_: If a shot is moved later, the counter's track does not follow it.
  - _Mitigation_: This is the same as any track the user sets by hand. The tool description says the track is written once, when the counter is added.
- D4 (R4): Call `shotProblem(scene.shots, scene.duration)` in the one shared scene check (`prepareScene` in `src/service/scenes.ts`) that every write and `scene_validate` go through. `shot_set` keeps its own call too, so its error still points at its `start`/`end` input.
  - _Trade-offs_: A stored scene that already breaks the rule can no longer be saved until it is fixed.
  - _Mitigation_: The error names the shot and its `end`. Opening a scene to read it does not run the check, so only writes do.
- D5 (R5): First reproduce it: a test with a group whose child has `tracks.x` 500→800 checks the group's box at t=3. If the box comes from the children's static `x`/`y`, then `placedElementsAt` builds the group box from the children's placed boxes at `t`. Grouped and ungrouped share the same box code, with no second implementation.
  - _Trade-offs_: Computing the box per `t` costs more for deep groups.
  - _Mitigation_: Inspection already places every element at each `t`, so the union reuses boxes that are already computed.

## Tasks
- [x] 072/T001 [agent] Replay items 1–3 on a restarted server; regression test + fix for any real failure — covers R1, D1
      found: with `pnpm lienzo` on main, `w: -50` fails at `elements.0.w`, `opacity: 5` fails with `invalid_value`, `preset_list`/`preset_get` with `project` find the project preset; no fix needed, qa-round-3.test.ts already holds them
- [x] 072/T002 [agent] Build version/sha in server output; QA note in AGENTS.md — covers R1, D1
- [x] 072/T003 [agent] shape_overlap for equal boxes (test on each side of the threshold) — covers R2, D2
- [x] 072/T004 [agent] Counter count-up starts at its shot's start — covers R3, D3
- [x] 072/T005 [agent] One shot/duration rule for every scene write and scene_validate — covers R4, D4
- [x] 072/T006 [agent] Reproduce the group box with an animated child; fix placement if needed — covers R5, D5
      found: the group box was its own `x`/`y`/`w`/`h`, so a child animated to x 1100 at t=3 gave no `out_of_bounds`; an unclipped group's box is now the union with its placed children. The clip itself is right: a `clip: true` group cuts to its own box by design (059)
- [ ] 072/T007 [agent] Verify: typecheck, lint on touched files, tests, replay the 7 QA cases with `pnpm lienzo` and a preview of the counter in s2 at t=3 — covers R1–R5

## Changes
- 2026-10-27: 072/D4 keeps the `shotProblem` call in `shot-set.ts`. Why: its tests and callers expect the error at the `end`/`start` input, not at `shots`. One function still holds the rule. Work: T005.
