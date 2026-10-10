# 019 — animation-presets — Requirements

## What's being built

Save a custom animation (preset animation settings plus keyframes) and reuse it on other
elements, posts and machines, like element presets.

## Who it serves

Creators with a house style of motion; Claude reusing named animations through JSON.

## Requirements

- R1@1: The animation of an element (its `anim` and keyframe tracks) can be saved as an animation preset with a name and a category.
- R2@2: An animation preset applies to any element; properties the element does not have, or whose value type differs (a color onto a number), are skipped and listed in a notice.
- R3@2: Applying replaces only what the preset animates — each `anim` slot (entry, loop, exit) it sets and each track path it has; the element's other slots and tracks stay.
- R4@2: Times are relative to the preset's start — keyframe times and the entry and exit delays — and the user picks where it starts on apply; movements of positional fields are relative to the element's position, and other values are absolute.
- R5@2: It applies to the whole selection at once, in selection order, with an optional stagger between elements; keyframes past the scene's duration are dropped and listed in the notice.
- R6@2: Applying always copies; the element remembers which preset it came from, as information only, so a later "re-sync" can be added without changing the format. Editing a preset does not change elements it was applied to.
- R7@2: Animation presets can be renamed, overwritten, deleted, exported and imported as JSON; every save and import is validated against the schema first, and an invalid one writes nothing.
- R8@2: A scene element can name an animation preset (`"animPreset": "mi-entrada"` or `{ "name", "start" }`) next to `anim`, never inside it; loading the scene expands it into copied `anim` and tracks, and an unknown name loads the scene anyway with a notice.

## Out of scope

- Linked presets that update live (dropped 2026-10-10; see `changes.md`).
- Animation presets in the service tools (007/R7) and the compact format (011/R9).

## Dependencies

013, 015, 018, 003.

## Owner split

All tasks agent.
