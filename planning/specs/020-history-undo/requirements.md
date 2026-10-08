# 020 — history-undo — Requirements

## What's being built

Full undo/redo stack for the canvas editor (`Ctrl+Z`, `Ctrl+Shift+Z` / `Cmd+Z`, `Cmd+Shift+Z`),
capturing canvas transformations, element additions, deletions, reorderings, and property edits.

## Who it serves

Creators editing posts and layouts who need to experiment, make mistakes, and recover
previous states quickly without manual re-adjustments.

## Requirements

- R1@1: Canvas actions (dragging, resizing, adding, deleting, duplicating, reordering elements) push undoable states onto an in-memory history stack.
- R2@1: Inspector property edits push debounced or transaction-bound undo states (e.g. dragging a color or numeric slider pushes one undo step on mouse release).
- R3@1: Keyboard shortcuts (`Ctrl+Z` / `Cmd+Z` for undo; `Ctrl+Shift+Z` / `Cmd+Shift+Z` or `Ctrl+Y` / `Cmd+Y` for redo) restore the previous/next scene snapshot.
- R4@1: Visual Undo and Redo buttons exist in the editor header with active/disabled states indicating stack availability.
- R5@1: Undo stack does not break or desync the auto-save mechanism (`localStorage`).
- R6@1: History buffer is capped to a reasonable memory threshold (e.g. 50 states) to prevent memory leaks during long editing sessions.

## Dependencies

001.

## Owner split

All tasks agent.
