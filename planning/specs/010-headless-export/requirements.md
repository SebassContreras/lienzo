# 010 — headless-export — Requirements

## What's being built

Export and preview as service tools, so the CLI and MCP can render scenes without the editor.

## Who it serves

Scripts exporting posts, and Claude checking what it built.

## Requirements

- R1@1: Tool `scene.export` writes a PNG (at a given t), GIF or MP4 of a scene and returns the file path; MP4 falls back to WebM, and says so, when H.264 is unavailable.
- R2@1: Tool `scene.preview` returns a PNG of the scene at t as image content, so an MCP client sees it.
- R3@1: The exported PNG equals the editor's PNG export of the same scene at the same t.

## Dependencies

007, 008, 009.

## Owner split

All tasks agent.
