# 013 — animation-playback — Requirements

## What's being built

Control over how each animation plays: in a loop, once and hold its final state, or a
number of times; with its own start, duration and easing, and exit animations.

## Who it serves

Creators telling a story in a post (things appear, change and stay changed).

## Requirements

- R1@1: Each animation has a mode: loop (as today), once (runs for its duration, then holds its final state) or repeat N times and hold.
- R2@1: Each animation has a start (`delay`), a duration and an easing (linear, ease-in, ease-out, ease-in-out, back, bounce).
- R3@1: Entry animations (fade, pop, slide) and new exit animations (fade-out, pop-out, slide-out) follow the mode and hold.
- R4@1: Loop-mode animations still close exactly at the loop's end (A6).
- R5@1: Scenes saved before this change play exactly as before.

## Dependencies

012.

## Owner split

All tasks agent.
