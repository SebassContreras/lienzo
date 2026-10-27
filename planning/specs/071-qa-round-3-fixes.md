# 071 — qa-round-3-fixes

## Goal
The third QA run found 19 of the 069 problems fixed, 1 partly fixed, 3 still open, plus 6 new ones. Replayed against `main` (5bef31f), the 3 open ones (`element_update` with `w: -50`, `keyframe_set` with `opacity: 5`, `animation_save` with a partial `anim.loop`) and `preset_list` with `project` already behave as they should. The tester's MCP server predates 069/070, as `preset_list` without its `project` input shows. When this spec is done, grouping keeps every element where it was drawn, including its position tracks. Write notices only talk about what the call changed. Overlapping shapes are diagnosed. A new counter counts. An unknown Kokoro voice fails before the request is sent, with a clean message.

## Requirements
- R1: `element_group` (and the editor's Ctrl+G) converts the children's `x`/`y` position keyframes into group coordinates, so a grouped element is drawn where it was at every `t`. `element_ungroup` does the reverse, scaled by the group's stretch.
- R2: A grouped element bound to a shot is drawn inside that shot's window. Either the report (counter missing at t=4) is reproduced and fixed, or it is shown to be occlusion and the `element_group` notice says so.
- R3: A scene write's `notices` include resource notices (missing icon, missing asset, a line attached to nothing) only for elements the call added or changed. `scene_validate` still lists all of them.
- R4: `scene_inspect_layout` reports `shape_overlap` when two visible top-level non-text boxes overlap by 50% or more of the smaller one at the same `t` and neither one contains the other.
- R5: A counter added by `element_add` or `scene_build` with no `progress` track gets a default count-up track. A given track or a `progress` value turns this off.
- R6: The Kokoro/local adapter checks the voice against the server's voice list before it synthesizes. An unknown voice fails with only the list of valid voices: no request id, no URL.
- R7: Regression tests exist for the four items the tester still saw open (R5/R15/R16 of 069), and the QA notes say to restart the MCP server after pulling.

## Design
- D1 (R1): `translate` in `src/engine/geometry.ts` also shifts each keyframe `value` of `tracks.x`/`tracks.y` by `dx`/`dy`. `placeChild` maps them as it maps `x`/`y` (`body.x + v * sx`). Lines are left alone because their tracks are on `a`/`b`.
  - _Trade-offs_: `translate` is shared by move and nudge, so they now shift tracks too. That is the right behavior (a moved element should keep its motion), but it is a change.
  - _Mitigation_: Tests for move, group and ungroup with a track. The changelog in the spec names the change.
- D2 (R2): First reproduce it: a test that renders a group with a child bound to `s2` at t=4 and checks that the child's draw is called. If it is drawn, the cause is occlusion, and the notice gains "un hijo puede quedar tapado por otro del grupo". If it is not drawn, fix `drawElements`/`withShotView` for nested shots.
- D3 (R3): `saveScene` takes an optional `previous` scene. `editScene`/`openScene` callers pass it, and `resourceNotices` keeps notices whose element id is new or whose JSON differs from `previous` (a pure `changedIds(prev, next)` in `src/model/element-walk.ts`). With no `previous` (a full `scene_build`, `scene_update`), everything is reported.
  - _Trade-offs_: A missing resource is said only once, on the write that made it. A later caller may not see it.
  - _Mitigation_: `scene_validate` and the editor's "Revisión" still list it, and the tool descriptions say so.
- D4 (R4): A new check in `src/service/layout.ts` next to `text_overlap`, using the same boxes and times. Lines, groups and `fit: "canvas"` elements are skipped, as are pairs where one box contains the other (a card under its content).
  - _Trade-offs_: Intended overlaps (stacked decorations) are reported.
  - _Mitigation_: It is a diagnostic, not an error. The 50% threshold and the containment rule keep the common card+content case quiet.
- D5 (R5): `defaultTracks(kind)` in the counter descriptor returns `progress: [{t:0,value:0},{t:min(1.5, duration),value:1}]`. `element_add`/`buildElement` apply it when the input has neither `tracks.progress` nor `progress`. The schema default stays `1`, so stored scenes don't change.
  - _Trade-offs_: Two sources of "default" (the schema field and the add-time track).
  - _Mitigation_: Only the add paths apply it, in one helper. The description and `component_list` say a new counter counts over 1.5 s.
- D6 (R6): `LocalTtsAdapter.voices()` does `GET {base}/v1/audio/voices` (Kokoro-FastAPI; confirm by research before coding) and caches the result per adapter. `synthesizeSpeech` checks the voice (each `+`-mixed part) first. If the endpoint fails or is missing, it falls back to the current behavior, with the raw message stripped down to the hint.
  - _Trade-offs_: One extra request per adapter, and servers without the endpoint get no early check.
  - _Mitigation_: The cache, and the stripped fallback message.
- D7 (R7): Behavior tests in the existing tool test files (patch `w: -50` rejected, keyframe `opacity: 5` rejected, partial `loop` saved, `preset_list` with `project` includes the project preset), added only where missing. A line in AGENTS.md's QA notes.

## Tasks
- [x] 071/T001 [agent] Position tracks follow group/ungroup/move — covers R1, D1
- [x] 071/T002 [agent] Reproduce grouped child in shot; fix or document — covers R2, D2
      found: the grouped counter is drawn at t=4 (regression test in shots-render.test.ts); not a render bug, so the notice now warns about layer order
- [x] 071/T003 [agent] Resource notices only for changed elements — covers R3, D3
- [x] 071/T004 [agent] shape_overlap diagnostic — covers R4, D4
- [x] 071/T005 [agent] Counter default count-up track — covers R5, D5
- [x] 071/T006 [agent] Kokoro voice pre-check (research endpoint first) — covers R6, D6
- [x] 071/T007 [agent] Regression tests for the stale-server items; QA note — covers R7, D7
- [ ] 071/T008 [agent] Verify: typecheck, lint, tests, replay the QA cases with the CLI and a preview at t=4 — covers R1–R7
