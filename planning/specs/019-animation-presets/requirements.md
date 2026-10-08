# 019 — animation-presets — Requirements

## What's being built

Save a custom animation (preset animation settings plus keyframes) and reuse it on other
elements, posts and machines, like element presets.

## Who it serves

Creators with a house style of motion; Claude reusing named animations through JSON.

## Requirements

- R1@1: The animation of an element (its `anim` and keyframe tracks) can be saved as an animation preset with a name and a category.
- R2@1: An animation preset applies to any element; properties the element does not have are skipped and listed in a notice.
- R3@1: Applying replaces only the properties the preset animates; the element's other animations stay.
- R4@1: Times are relative to the preset's start and the user picks where it starts on apply; movements are relative to the element's position.
- R5@1: It applies to the whole selection at once, with an optional stagger between elements.
- R6@1: Applying copies by default; "linked" keeps a reference so editing the preset updates every linked element, and a linked element can be unlinked.
- R7@1: Animation presets can be renamed, overwritten, deleted, exported and imported as JSON, with the same validation rules as other presets.
- R8@1: Animation presets are usable by name in JSON (`"anim": "mi-entrada"`) and therefore by the compact format and the tools.

## Dependencies

013, 015, 018, 003.

## Owner split

All tasks agent.
