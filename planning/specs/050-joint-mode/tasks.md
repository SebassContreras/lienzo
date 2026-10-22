# 050 — joint-mode — Tasks

- [ ] T001 [agent] [status:todo] `sceneChangeOf` and the `sceneWatch` Vite plugin sending `lienzo:scene-changed`; registered in `vite.config.ts`
      covers: D1@1
- [ ] T002 [agent] [status:todo] `sceneEvents()` adapter over `import.meta.hot`
      covers: D2@1
- [ ] T003 [agent] [status:todo] Turn reducer in `src/editor/joint/turn.ts`
      covers: D3@1
- [ ] T004 [agent] [status:todo] `incomingScene` in `src/editor/joint/incoming.ts`
      covers: D4@1
- [ ] T005 [agent] [status:todo] `useJointMode` hook: events, tick, apply or open incoming scenes, debounced write, no write after an invalid file
      covers: D5@1, D7@1
- [ ] T006 [agent] [status:todo] Lock at `setScene` during the agent's turn, banner with "Tomar el control", disabled inspector
      covers: D6@1
- [ ] T007 [agent] [status:todo] "Modo conjunto" switch in the Escenas tab, off by default, off on project change, disabled without a dev server
      covers: D7@1
- [ ] T008 [agent] [status:todo] Tests: `sceneChangeOf` accepts only project scene files; turn goes to the agent on a write and back after 3 s idle or on take-control
      covers: R2@1, R4@1, R8@1
      kind: test
- [ ] T009 [agent] [status:todo] Tests: own write ignored, invalid file reported and nothing written, other scene opened; hook with a fake event source and fake timers: agent write applied as one undo step, edits blocked in the agent's turn, user edit written after the debounce, nothing happens with the mode off
      covers: R1@1, R2@1, R3@1, R5@1, R6@1, R7@1
      kind: test
- [ ] T010 [human] [status:todo] With `pnpm dev` open and the MCP agent on the same project, turn on "Modo conjunto", ask the agent for a post, watch it build, correct something by hand and give another instruction
      covers: R1@1, R2@1, R3@1, R4@1, R5@1
