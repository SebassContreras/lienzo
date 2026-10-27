# 079 — descriptions-after-078

## Goal
078 changed what nine tools do on failure (built-in presets, opacity ranges, symbols, `patch`
paths, `exists`, removed symbols, `scene_delete`'s path) and added rules every tool shares
(object arguments as JSON strings, `errors`, Spanish messages). Read against `main`
(f212ab2), those nine descriptions and two docs still described 077, and the shared rules
were written nowhere a client reads first. When this spec is done each description says
what its tool does, the shared rules are said once in the MCP server's `instructions`, and
the docs agree.

## Requirements
- R1: The descriptions of `preset_rename`, `preset_delete`, `scene_validate`,
  `element_update`, `keyframe_set`, `element_add`, `scene_update`, `project_create` and
  `scene_delete` state their 078 behavior.
- R2: The MCP `instructions` state once how every tool takes arguments and answers
  failures: JSON values (a JSON string read too), `project`, `{ code, message, path }` with
  `errors` from scene and recipe checks, Spanish messages, notices, coordinates.
- R3: README, the usage skill and AGENTS.md say where `errors` appears, `patch.…` paths,
  built-in presets and where the shared rules live.

## Design
- D1 (R1): Edit each description in place; no new shared constant for one use (KISS).
- D2 (R2): `RULES` next to `VERSION` in `src/mcp/server.ts`, appended to `instructions`.
  - _Trade-offs_: A client that ignores `instructions` does not read them.
  - _Mitigation_: Each description still names its own failures (R1); the shared rules are
    what applies everywhere, so repeating them in 44 descriptions would only add tokens.
- D3 (R3): Doc edits; AGENTS.md's doc map says a rule for every tool goes in `RULES`.

## Tasks
- [x] 079/T001 [agent] Nine descriptions and the MCP instructions — covers R1, R2, D1, D2
- [ ] 079/T002 [agent] README, usage skill, AGENTS.md — covers R3, D3
- [ ] 079/T003 [agent] Verify: typecheck, lint on touched files, tests, the dump of every description and the instructions re-read — covers R1, R2, R3
