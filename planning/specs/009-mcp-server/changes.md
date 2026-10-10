# 009 — mcp-server — Changes

## 2026-10-10 — stdout is the protocol
Why: with the stdio transport any stray write to stdout corrupts the MCP stream (MCP specification, stdio transport).
- MODIFIED D1@1 → D1@2
- Tasks: T001 (never started) re-pointed to D1@2 and A20@2
