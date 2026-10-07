# 004 — preset-traits — Requirements

## What's being built

A layer of reusable style pieces ("traits": float, pulse, neon glow, glass fill, shadow,
animated border, gradient text, …) written once in code, and presets that only say how
to combine them. Today every built-in preset in the hand-written presets module rebuilds a whole
element by hand and repeats the same glow, fill and animation values; after this spec a
preset is a short JSON recipe in `presets/` and adding one needs no code.

## Who it serves

Creators (and agents) adding presets: they compose existing pieces instead of copying
property blocks, and a new piece becomes available to every preset at once.

## Requirements

- R1@1: Each reusable style piece (a trait) is defined once in code and declares which element kinds (rect, text, line) it applies to; every property block reused by more than one built-in preset (glow, fill, border, shadow, animation, line flow) is expressed as a trait.
- R2@1: A trait can take parameters with defaults (for example color or amount), so one trait covers its variants instead of one trait per color.
- R3@1: A preset is a JSON recipe: its name, the element kind, an ordered list of traits with optional parameters, and the few values that are its own (text, size, …); it never stores a full element.
- R4@1: The 13 current built-in presets exist as JSON recipes in `presets/` and produce exactly the same element they produce today (every property equal except the id).
- R5@1: Dropping a preset on the canvas adds an independent element; changing a trait or a recipe later does not change elements already in a scene.
- R6@1: "Guardar como preset" on a selected element writes a recipe that contains only the values that differ from that kind's defaults, and dropping that preset reproduces the element.
- R7@1: A recipe that names an unknown trait, or a trait that does not apply to its kind, appears in the library as broken with a message naming the trait; the rest of the library and the editor keep working.
- R8@1: A new preset that only combines existing traits is added by dropping a JSON file in `presets/`, with no code change.

## Out of scope

- Live links: elements that keep following their traits after being dropped.
- Creating or editing traits from the UI.
- Recipes for groups (002/R5@1 keeps saving groups as presets its own way).
- Categories, rename, delete, import and export of presets (spec 003).

## Dependencies

001.

## Owner split

All tasks agent.
