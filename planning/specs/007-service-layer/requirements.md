# 007 — service-layer — Requirements

## What's being built

One layer of tools that does everything outside the editor: list, read, create, validate
and edit scenes and presets. The CLI (008) and the MCP server (009) only expose it.

## Who it serves

Scripts and AI agents (Claude) that build posts, and the maintainer from the terminal.

## Requirements

- R1@1: A tool registry lists every tool with its name, description, and input and output schemas.
- R2@1: Tools list, get and validate presets (built-in and user) and list, get, create and validate scenes.
- R3@1: Tools add an element to a scene (from a preset or a kind, optionally at a position), update an element with a partial patch, remove it, move it in the layer order, and set the scene background (from a background preset or values).
- R4@1: Every tool that writes validates the result first; an invalid input or result returns an error naming the failing path, and nothing is written.
- R5@1: Scenes written by the tools open in the editor's «Escenas guardadas» without conversion.
- R6@1: Element tools accept every component kind and field of the descriptor registry, keyframe tracks included, so a component added later is usable from the tools with no tool change.

## Out of scope

- Rendering and export (010).
- Live sync with an open editor (phase 2).

## Dependencies

003, 004, 005, 012, 015.

## Owner split

All tasks agent.
