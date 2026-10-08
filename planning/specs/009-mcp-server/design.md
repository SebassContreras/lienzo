# 009 — mcp-server — Design

## Approach

- D1@1 (implements R1, R2): `src/mcp/server.ts` is a generic adapter that registers every registry tool with `@modelcontextprotocol/sdk` over stdio (A22); results are JSON text content, errors `isError`; no per-tool code.
- D2@1 (implements R1): The CLI gains an `mcp` command that starts the server.
- D3@1 (implements R3): A README section documents setup in Claude Code.

## Deliverables

`src/mcp/server.ts`, `mcp` CLI command, README section.
