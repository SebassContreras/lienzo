# 002 — more-components — Requirements

## What's being built

More canvas components so posts like icon-card grids and annotated diagrams can be built:
ellipse, icon, image and groups.

## Who it serves

Creators building explainer posts.

## Requirements

- R1@1: An ellipse (circle when width equals height) has the same fill, border, glow, shadow, label and animation options as a rectangle, and lines can attach to it.
- R2@1: An icon element draws any lucide icon chosen by name from a searchable picker, with editable size, stroke width, color, optional rounded background tile (color or gradient), glow and the rectangle animations.
- R3@1: An image element shows a PNG, JPG, SVG or WebP file picked from disk, stored inside the project, with editable size (aspect ratio kept by default), corner radius, opacity, border, shadow and the rectangle animations.
- R4@1: Several elements can be selected (shift-click or drag a selection box), moved together, and grouped; a group moves, resizes, duplicates, deletes and animates as one and can be ungrouped; lines attached to elements inside a group keep following them.
- R5@1: A group can be saved as a single preset, so a composed card (tile, icon, title, subtitle) can be dropped again in one step.
- R6@1: The library gains built-in presets for the new components: icon card, icon tile, avatar circle, logo image placeholder.

## Out of scope

- 3D components, free drawing, rotation.

## Dependencies

001.

## Owner split

All tasks agent.
