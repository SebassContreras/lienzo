# 001 — editor-base — Requirements

## What's being built

The canvas editor validated as a prototype on 2026-10-07: a free canvas, a library of
draggable components (rectangle, text, line and pre-made variants), a live inspector,
looping animations, PNG/GIF/MP4 export, and presets and scenes stored as JSON.

## Who it serves

Creators building animated explainer posts.

## Requirements

- R1@1: The canvas has a size (presets 1080×1080, 1080×1350, 1080×1920, 1920×1080, 1200×627, or custom), a loop duration, an fps and a background (solid or gradient color, optional center light, optional dot grid), all editable when nothing is selected.
- R2@1: A library lists the basic components (rectangle, text, line) and pre-made presets with a live thumbnail; each one can be dragged onto the canvas, landing where it is dropped, or clicked to add it at the center.
- R3@1: Elements can be selected by clicking, moved by dragging, resized from corner handles (a text resize scales its font size), deleted, duplicated, nudged with the arrow keys and moved up or down in the layer order; every change can be undone and redone.
- R4@1: A rectangle has editable size, corner radius, fill (color or two-color gradient with angle, opacity), background glow, border (width, color, opacity, solid/dashed/dotted, optionally moving), border glow, drop shadow and an inner text label (text, font, size, weight, color, alignment).
- R5@1: A text element has editable content (multi-line), font, size, weight, italic, alignment, line height, letter spacing, color or gradient, opacity and glow.
- R6@1: A line connects two points; dragging an end onto a rectangle or text attaches it so the line follows that element when it moves. A line has editable curve, arrowheads at either end, width, color, opacity, stroke style, glow and an animated flow: light pulses, marching ants or a comet, with color, speed, count, size and direction.
- R7@1: Rectangles and text can animate with float, pulse, breathing glow, fade-in, pop-in or slide-up; lines with fade-in or draw-on. Looping animations run a whole number of cycles per loop and take a delay. The canvas plays, pauses and can be scrubbed.
- R8@1: The scene exports to PNG (the current frame), GIF (one full loop) and MP4 (one full loop, WebM when the browser cannot encode H.264), at 100, 75, 50 or 25 % size, with progress shown while exporting.
- R9@1: A selected element can be saved under a name as a preset JSON file in `presets/`; saved presets appear in the library. Scenes can be saved to and opened from JSON files in `scenes/`; the current scene is restored after a reload.
- R10@1: The editor opens with a demo post explaining how an agent reaches tools through MCP, built only from library components.
- R11@1: `pnpm lint`, `pnpm typecheck` and `pnpm test` pass locally and in CI.

## Out of scope

- Components other than rectangle, text and line (002).
- Managing presets beyond saving and listing them (003).

## Dependencies

None.

## Owner split

All tasks agent.
