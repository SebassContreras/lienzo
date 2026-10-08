# 015 — keyframes-timeline — Requirements

## What's being built

Keyframe animation of any property along a timeline, so elements move through the
space, enter or leave the scene, and change (e.g. color) at precise moments and stay changed.

## Who it serves

Creators explaining a process step by step (something moves, selects, changes state).

## Requirements

- R1@1: Any animatable property of any element (position, size, rotation, scale, opacity, colors, numbers) can have a track of keyframes (time, value, easing).
- R2@1: Values interpolate between keyframes (numbers linearly through the easing, colors in RGB) and hold before the first and after the last keyframe.
- R3@1: Elements can start or end outside the canvas, to enter or leave the scene.
- R4@1: A timeline panel under the canvas shows one track per animated property; keyframes are added at the playhead, dragged in time, deleted and given an easing; the playhead can be scrubbed.
- R5@1: Changing a property in the inspector while the playhead is on a keyframe edits that keyframe.
- R6@1: Keyframes coexist with preset animations: keyframes set the base value and the preset animation applies on top.
- R7@1: A built-in example scene shows an arrow moving over three squares, each turning blue when reached and staying blue.

## Dependencies

012, 013.

## Owner split

All tasks agent.
