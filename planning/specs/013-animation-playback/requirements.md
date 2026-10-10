# 013 — animation-playback — Requirements

## What's being built

Control over how each element's animation plays, following the timing model of CSS
Animations and the Web Animations API (delay, duration, iterations, direction, fill,
easing): an element can enter, loop and exit, each with its own timing and easing.

## Who it serves

Creators telling a story in a post (things appear, change and stay changed, then leave).

## Requirements

- R1@2: Each element has three animation slots, each optional and combinable: entry, loop and exit.
- R2@2: Each slot has a start (`delay`), a duration and an easing; easings are the CSS names (linear, ease-in, ease-out, ease-in-out), the Penner families (quad, cubic, back, bounce, elastic; in, out and in-out) and `cubic-bezier(x1, y1, x2, y2)`, which is accepted from JSON but not offered in the inspector.
- R3@2: Entry kinds (fade, pop, slide, draw) keep the element hidden until they start and hold its final state; exit kinds are the same kinds played in reverse, keep the element as it is until they start and keep it hidden after.
- R4@2: A loop plays forever or N times and then rests, in a direction (normal, reverse, alternate); its duration comes from its cycles per loop, so a loop that plays forever still closes exactly at the scene's end (A6).
- R5@1: Scenes saved before this change play exactly as before.
- R6@1: The inspector warns when an entry or exit ends after the scene does.

## Dependencies

012.

## Owner split

All tasks agent.
