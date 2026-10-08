# 014 — particle-template — Requirements

## What's being built

Particles that can be any element: design an element or a group, and the particles
element draws it at every point, with variation. Lifts 005's "images or icons as particles"
out-of-scope line.

## Who it serves

Creators who want sparks, floating icons, cards or logos as an animated backdrop.

## Requirements

- R1@1: A particle can be any element (or group); the particles element draws it at each point.
- R2@1: Per-particle variation: size range, rotation and spin, opacity range and color shift.
- R3@1: The template is edited from the particles inspector ("Editar partícula") as a normal element on its own canvas, then applied back to the field.
- R4@1: Links between points stay optional; existing particle scenes look the same.
- R5@1: With 300 particles of a simple template the preview keeps playing at the scene fps.
- R6@1: Built-in presets show the idea: sparks and floating icons.

## Dependencies

012, 013.

## Owner split

All tasks agent.
