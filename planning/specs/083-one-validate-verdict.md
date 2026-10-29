# 083 — one-validate-verdict

## Goal
`scene_validate` answers a failure in two shapes today. With `compact`, an expansion problem
(`buildCompact` fails) comes back as a tool failure (`ok: false`) while a rule problem is a
verdict (`ok: true, valid: false`); with `data` every problem is a verdict. A caller must
handle both. When this spec is done, `scene_validate` answers every problem about the input
as a verdict with `valid: false` and its `errors`, whichever of `data` or `compact` it got;
a tool failure means only that the call itself was malformed.

## Requirements
- R1: With `compact`, an expansion problem (unknown kind, bad `at`, unknown key that fails)
  is a verdict `{ valid: false, message, path, errors }`, as with `data`.
- R2: Passing both `data` and `compact`, or neither, stays a failure of the call
  (`invalid_input`, path `compact`): the input did not say what to validate.
- R3: A malformed call (missing or wrong-typed `project`, an unknown project) stays a failure.
- R4: `scene_build` and the other writers keep failing as before; only the `*_validate`
  tools answer with a verdict.
- R5: The description, README and the `lienzo-usage` skill name the one shape.

## Design
- D1 (R1, R4): in `scene-validate.ts` the `compact` branch already runs inside `verdictOf`;
  find why an expansion problem still escapes as a failure (an error thrown outside
  `ToolFailure`, or `buildCompact` called before `verdictOf`) and make `verdictOf` cover it.
  No change to `buildCompact`.
- D2 (R2, R3): the checks of the call itself stay outside `verdictOf`, before it.
- D3 (R5): `preset_validate` is checked for the same split; if it has it, it follows.

## Tasks
- [ ] 083/T001 [agent] A case in `src/service/scenes/tools/scene-validate.test.ts` per input form (`data`, `compact`): an expansion problem, a rule problem and two problems at once all give `valid: false` with every error listed — covers R1
- [ ] 083/T002 [agent] Make the `compact` branch of `scene_validate` answer every input problem as a verdict — covers D1
- [ ] 083/T003 [agent] Both or neither of `data`/`compact`, and a bad `project`, still fail as the call — covers R2, R3
- [ ] 083/T004 [agent] Check `preset_validate` and the contract adapters of `src/service/contract/` for the same split; adapt the validate cells of the matrix if they expect the old shape — covers D3, R4
- [ ] 083/T005 [agent] Description of `scene_validate`, README and `.agents/skills/lienzo-usage/` state the one shape — covers R5
- [ ] 083/T006 [agent] Review: a fresh agent reads the diff against R1–R5 and runs `scene_validate` with bad `compact` and bad `data` by `pnpm lienzo` — covers R1, R2, R3, R4, R5
- [ ] 083/T007 [agent] Verify: `pnpm typecheck`, tests of `src/service/scenes` and `src/service/contract`, `pnpm replay` — covers R1, R2, R3, R4, R5
