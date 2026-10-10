# 015 — keyframes-timeline — Requirements

## What's being built

Keyframe animation of any property along a timeline, so elements move through the
space, enter or leave the scene, and change (e.g. color) at precise moments and stay changed.

## Who it serves

Creators explaining a process step by step (something moves, selects, changes state).

## Requirements

- R1@2: Any animatable field of any element (position, size, opacity, colors, numbers, whole numbers included) and the element's rotation and scale can have a track of keyframes (time, value, easing).
- R2@2: Values interpolate between keyframes (numbers through the easing of the keyframe a segment starts at, colors in RGB, whole numbers step at the next keyframe) and hold before the first and after the last keyframe; a track does not close the scene's loop by itself.
- R3@1: Elements can start or end outside the canvas, to enter or leave the scene.
- R4@2: A timeline panel under the canvas shows the selected element's tracks on the existing playhead; a keyframe can be selected (moving the playhead to it), dragged in time, deleted and given an easing.
- R5@2: The inspector shows each field's value at the playhead; changing a field that has a track sets its keyframe at the playhead (adding one if none is there); changing one without a track changes its value.
- R6@1: Keyframes coexist with preset animations: keyframes set the base value and the preset animation applies on top.
- R7@1: A built-in example scene shows an arrow moving over three squares, each turning blue when reached and staying blue.
- R8@1: Each animatable field in the inspector has a keyframe button that starts a track with a keyframe at the playhead, or removes the track.
- R9@1: Keyframe edits are undoable with the editor's existing undo.

## Dependencies

012, 013.

## Owner split

All tasks agent.
