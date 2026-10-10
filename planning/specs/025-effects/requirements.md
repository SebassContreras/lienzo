# 025 — effects — Requirements

## What's being built

Effects that work on any element: blur, blend mode and a mask that clips an element (or
group) to another shape.

## Who it serves

Creators who want depth and focus (blurred backgrounds, spotlights, reveals through a shape).

## Requirements

- R1@1: Any element can have a blur (radius, animatable) and a blend mode (the Canvas 2D composite modes).
- R2@1: Any element or group can be masked by another element of the scene, which then clips it instead of being drawn.
- R3@1: Effects work on every component kind, including ones added later, with no change to the component.

## Dependencies

012, 013, 015, 017.

## Owner split

All tasks agent.
