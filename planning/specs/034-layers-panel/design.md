# 034 — layers-panel — Design

## Approach

- D1@1 (implements R1): Add a "Capas" / "Biblioteca" tab selector at the top of the left sidebar in `src/editor/app.tsx` to switch between element library browsing and canvas layer tree management, with layers ordered from top (frontmost z-index) to bottom (backmost z-index).
  - _Trade-off_:
    - *Pro*: Keeps left navigation unified and uncluttered without taking away canvas width from the center stage or inspector.
    - *Con*: User cannot see the component library and layers simultaneously in narrow viewports.
    - *Mitigation*: Tab headers feature clear icons and keyboard shortcut or single-click switching.
- D2@1 (implements R2): Implement dedicated `LayerRow` component in `src/editor/layers-panel.tsx` rendering component icon (`IconSvg` with descriptor icon or Lucide icon), descriptive name (custom `el.name`, label snippet or descriptor label), and selection highlight.
  - _Trade-off_:
    - *Pro*: Unambiguous element identification across graphic cards, shapes, texts, and connectors.
    - *Con*: Text elements without custom name can have long text strings.
    - *Mitigation*: Auto-truncate display text gracefully with CSS ellipsis while keeping full name in tooltip.
- D3@1 (implements R3): Establish two-way selection sync: clicking a layer row selects the element via `setSelection([id])` (or multi-select with Shift/Ctrl), and canvas selection changes scroll the corresponding layer row into view with `scrollIntoView({ block: 'nearest' })`.
  - _Trade-off_:
    - *Pro*: Fluid navigation in scenes with dozens of overlapping elements.
    - *Con*: Rapid canvas multi-selection could cause unnecessary scroll jitter.
    - *Mitigation*: Only auto-scroll when a single element is active or when selection was initiated directly by user canvas click.
- D4@1 (implements R4): Add `hidden?: boolean` and `locked?: boolean` optional properties to `Element` in `src/model/model.ts` and `src/model/element-schema.ts`. Expose quick toggle icons (eye / eye-off, lock / unlock) on each layer row. In `src/engine/render.ts`, skip drawing elements where `el.hidden === true`. In `src/editor/stage.tsx`, ignore hit-testing and dragging for elements where `el.locked === true` or `el.hidden === true`.
  - _Trade-off_:
    - *Pro*: Direct control over scene clutter and accidental edits without destructive deletions.
    - *Con*: Exported renders could accidentally omit elements if hidden flag persists unexpectedly.
    - *Mitigation*: The hidden toggle is an intentional user action stored in JSON scene state; locked items remain visible in renders but unselectable on canvas.
- D5@1 (implements R5): Provide pure reordering functions `reorderElements(elements, fromIndex, toIndex)` and `moveElementLayer(elements, id, 'up' | 'down' | 'top' | 'bottom')` in `src/engine/layers.ts`. Wire layer row up/down buttons and drag-and-drop handles to invoke `applyScene` through the existing undo/redo history system.
  - _Trade-off_:
    - *Pro*: Fully testable pure functions adhering to SRP and DIP; seamless integration with Ctrl+Z undo/redo.
    - *Con*: Reordering array indices directly inverts visual display order because canvas renders index 0 at bottom and index N at top.
    - *Mitigation*: Display layers panel in reversed visual order (index N at top) while maintaining the underlying array rendering order.
- D6@1 (implements R6): For elements with `kind === "group"`, render collapsible sub-lists displaying `group.children` with recursive indentation, allowing inspection, selection, and visibility/lock toggling of grouped sub-elements.
  - _Trade-off_:
    - *Pro*: Full inspection of nested scene hierarchies and window mockup frames.
    - *Con*: Mutating nested children inside groups requires deep immutable updates.
    - *Mitigation*: Extract pure tree manipulation helpers in `src/engine/layers.ts` to immutably update nested group children.

## Deliverables

- `src/engine/layers.ts`: Pure functions for layer reordering (`reorderElements`, `moveElementLayer`), visibility/lock toggles (`toggleVisibility`, `toggleLock`), and hierarchical layer tree mapping.
- `src/engine/layers.test.ts`: Unit tests verifying pure layer reordering, boundary conditions, group nesting, and immutability.
- `src/model/model.ts` & `src/model/element-schema.ts`: Optional `hidden?: boolean` and `locked?: boolean` fields on Element schema.
- `src/engine/render.ts`: Skip rendering when `el.hidden === true`.
- `src/editor/stage.tsx`: Prevent canvas hit-test and dragging for locked or hidden elements.
- `src/editor/layers-panel.tsx`: The Layers panel UI component with layer rows, kind icons, name editing, lock/visibility toggles, up/down buttons, drag-and-drop, and nested group collapsible rows.
- `src/editor/app.tsx`: Left sidebar tab switch ("Biblioteca" vs "Capas") and wiring selection/scene updates.
- `src/styles.css`: Styles for layers panel, tree indentation, row states, and sidebar tabs.

## Sequencing

1. Pure domain functions and model schema (`src/engine/layers.ts`, `src/model/element-schema.ts`, `src/model/model.ts`).
2. Engine rendering & interaction checks (`src/engine/render.ts`, `src/editor/stage.tsx`).
3. Layers panel component and styles (`src/editor/layers-panel.tsx`, `src/styles.css`).
4. Editor integration in `src/editor/app.tsx` (sidebar tab switcher, two-way sync).
5. Comprehensive unit tests in `src/engine/layers.test.ts`.

## Open questions

_None._
