# 009 — mcp-server — Requirements

## What's being built

An MCP server that exposes every tool of the service layer (007) to AI agents.

## Who it serves

Claude (or any MCP client) building posts for the maintainer.

## Requirements

- R1@1: `pnpm lienzo mcp` starts an MCP server over stdio exposing every registry tool with the same name, description and schema.
- R2@1: A tool error reaches the client as an MCP error result (`isError`) with the same message.
- R3@1: The README explains how to add the server to Claude Code (`claude mcp add lienzo -- pnpm lienzo mcp`).

## Dependencies

007, 008.

## Owner split

All tasks agent.
