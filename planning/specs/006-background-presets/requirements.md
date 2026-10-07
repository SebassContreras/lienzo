# 006 — background-presets — Requirements

## What's being built

Background editing that is easy to find and works like the components: the background
can be picked from presets (built-in or saved by the user) that are recipes of traits,
then fine-tuned in the inspector.

## Who it serves

Creators who could not find where to change the background, and who want to reuse
backgrounds across posts.

## Requirements

- R1@1: A visible "Fondo" control in the editor opens the background settings at any time, even when an element covers the whole canvas; clicking an empty part of the canvas still does too, and the canvas hints at it.
- R2@1: The library has a "Fondos" section with a thumbnail per background preset; choosing one replaces the scene background, and the change can be undone.
- R3@1: A background preset is a recipe of traits (solid color, gradient, dots, spotlight, …) plus its own values, stored as JSON like element presets (004): built-in ones in `presets/built-in/`, user ones in `presets/`.
- R4@1: "Guardar fondo como preset" saves the current background as a user preset that contains only what differs from the default background, and applying it reproduces the background.
- R5@1: At least five built-in background presets exist, one of them reproducing today's default background exactly.
- R6@1: Applying a background preset copies its values: changing the preset later does not change scenes that already used it.

## Out of scope

- New kinds of background effect (grain, images, video); particles are a component (005).
- Rename, delete, import and export of presets (003 covers presets generally).

## Dependencies

004.

## Owner split

All tasks agent.
