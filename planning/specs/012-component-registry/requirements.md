# 012 — component-registry — Requirements

## What's being built

Every component is declared once — its fields, defaults, drawing and what can be animated —
and everything else (schema, inspector, animation, JSON formats, tools) is derived from that
declaration, so new components and features are inherited instead of rebuilt.

## Who it serves

The maintainer adding components, and every later spec (013–016, 011, 007).

## Requirements

- R1@1: Every component kind (rect, ellipse, icon, image, text, line, group, particles) is described by one descriptor: fields with type, range, default, label and inspector section; draw function; animatable properties.
- R2@1: The scene schema is generated from the descriptors; scenes and presets saved before this change open unchanged.
- R3@1: The inspector is generated from the descriptors: every field of every component is editable, with custom widgets where a field declares one (icon picker, image upload, line connection).
- R4@1: Shared field groups (box, fill, stroke/border, glow, shadow, label text, anim) are defined once and composed by descriptors.
- R5@1: Adding a component means adding its descriptor folder and registering it, nothing else.
- R6@1: Every scene draws exactly as before the change.

## Out of scope

- New fields or behaviours (they come in 013–016).

## Dependencies

001, 002, 005.

## Owner split

All tasks agent.
