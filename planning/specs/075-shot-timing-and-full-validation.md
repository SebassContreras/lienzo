# 075 — shot-timing-and-full-validation

## Goal
Specs 067–074 kept finding failures. Read back, most were not regressions: three QA rounds
(071–073) reported fixed bugs as open because the tester ran a stale MCP server. Two kinds
were real. A fix scoped to one tool broke another (073/D3 id paths became random ids in
compact, fixed in 074/T010). And one rule, "a shot-bound element animates while its shot is
on screen", was never written down as a rule: each spec patched one path that writes it
(071 counter, 072 counter at its shot, 074 preset tracks). The next paths are still open:
rebinding an element (`element_update shot`, the inspector's "Toma" select), moving a shot's
`start` (`shot_set`, the shots section), and removing a shot in the editor, which leaves
elements bound to a missing shot that 074 now rejects on their next tool edit. Also,
`scene_validate` still hides shot and reference problems behind schema errors.

When this spec is done, the rule lives once in `src/model/` and every path (tools and
editor) goes through it, `scene_validate` reports schema and rule problems together, and the
contract test holds the timing rule across tools.

## Requirements
- R1: A shot-bound element's tracks are timed from its shot's `start` (an unbound element's
  from 0), as `anim` already is. Binding, rebinding or unbinding an element moves its tracks
  by the difference of those origins, in `element_update` and in the inspector; tracks given
  in the same patch are taken as given. A notice says what moved.
- R2: Changing a shot's `start` moves the tracks of the elements bound to it and the shot's
  own camera tracks by the same amount, in `shot_set` and the editor's shots section; a
  notice lists the elements.
- R3: Removing a shot in the editor unbinds its elements, as `shot_set remove` does, and
  both move the unbound elements' tracks to the scene's origin (R1).
- R4: `scene_validate` and every scene write list schema problems and rule problems (shots,
  unknown shots, icons, line targets, animation presets) in one `errors` list.
- R5: The contract test holds the timing rule: rebind, unbind, shot move and shot removal,
  each written out.
- R6: AGENTS.md states where a shared rule lives and how a QA fix is tested; 074's Changes
  records why five tests were rewritten.

## Design
- D1 (R1, R2, R3): `src/model/shot-timing.ts`, pure: `shotOrigin(shots, id?)`,
  `shiftTracks(tracks, delta)` (keys and `until` move; a key that would go below 0 lands
  on 0 and replaces an earlier one there) and `rebindShot(el, to, shots)`. `fromShotStart`
  (074/D4) becomes a use of `shiftTracks`. Checked against NLEs: Premiere keyframes are set
  relative to a clip's in point and travel with the clip
  (community.adobe.com, "Allow clip to be slipped without moving its keyframes").
  - _Trade-offs_: A user who wrote scene-time tracks on purpose and then rebinds sees them
    move; unbinding moves a count-up back to 0.
  - _Mitigation_: It matches `anim`, which already plays from the shot's start; every move
    is named in a notice, and a patch that gives `tracks` keeps them as given.
- D2 (R2, R3): `src/model/shots.ts` gains scene-level edits shared by `shot_set` and
  `shots-section.tsx`: `setShotIn(scene, patch)` (calls `setShot`, then shifts bound
  elements and the shot's camera when `start` changed) and `removeShotIn(scene, id)` (calls
  `removeShot` and unbinds through `rebindShot`). Both return `{ scene, moved }` or
  `{ error }`.
  - _Trade-offs_: A patch giving a new `start` and a new `camera` together: the camera given
    is taken as given, after the stored one moved.
  - _Mitigation_: Same rule as tracks in a patch (R1); tested.
- D3 (R4): `checkSceneRules` runs on raw data when the schema fails: shots parsed on their
  own (`ShotSchema` array, then `shotProblem`), references and animation presets read from
  the raw element tree (they only need `id`, `kind`, `shot`, `icon`, `a/b.attach`,
  `animPreset.name`, `children`). The walk in `scene-changes.ts` takes that loose shape.
  - _Trade-offs_: Rules on a half-valid scene can report a problem the schema error also
    causes (a line attached to an element whose own fields are wrong is still found).
  - _Mitigation_: Only references to ids, shots and names are checked, which do not depend
    on the failing fields.
- D4 (R5): `contract.test.ts` gains the timing cases.
- D5 (R6): AGENTS.md "Rules for agents": a rule both the editor and tools apply lives in
  `src/model/` and both call it; a QA fix names the rule it restores and adds a case per
  writer to `contract.test.ts`.

## Tasks
- [x] 075/T001 [agent] `shot-timing.ts` (`shotOrigin`, `shiftTracks`, `rebindShot`); `fromShotStart` on top; rebind in `element_update` and the inspector — covers R1, D1
- [x] 075/T002 [agent] `setShotIn` / `removeShotIn` in `shots.ts`, used by `shot_set` and the shots section — covers R2, R3, D2
- [x] 075/T003 [agent] Rules on raw data when the schema fails — covers R4, D3
- [x] 075/T004 [agent] Contract cases for the timing rule — covers R5, D4
- [x] 075/T005 [agent] Docs: AGENTS.md rule, usage skill, README, 074 Changes note — covers R6, D5
- [x] 075/T006 [agent] Verify: typecheck, lint on touched files, tests, replay with `pnpm lienzo` (rebind, shot move, removal, validate with schema + rule errors) — covers R1, R2, R3, R4, R5, R6
      verified: `pnpm typecheck`, biome on the 13 touched source files, `pnpm test` (1266 tests, 153 files); replayed with `pnpm lienzo` on scratch project `qa-075` (deleted after): `r` with an x key at 1 s in s1 (0–3), `element_update shot: s2` (3–6) → key at 4, notice «r» +3s; `shot_set s2 start: 4` → key at 5, notice +1s; `shot_set s2 remove` → unbound, key at 1, notices −4s and unbound; `scene_validate` with a bad easing, overlapping shots and shot `s9` → errors at `compact.elements.0.tracks.x.0.easing`, `compact.shots`, `compact.elements.1.shot` — found: nothing new
