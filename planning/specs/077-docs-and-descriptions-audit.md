# 077 — docs-and-descriptions-audit

## Goal
After 074–076 the docs and the tool descriptions were updated spec by spec, each for what it
changed. Read as a whole against `main` (eb3cda3), some still describe older behavior:
`architecture.md` A7 puts scenes and assets at the repo root (projects moved them in 040),
`product.md` lists brand kits and audio as out of scope (both exist since 045/046) and its
docs list misses most docs, and several tool descriptions miss a 074–076 rule (layout codes,
loose lines on removal, keyframe time, stills past the end, `traits` optional, `<slug>` where
the parameter is `project`). When this spec is done, every doc the project keeps and every
tool description matches the code, checked one by one.

## Requirements
- R1: Every tool description states what the tool does on `main`, including its failures and
  notices from 074–076.
- R2: README, AGENTS.md, the usage skill and `docs/components.md` match the code.
- R3: `architecture.md` A7 describes project workspaces; the 075 rule (one rule, one place)
  is an architecture decision; `changes.md` records both.
- R4: `product.md` scope and docs list match what exists.

## Design
- D1 (R1): Dump every registered description (the MCP view) and read each against its tool's
  code; fix only what is wrong or missing. `descriptions.test.ts` follows `traits?`.
- D2 (R2): Same reading for each doc; spectrace skills and spec files are records and stay.
- D3 (R3): A7@3 → A7@4 (projects/<project>/ with scenes, assets, presets, exports, fonts;
  `/api/projects`); ADDED A27@1: a rule the editor and the tools both apply is one pure
  function in `src/model/` both call, held by `contract.test.ts`.
- D4 (R4): Out of scope keeps accounts, hosting, collaboration and publishing; brand guides
  (045) and audio (046, 060) move to what Lienzo does. Docs lists README, AGENTS.md,
  `docs/components.md`, the usage skill, `schemas/compact-scene.json` and `planning/`.

## Tasks
- [x] 077/T001 [agent] Tool descriptions read one by one and fixed — covers R1, D1
- [x] 077/T002 [agent] README, usage skill, docs/components.md read and fixed — covers R2, D2
- [x] 077/T003 [agent] architecture.md A7@4 and A27, changes.md, product.md, AGENTS.md — covers R2, R3, R4, D3, D4
- [ ] 077/T004 [agent] Verify: typecheck, lint on touched files, tests, the description dump re-read, every tool named in README and the skill — covers R1, R2, R3, R4
