# 003 — presets-scenes — Requirements

## What's being built

Managing the JSON library: presets and scenes can be organised, renamed, deleted,
imported and exported.

## Who it serves

Creators who build up their own component library over time.

## Requirements

- R1@1: A user preset can be renamed, overwritten with the selected element, or deleted from the library.
- R2@1: Presets can be given a category; the library groups presets by category and can be filtered by name.
- R3@1: Saved scenes are listed with a thumbnail; a scene can be opened, renamed, duplicated or deleted.
- R4@1: A preset or scene can be exported as a `.json` file and imported from one, so it can be shared between machines.
- R5@1: A file that is not a valid preset or scene is rejected with a message saying what is wrong, and nothing is written.

## Out of scope

- Syncing or sharing online.

## Dependencies

001.

## Owner split

All tasks agent.
