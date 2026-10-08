# 017 — more-elements — Requirements

## What's being built

A wider library of components for explainer posts, each a descriptor (A23) so it is
editable, animatable, usable in presets, JSON and tools like every other element.

## Who it serves

Creators explaining processes, data and software visually.

## Requirements

- R1@1: Shapes: regular polygon (3–12 sides), star (points, inner radius) and block arrow (head size, shaft width, direction).
- R2@1: Badge: a pill with icon and text that sizes to its content.
- R3@1: Progress bar and progress ring with a value from 0 to 100 that can be animated, the ring showing the number in its centre.
- R4@1: Counter: a number that animates from a start value to an end value, with prefix, suffix, decimals and thousands separator.
- R5@1: Code block: code with syntax highlighting for common languages, a theme, line numbers and a typing reveal.
- R6@1: Chat bubble: author, avatar, text and side (left/right), with a typing indicator.
- R7@1: Window mockup: browser, terminal or phone frame with a title, holding child elements inside.
- R8@1: Table and bullet list: rows and columns or items, with header style, and a row-by-row reveal.
- R9@1: Steps / timeline: numbered steps along a line, where the active step can be animated to light up one after another.
- R10@1: Charts: bar, line, pie and donut from a list of values and labels, drawing themselves in.
- R11@1: Free path: an SVG path (imported or pasted) as a shape with fill and stroke, with draw-on and morph between two paths of the same element.
- R12@1: Effects on any element: blur, blend mode, and a mask that clips an element (or group) to another shape.
- R13@1: Every new component has at least one built-in preset in a fitting category.

## Out of scope

- Live data sources for charts (values are typed in the scene).
- Video as an element.

## Dependencies

012, 013, 015.

## Owner split

All tasks agent.
