# 073 — qa-round-5-fixes

## Goal
The fifth QA run lists one item still open and two new ones. Item 3 (`preset_list`/`preset_get` with `project`) is the same report as in 071 and 072: on `main`, both tools take `project` (`src/service/tools/preset-list.ts`, `preset-get.ts`) and `qa-round-3.test.ts` covers them. So the tester most likely ran a stale server again, even with the build id from 072. When this spec is done, item 3 has been replayed against a server whose build id matches `HEAD`. `scene_inspect_layout` and the preview agree on which shot-bound elements are visible at a shot boundary. An `element_update` error names the element id instead of an array index.

## Requirements
- R1: Item 3 is replayed on a freshly started MCP server whose build id equals `git rev-parse --short HEAD`. If it still fails there, it gets a regression test and a fix. If it passes, the QA note in AGENTS.md says that a report without a matching build id is not accepted as "still open".
- R2: At every `t`, an element bound to a shot is either both drawn by the renderer and placed by `scene_inspect_layout`, or neither. With back-to-back cut shots s1 [0, 3) and s2 [3, 6), at t=3 only s2's elements count: no overlap between s1 and s2, and the s2 counter is drawn.
- R3: An `element_update` (or any scene write) whose check fails inside `elements` reports the path by element id (`elements.a.w`, `elements.g/child.w` for nested ones), the same way other errors name the element.

## Design
- D1 (R1): Restart the MCP server, check its build id against `HEAD`, then call `preset_save` → `preset_list { project }` → `preset_get { project, name: "Mi tarjeta" }`. Also look at `preset_get` by display name (not the file slug), because the report says the preset is found only through its file name.
  - _Trade-offs_: No code change if it passes, so this costs one more QA cycle.
  - _Mitigation_: The AGENTS.md note turns the build-id check into a precondition for "still open" reports, which ends the stale-server loop.
- D2 (R2): First reproduce it. Write a test that renders the two shots at t=3 and runs layout at t=3. Both already call `isElementActiveInShot` (`src/engine/shots.ts:25`), which uses `t <= end`, so the difference is probably downstream: layout skips opacity-0 / pre-`in` elements in a different way than `render` does, or the counter's count-up starts at 0 or has opacity 0 at exactly `start`. Then switch the window to half-open `[start − d, end + d)`, the same `[start, end)` that `shotProblem` (`src/model/shots.ts:139`) already uses, and make layout skip only what `render` skips, through one shared predicate.
  - _Trade-offs_: Half-open means a shot's last instant `t = end` no longer shows it. A scene whose last shot ends exactly at `duration` would draw nothing from that shot at the final frame.
  - _Mitigation_: Test the last frame. Treat the last shot as closed when `end === duration`, or rely on the export's last frame being `duration − 1/fps`. Check which of the two holds before choosing. Search for real-world NLE conventions for frame ranges (half-open is the norm) to confirm.
- D3 (R3): In `checkScene` (`src/service/scenes.ts:20`), map the numeric `elements.N(.children.M)*` prefix of `parsed.path` to the element id path before calling `fail`. Write it as one pure helper, `idPath(scene, path)`, next to `checkScene`, used only there (KISS: no new abstraction). If an index does not resolve, keep the raw path.
  - _Trade-offs_: The path no longer matches the JSON index, so a client that walks the raw JSON by path breaks.
  - _Mitigation_: The ids are unique per scene, and other errors already use ids. The tool descriptions say paths name elements by id.

## Tasks
- [ ] 073/T001 [agent] Replay item 3 on a restarted server with a matching build id; regression test + fix only if it fails; AGENTS.md QA note — covers R1, D1
- [ ] 073/T002 [agent] Failing test: render vs layout at a shot boundary (t=3 with s1 0–3, s2 3–6, plus the last frame at `duration`) — covers R2, D2
- [ ] 073/T003 [agent] One half-open activity window shared by render and layout; fix whatever T002 shows — covers R2, D2
- [ ] 073/T004 [agent] Failing test then fix: `element_update` with `w: -50` on element `a` (and a nested child) reports `elements.a.w` — covers R3, D3
- [ ] 073/T005 [agent] Verify: typecheck, lint on touched files, tests, replay all 3 QA cases with `pnpm lienzo` and a preview at t=2.99, 3 and 4 — covers R1–R3

## Changes
