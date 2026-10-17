# 034 — layers-panel — Requirements

## What's being built

A dedicated Layers panel (panel de capas) in the left sidebar or inspector that displays all canvas elements in their visual stacking order (z-index), provides one-click visibility and lock controls, displays semantic element icons and labels, and allows drag-and-drop or button-based reordering.

## Who it serves

Creators and designers working with scenes that contain overlapping text, graphics, subtitles, and backgrounds, who need an unambiguous way to inspect, select, and organize elements.

## Requirements

- R1@1: A "Capas" (Layers) panel is available in the editor's navigation/sidebar, presenting elements ordered from front (highest z-index) to back (lowest z-index).
- R2@1: Each layer row displays the component's kind icon, an editable or auto-generated descriptive name (e.g. text snippet, custom label, or component kind), and its current selection state.
- R3@1: Two-way selection sync: selecting an element in the layers panel selects it on the canvas (including multi-selection), and clicking an element on the canvas scrolls to and highlights its layer row.
- R4@1: Each layer row features quick-action toggles: visibility toggle (eye icon to temporarily hide from canvas) and lock toggle (lock icon to prevent accidental drag or edit on stage).
- R5@1: Layer order can be changed via drag-and-drop handles or "Subir / Bajar" buttons, updating the underlying scene `elements` array and registering actions with the undo/redo history system.
- R6@1: Group elements display collapsible nested children layers, enabling hierarchy inspection and grouped operations.

## Out of scope

- Photoshop-style blend mode compositing per layer (handled via element effects if needed).
- Vector layer clipping masks.

## Dependencies

001, 012, 020.

## Owner split

All tasks agent.
