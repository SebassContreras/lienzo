# 021 — smart-connectors — Requirements

## What's being built

Smart connecting lines that anchor magnetically to elements (cards, shapes, icons). When
connected elements are moved or resized, the connector automatically recalculates its start,
end, and trajectory (straight, orthogonal, or curved).

## Who it serves

Creators building architecture diagrams, flowcharts, data pipelines, and system wiring posts.

## Requirements

- R1@1: A line/connector can specify optional `sourceId` and `targetId` referencing existing element IDs in the scene, along with optional anchor points (top, bottom, left, right, center, or auto-nearest).
- R2@1: When elements bound to a connector move, resize, or rotate, the connector's endpoints update dynamically to attach to the boundary of the source and target elements.
- R3@1: Connectors support routing styles: direct/straight, orthogonal (stepped/elbow), and smooth curved (bezier).
- R4@1: If a referenced source or target element is deleted, the connector detaches cleanly, retaining its last calculated absolute coordinates without breaking the scene.
- R5@1: The canvas editor provides visual connection handles when dragging a line endpoint near another element's perimeter.
- R6@1: Connectors work seamlessly with existing stroke styles, arrows (start/end markers), dashes, animations, and traits.

## Dependencies

001, 012.

## Owner split

All tasks agent.
