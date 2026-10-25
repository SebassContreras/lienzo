# 065 — defaults-and-easing-notices — Requirements

User feedback showed friction in tool ergonomics and defaults: `scene_create` rejects partial backgrounds, new scenes ignore project palette background colors, `counter` defaults to an unrequested `+` suffix, and keyframes with easings at the end of a track silently have no effect.

## Requirements

- R1@1: `scene_create` accepts a partial background (a color string or an object with any subset of fields) and merges it onto the resolved base background instead of failing with missing required field errors.
- R2@1: A new scene inheriting project defaults (`scene_create` without a custom background and `openBlankScene` in the editor) uses the project palette's background color as a solid background (no unwanted gradient or dots) when `palette.background` is configured.
- R3@1: The `counter` component descriptor defaults to `suffix: ""` (clean number) instead of `"+"`.
- R4@1: An easing specified on the last keyframe of any element track emits an explanatory notice in `scene_validate`, `scene_build`, `keyframe_set` and inspector review explaining that easings in Lienzo apply to the segment leading to the next keyframe.
