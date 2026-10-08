# 005 — particles — Requirements

## What's being built

A "Partículas" component: points that drift inside a box and join with lines when they
come close ("constellation" effect), with no background of its own, so it can sit over
the scene background or behind cards and be sized to cover the whole post or one area.

## Who it serves

Creators who want an animated, techy backdrop for explainer posts without leaving the
editor.

## Requirements

- R1@1: A particles element draws a set of points inside its box that move continuously, and joins every two points closer than a set distance with a line that fades as they move apart.
- R2@1: Point count, point size, point color, line color, line width, link distance, line opacity, speed, glow and a seed (which redistributes the points) are editable in the inspector.
- R3@1: The element has no background of its own: what is under it stays visible, and it stacks in the layer order like any other element.
- R4@1: The animation loops seamlessly and deterministically: the frame at t = 0 equals the frame at t = loop duration, and the same scene at the same t always draws the same pixels.
- R5@1: One action ("Ajustar al lienzo") makes the element cover the whole canvas.
- R6@1: The library has built-in particle presets (at least "Constelación", "Polvo flotante" and "Red densa") written as preset recipes (004).
- R7@1: With 300 points the editor preview keeps playing at the scene frame rate on the development machine; the inspector caps the count at 300.

## Out of scope

- Reacting to the mouse (exports are video).
- Particles as part of the scene background itself.
- Images or icons as particles (lifted later by spec 014, particle-template).

## Dependencies

001, 004 (presets are recipes), 006 (the "Fondo" control keeps the background reachable
when particles cover the whole canvas).

## Owner split

All tasks agent.
