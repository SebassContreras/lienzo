# 011 — compact-scenes — Requirements

## What's being built

A short JSON format for a whole post, generated from the component descriptors so it covers
every component, field, animation, keyframe track and 3D element. A tool expands it into a
normal scene, so the editor and the export do not change.

## Who it serves

The maintainer writing posts by hand, and Claude writing them through MCP.

## Requirements

- R1@1: A compact scene sets the size (a size preset name or `WxH`), duration, fps and background (a background preset name or partial values); anything left out takes the default.
- R2@1: A compact element starts from a preset or a kind and lists only the fields that differ, at any depth; groups and particle templates use the same compact form.
- R3@1: Placement shortcuts: `at` (anchor on the canvas with an optional offset) and `fit: canvas`.
- R4@1: Elements have readable ids; lines connect elements with `from` / `to`.
- R5@1: `anim` is a kind name or a partial object; `tracks` take a short keyframe form (`[time, value, easing?]`).
- R6@1: Tool `scene.build` expands a compact scene into a full scene, optionally saving it; an invalid compact scene is rejected naming the path in the compact input, and nothing is written.
- R7@1: The compact format's JSON Schema is generated from the descriptors, and the README shows a full example post.
- R8@1: A component or field added later is accepted by the compact format with no change to it.

## Out of scope

- Converting a full scene back into the compact form.

## Dependencies

012, 013, 014, 015, 016, 017, 018, 019, 007.

## Owner split

All tasks agent.
