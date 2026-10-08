# 023 — mcp-visual-feedback — Requirements

## What's being built

A visual feedback and spatial analysis tool in the service layer, exposed through MCP and CLI,
allowing automated AI agents to inspect scene renderings (as base64/data-URL PNG snapshots)
and receive layout diagnostics (bounding box overlaps, elements exceeding canvas bounds, low-contrast text).

## Who it serves

AI agents and automated scripts crafting scenes via MCP that need to "see" and verify layout
correctness before finalizing a post.

## Requirements

- R1@1: A `scene_preview` tool in `src/service/tools/` renders a given scene JSON into a lightweight PNG snapshot (data URL / base64 or temporary asset path) without requiring a full export workflow.
- R2@1: A `scene_inspect_layout` tool analyzes element bounding boxes and returns diagnostic warnings (e.g. overlapping text, elements outside canvas boundary, unanchored connectors).
- R3@1: Both tools are registered in the service layer tool registry (A20) and automatically available to the MCP server (009) and CLI (008).
- R4@1: Execution utilizes the headless renderer (010) or fast offscreen canvas fallback to guarantee parity with the editor preview (A3).

## Dependencies

007, 008, 009, 010.

## Owner split

All tasks agent.
