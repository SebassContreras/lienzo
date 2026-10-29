# 084 — id-charset

## Goal
Element and shot ids are free text: `"Bad Id!"` is stored. Tools address an element by `id` or
a `group/child` path (spec 051), so an id holding `/` can never be addressed, and an empty or
padded id is a typo that goes unnoticed. When this spec is done, a scene with an id the
tools cannot address fails at every writer, listing each bad id, and existing scenes keep
opening.

## Requirements
- R1: An element id and a shot id are non-empty, have no `/`, no leading or trailing
  whitespace and no control characters. Spaces inside and accents stay valid (`Caja Ámbar`).
- R2: Every writer applies R1 at one shared point (`prepareScene`), listing every bad id with
  the path of what the caller sent (A27).
- ~~R3: The editor refuses the same ids where it lets the user rename or name an element or a
  shot, with the same rule.~~ → R6
- R6 (R3): The editor needs no check: it never takes an id typed by the user (`nextShotId`,
  generated element ids; the user edits `name`).
- R4: A scene already stored with a bad id still opens in the editor and renders; only a write
  that changes or adds the id is refused, with a notice on read.
- R5: Docs and tool descriptions state the rule once (`RULES` in `src/mcp/server.ts`).

## Design
- D1 (R1): `validId(id): string | undefined` (the reason) in `src/model/ids.ts`, next to
  `duplicateIds`; pure, used by tools and editor.
- D2 (R2, R4): `prepareScene` checks ids of changed elements and shots only, as
  `checkReferences` does, so a stored scene is not rejected as a whole.
- ~~D3 (R3): the inspector's id field and the shots section show the reason as an error.~~ → R6
- D4 (R2): one adapter per writer in `src/service/contract/` and one replay case; a writer
  without one fails the suite (082).
- Not doing: a strict `[a-z0-9-]` charset; it would break stored scenes and ids that read well.

## Tasks
- [x] 084/T001 [agent] `validId` in `src/model/ids.ts` with examples (empty, `a/b`, padded, control character, `Caja Ámbar`) — covers R1, D1
- [x] 084/T002 [agent] `prepareScene` fails on a changed element or shot with a bad id, listing every one; a stored scene with one still loads — covers R2, R4, D2
- [x] 084/T003 [agent] Matrix adapter for the id rule in every `effects: scene` writer, and a replay case — covers R2, D4
- [x] 084/T004 [agent] Editor: checked, no id field takes user text, nothing to add — covers R6; replaces D3
- [x] 084/T005 [agent] `RULES`, README and `docs/components.md` state the rule; the line under Ideas of the roadmap is gone — covers R5
- [x] 084/T006 [agent] Review: a fresh agent reads the diff against R1–R5 and tries `element_add`, `scene_update`, `shot_set`, `scene_build` with `"a/b"` and `""` — covers R1, R2, R3, R4, R5
      reviewed: (by a fresh agent) ids.ts, scenes.ts, scene-changes.ts, contract/rules.ts and writers.ts, stored-ids.test.ts; element_add, scene_create, scene_build, shot_set, scene_update symbols, element_group with bad ids — found a stored bad id was refused when its element changed (element_group): fixed by comparing ids with `idsOf(previous)` and tested; `patch.id: ""` on element_add gets a generated id (left); no notice on read (R4 amended)
- [x] 084/T007 [agent] Verify: `pnpm typecheck`, tests of `src/model`, `src/service/scenes`, `src/service/contract`, `pnpm replay` — covers R1, R2, R3, R4, R5
      verified: pnpm typecheck; vitest src/model/ids, contract, scenes, elements, shots 1032 passed; pnpm replay 24/24 — found nothing; MCP not rebuilt, so not tried live

## Changes
- 2026-10-29: R3 → R6, D3 dropped. Why: the editor generates every element and shot id; the user edits only `name`. Work: T004 closed as a check.
- 2026-10-29: R4 no longer asks for a notice on read, and a stored id is judged by its id, not by its element changing. Why: T006 review. Work: `checkIdNames` uses `idsOf(previous)`.
