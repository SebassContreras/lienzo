# 024 — free-path — Requirements

## What's being built

A free path element: any SVG path, imported or pasted, drawn as a shape with fill and
stroke, that can draw itself on and morph smoothly through a sequence of shapes.

## Who it serves

Creators who need a shape the built-in components don't have (a logo outline, a custom arrow).

## Requirements

- R1@1: A free path element shows an SVG path (pasted `d` string or imported `.svg` file) with fill and stroke, scaled to its box.
- R2@1: The path can draw itself on (stroke reveal from 0 to 100 %), driven by preset animations (013) and keyframes (015).
- R3@1: The component has at least one built-in preset in a fitting category.
- R4@1: A free path holds an ordered list of shapes (two or more `d` strings); an animatable `morph` value moves through them (0 = first shape, 1 = second, 2 = third…), driven by preset animations (013) and keyframes (015).
- R5@1: Morph works between any two valid paths: different command types (lines, curves, arcs, relative or absolute), different point counts, and different numbers of subpaths (holes, separate pieces); a subpath with no partner grows from or shrinks to a point.
- R6@1: The morph does not twist or flip: matching subpaths keep the same winding direction and start at the points that minimise travel.
- R7@1: Fill, stroke, colours and opacity of the in-between frames interpolate with the same easing as the shape.
- R8@1: Morph is deterministic and loop-safe: the same `morph` value gives the same pixels, and a sequence ending on its first shape closes the loop seamlessly (A6).
- R9@1: Morph stays fast enough for live preview: each pair of shapes is prepared once and cached, and a frame only interpolates prepared points.
- R10@1: An invalid or empty `d` string is rejected with an error naming the shape, and the element keeps its last valid shapes.

## Out of scope

- Morphing between two different elements (morph is within one element's shape list).
- Boolean path operations (union, subtract).

## Dependencies

012, 013, 015.

## Owner split

All tasks agent.
