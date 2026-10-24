# 052 — track-loops-and-step — Requirements

Keyframe tracks currently freeze after their last keyframe, forcing cyclic motions (roads, clouds, wheels) to be repeated manually up to the end of the scene, and instant value changes (lights turning on, cuts) require two keyframes placed one frame apart.

- R1@1: Each keyframe track supports an optional `repeat: "none" | "loop" | "pingpong"` (default `"none"`) and an optional `until` time in seconds.
- R2@1: For a track with at least two keyframes and `t` past the last keyframe (and before `until`, when set), `repeat: "loop"` wraps elapsed time from the first keyframe's time modulo the track span (`last.t - first.t`), and `repeat: "pingpong"` alternates forward and backward cycles across that span; at or after `until`, the track holds the value at `until`.
- R3@1: Compact scenes accept both the array shorthand for keyframes and an object form `{"keys": [...], "repeat": "loop" | "pingpong", "until": <seconds>}` on any track, and `keyframe_set` / track tools can set or clear `repeat` and `until`.
- R4@1: The easing registry includes a `"step"` (alias `"hold"`) easing that holds the segment's starting keyframe value until the next keyframe's exact timestamp (`p < 1 ? 0 : 1`), available in both full and compact track definitions and in the editor's keyframe easing selector.
- R5@1: Scenes without `repeat`, `until` or `"step"` easing evaluate identically to before 052.
