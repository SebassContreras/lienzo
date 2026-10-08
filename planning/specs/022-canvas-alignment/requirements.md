# 022 — canvas-alignment — Requirements

## What's being built

Smart alignment guides (magnetic snapping to edges, centers, and equidistant spacing of sibling elements),
along with canvas multi-selection (marquee/rubberband selection box) to move, group, and align multiple
elements in bulk.

## Who it serves

Creators and designers composing balanced, tidy, professional technical diagrams quickly without
manually computing x/y pixel offsets.

## Requirements

- R1@1: Dragging an element on the canvas displays smart alignment guides (visual dashed lines) when its edges or center align with other elements or canvas center.
- R2@1: Snapping threshold allows elements to softly "snap" into alignment when dragged within a few pixels (e.g. 5px) of an edge/center match, with an option to disable via hotkey (e.g. holding `Alt` or `Shift`).
- R3@1: Equal distance indicators appear when placing an element between two others with matching gaps.
- R4@1: Dragging on empty canvas creates a marquee selection box that selects all intersecting or enclosed elements.
- R5@1: Multi-selection allows dragging all selected items together, maintaining their relative positions.
- R6@1: Alignment actions (align left, right, top, bottom, center horizontal, center vertical, distribute evenly) are available when multiple elements are selected.

## Dependencies

001, 012.

## Owner split

All tasks agent.
