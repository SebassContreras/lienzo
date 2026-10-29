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
- R3: The editor refuses the same ids where it lets the user rename or name an element or a
  shot, with the same rule.
- R4: A scene already stored with a bad id still opens in the editor and renders; only a write
  that changes or adds the id is refused, with a notice on read.
- R5: Docs and tool descriptions state the rule once (`RULES` in `src/mcp/server.ts`).

## Design
- D1 (R1): `validId(id): string | undefined` (the reason) in `src/model/ids.ts`, next to
  `duplicateIds`; pure, used by tools and editor.
- D2 (R2, R4): `prepareScene` checks ids of changed elements and shots only, as
  `checkReferences` does, so a stored scene is not rejected as a whole.
- D3 (R3): the inspector's id field and the shots section show the reason as an error.
- D4 (R2): one adapter per writer in `src/service/contract/` and one replay case; a writer
  without one fails the suite (082).
- Not doing: a strict `[a-z0-9-]` charset; it would break stored scenes and ids that read well.

## Tasks
- [ ] 084/T001 [agent] `validId` in `src/model/ids.ts` with examples (empty, `a/b`, padded, control character, `Caja Ámbar`) — covers R1, D1
- [ ] 084/T002 [agent] `prepareScene` fails on a changed element or shot with a bad id, listing every one; a stored scene with one still loads — covers R2, R4, D2
- [ ] 084/T003 [agent] Matrix adapter for the id rule in every `effects: scene` writer, and a replay case — covers R2, D4
- [ ] 084/T004 [agent] Editor: id and shot name fields show the reason — covers R3, D3
- [ ] 084/T005 [agent] `RULES`, README and `docs/components.md` state the rule; the line under Ideas of the roadmap is gone — covers R5
- [ ] 084/T006 [agent] Review: a fresh agent reads the diff against R1–R5 and tries `element_add`, `scene_update`, `shot_set`, `scene_build` with `"a/b"` and `""` — covers R1, R2, R3, R4, R5
- [ ] 084/T007 [agent] Verify: `pnpm typecheck`, tests of `src/model`, `src/service/scenes`, `src/service/contract`, `pnpm replay` — covers R1, R2, R3, R4, R5
