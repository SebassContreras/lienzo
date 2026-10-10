# 014 — particle-template — Requirements

## What's being built

Particles that can be any element: design an element or a group, and the particles
element draws it at every point, with variation. Lifts 005's "images or icons as particles"
out-of-scope line.

## Who it serves

Creators who want sparks, floating icons, cards or logos as an animated backdrop.

## Requirements

- R1@2: A particle can be any element (or group) except a particles element; the particles element draws it, still and centred, at each point.
- R2@2: Per-particle variation, for the template and for the default dot alike: size range, rotation, spin, opacity range and a hue shift picked from a fixed set of variants.
- R3@2: Any element on the canvas can be made the particle of a particles element ("Usar como partícula"), and the current particle can be taken back onto the canvas to be edited and applied again.
- R4@1: Links between points stay optional; existing particle scenes look the same.
- R5@1: With 300 particles of a simple template the preview keeps playing at the scene fps.
- R6@1: Built-in presets show the idea: sparks and floating icons.

## Out of scope

- The template's own animation (it is drawn still).
- An isolated editor mode for the template.

## Dependencies

012, 013.

## Owner split

All tasks agent.
