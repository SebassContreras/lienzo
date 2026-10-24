# 061 — audit-docs-and-tts-cleanup — Tasks

- [x] T001 [agent] [status:done] AGENTS.md, README, `.env.example` and tool descriptions follow the code
      covers: D1@1
      changes: .env.example (+30 -31), AGENTS.md (+13 -7), README.md (+2 -1), src/service/tools/scene-build.ts (+1 -1), src/service/tools/shot-set.ts (+1 -1)
- [x] T002 [agent] [status:done] `docs/components.md` with every kind; README links it
      covers: D2@1
      changes: README.md (+6 -15), docs/components.md (+131 -0)
- [x] T003 [agent] [status:done] Test: every registered kind has a section in `docs/components.md`
      covers: R2@1
      kind: test
      changes: src/components/components-doc.test.ts (+11 -0)
- [x] T004 [agent] [status:done] One stored editor key: migrate and drop the legacy slot
      covers: D3@1
      changes: src/service/tts/config.ts (+4 -17), src/service/tts/preferences.ts (+15 -22)
- [x] T005 [agent] [status:done] TTS dialog uses the defaults from `config.ts`
      covers: D4@1
      changes: src/editor/dialogs/tts-dialog.tsx (+14 -10), src/service/tts/config.ts (+2 -2)
- [x] T006 [agent] [status:done] Test: a legacy key moves into the preferences and the slot is removed
      covers: R3@1
      kind: test
      changes: src/service/tts/tts-config.test.ts (+12 -0)
- [x] T007 [agent] [status:done] Remove the pre-012 hand-written schema and its comparisons
      covers: D5@1, R5@1
      changes: src/test/legacy-schema.ts (+0 -283), src/test/registry.test.ts (+3 -76)
- [x] T008 [agent] [status:done] Untrack `__pycache__` and ignore it
      covers: D6@1, R6@1
      changes: .gitignore (+3 -0)
- [x] T009 [agent] [status:done] `pnpm test` exits 0 when every test passes
      covers: D7@2, R7@1
      └─ reviewed 2026-10-24: the task made exactly the fix D7@2 now describes
      changes: src/service/image-probe.test.ts (+3 -1), src/service/renderer.test.ts (+1 -1)
- [x] T010 [agent] [status:done] Check: R1 docs claims against the code and `--help`
      covers: R1@1, R4@1
      kind: test
      changes: AGENTS.md (+2 -1), docs/components.md (+2 -2)
