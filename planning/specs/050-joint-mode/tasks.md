# 050 — joint-mode — Tasks

- [x] T001 [agent] [status:done] `sceneChangeOf` and the `sceneWatch` Vite plugin sending `lienzo:scene-changed`; registered in `vite.config.ts`
      covers: D1@1
      changes: src/model/scene-changed.ts (+7 -0), src/service/scene-watch.ts (+48 -0), vite.config.ts (+2 -0)
- [x] T002 [agent] [status:done] `sceneEvents()` adapter over `import.meta.hot`
      covers: D2@1
      changes: src/editor/joint/scene-events.ts (+23 -0)
- [x] T003 [agent] [status:done] Turn reducer in `src/editor/joint/turn.ts`
      covers: D3@1
      changes: src/editor/joint/turn.ts (+26 -0)
- [x] T004 [agent] [status:done] `incomingScene` in `src/editor/joint/incoming.ts`
      covers: D4@1
      changes: src/editor/joint/incoming.ts (+29 -0)
- [x] T005 [agent] [status:done] `useJointMode` hook: events, tick, apply or open incoming scenes, debounced write, no write after an invalid file
      covers: D5@1, D7@1
      changes: src/editor/joint/use-joint-mode.ts (+110 -0)
- [x] T006 [agent] [status:done] Lock at `setScene` during the agent's turn, banner with "Tomar el control", disabled inspector
      covers: D6@1
      changes: src/editor/app.tsx (+64 -5), src/editor/panel.tsx (+5 -1), src/styles.css (+16 -0)
- [x] T007 [agent] [status:done] "Modo conjunto" switch in the Escenas tab, off by default, off on project change, disabled without a dev server
      covers: D7@1
      changes: src/editor/app.tsx (+18 -10), src/editor/joint/joint-switch.tsx (+32 -0), src/styles.css (+8 -0)
- [x] T008 [agent] [status:done] Tests: `sceneChangeOf` accepts only project scene files; turn goes to the agent on a write and back after 3 s idle or on take-control
      covers: R2@1, R4@1, R8@1
      kind: test
      changes: src/editor/joint/turn.test.ts (+36 -0), src/service/scene-watch.test.ts (+40 -0)
- [x] T009 [agent] [status:done] Tests: own write ignored, invalid file reported and nothing written, other scene opened; hook with a fake event source and fake timers: agent write applied as one undo step, edits blocked in the agent's turn, user edit written after the debounce, nothing happens with the mode off
      covers: R1@1, R2@1, R3@1, R5@1, R6@1, R7@1
      kind: test
      changes: src/editor/joint/incoming.test.ts (+34 -0), src/editor/joint/use-joint-mode.test.ts (+149 -0)
- [ ] T010 [human] [status:todo] With `pnpm dev` open and the MCP agent on the same project, turn on "Modo conjunto", ask the agent for a post, watch it build, correct something by hand and give another instruction
      covers: R1@1, R2@1, R3@1, R4@1, R5@1
