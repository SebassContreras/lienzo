# 009 — mcp-server — Tasks

- [x] T001 [agent] [status:done] Generic MCP adapter registering every registry tool over stdio
      covers: D1@2, A20@2, A22@1
      changes: package.json (+1 -0), pnpm-lock.yaml (+648 -0), src/mcp/server.ts (+69 -0)
- [x] T002 [agent] [status:done] `mcp` command in the CLI that starts the server
      covers: D2@1
      changes: src/cli/help.ts (+1 -0), src/cli/main.ts (+6 -0)
- [x] T003 [agent] [status:done] README: add Lienzo to Claude Code
      covers: D3@1
      changes: README.md (+15 -0)
- [x] T004 [agent] [status:done] Test: an in-memory MCP client lists and calls every tool; CLI and MCP give the same result for the same input; errors are `isError`
      covers: R1@1, R2@1
      kind: test
      changes: AGENTS.md (+3 -1), src/mcp/server.test.ts (+102 -0)
