# 020 — history-undo — Tasks

- [ ] T001 [agent] [status:todo] Pure `history.ts` and `useHistory`; move the stacks out of `app.tsx`
      covers: D1@1, D5@1
- [ ] T002 [agent] [status:todo] Cap of 75 states; `Ctrl/Cmd+Y` redo; text inputs keep native undo
      covers: D1@1, D3@1
- [ ] T003 [agent] [status:todo] Inspector checkpoint on the first change of a gesture instead of on focus
      covers: D2@1
- [ ] T004 [agent] [status:todo] Header buttons enabled from the stack sizes
      covers: D4@1
- [ ] T005 [agent] [status:todo] Test: push, dedupe, undo, redo, cap, redo cleared by a new change
      covers: R1@1, R3@1, R6@2
      kind: test
- [ ] T006 [agent] [status:todo] Test in the browser: one slider drag and one field edit then Tab undo in one step each; buttons reflect the stacks; autosave holds the undone scene after reload
      covers: R2@2, R4@1, R5@1
      kind: test
