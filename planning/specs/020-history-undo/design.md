# 020 — history-undo — Design

## Approach

- D1@1 (implements R1, R5, R6): The history is pure functions in `src/editor/history.ts` (`push` skipping a state equal to the top, `undo`, `redo`, a cap of 75 states) wrapped by a `useHistory` hook; `app.tsx` keeps no stacks of its own. Autosave keeps watching only the current scene, so undo and redo are saved like any edit.
- D2@1 (implements R2): The inspector records a checkpoint on the first change of a gesture (first input of a field, pointer down on a slider or colour), never on focus, so tabbing or focusing without a change records nothing.
- D3@1 (implements R3): `Ctrl/Cmd+Z` undoes, `Ctrl/Cmd+Shift+Z` and `Ctrl/Cmd+Y` redo; inside a text input the keys are left to the browser's own text undo.
- D4@1 (implements R4): The header's undo and redo buttons are enabled from the size of each stack.
- D5@1 (implements R1): Every editor action (and those of 021 and 022) records undo through this one history API, one checkpoint per gesture.

## Deliverables

`src/editor/history.ts` with its hook; `app.tsx` and the inspector wired to it.

## Context

Most of R1, R3 and R4 already exists in `app.tsx` (undo and redo stacks capped at 200 today,
buttons, `Ctrl+Z`); this spec moves it out of `app.tsx` and fixes the gaps.

