# 021 — smart-connectors — Requirements

## What's being built

Smart connecting lines that anchor magnetically to elements (cards, shapes, icons). When
connected elements are moved or resized, the connector automatically recalculates its start,
end, and trajectory (straight, orthogonal, or curved).

## Who it serves

Creators building architecture diagrams, flowcharts, data pipelines, and system wiring posts.

## Requirements

- R1@2: A line end attached to an element (the existing `attach`) can name an anchor: top, bottom, left, right, center, or auto (nearest point of the outline, the default).
- R2@2: When an element a connector is attached to moves or resizes, the connector's ends follow its outline at their anchors. Rotation is out of scope until rotation is an element property (see the note from 015).
- R3@1: Connectors support routing styles: direct/straight, orthogonal (stepped/elbow), and smooth curved (bezier).
- R4@1: If a referenced source or target element is deleted, the connector detaches cleanly, retaining its last calculated absolute coordinates without breaking the scene.
- R5@1: The canvas editor provides visual connection handles when dragging a line endpoint near another element's perimeter.
- R6@1: Connectors work seamlessly with existing stroke styles, arrows (start/end markers), dashes, animations, and traits.

## Notes from 015

Rotation exists today only as the keyframe channel `@rotate` (015/D5): the stage's selection
box and hit test do not rotate with the element. If R2 needs rotation as a property, it becomes
a `rotate` field in the box group, `@rotate` tracks move onto it (see 015's `changes.md`), and
the selection box and hit test rotate with it.

## Context

Already built before this spec: attaching an end by dragging it onto an element (R5 in part),
ends on the outline (`attachedOutline`), and detaching on delete (R4).

## Dependencies

001, 012, 020.

## Owner split

All tasks agent.
