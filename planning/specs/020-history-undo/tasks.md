# 020 — history-undo — Tasks

- [x] T001 [agent] [status:done] Pure `history.ts` and `useHistory`; move the stacks out of `app.tsx`
      covers: D1@1, D5@1
- [x] T002 [agent] [status:done] Cap of 75 states; `Ctrl/Cmd+Y` redo; text inputs keep native undo
      covers: D1@1, D3@1
- [x] T003 [agent] [status:done] Inspector checkpoint on the first change of a gesture instead of on focus
      covers: D2@1
- [x] T004 [agent] [status:done] Header buttons enabled from the stack sizes
      covers: D4@1
- [x] T005 [agent] [status:done] Test: push, dedupe, undo, redo, cap, redo cleared by a new change
      covers: R1@1, R3@1, R6@2
      kind: test
- [x] T006 [agent] [status:done] Test in the browser: one slider drag and one field edit then Tab undo in one step each; buttons reflect the stacks; autosave holds the undone scene after reload
      covers: R2@2, R4@1, R5@1
      kind: test
