/**
 * The MCP server (009/D1): a generic adapter that exposes every registry tool (A20) over
 * stdio with `@modelcontextprotocol/sdk` (A22). It holds no per-tool code: names,
 * descriptions and input schemas come from the registry, and calls go through
 * `registry.call`, so the CLI and MCP give the same result for the same input.
 *
 * It uses the SDK's low-level `Server` rather than `McpServer.registerTool`: the registry
 * already validates input (`callTool`), so the adapter only needs to publish JSON Schema and
 * forward calls, without a second Zod parse or a per-tool registration.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type Tool as McpTool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { Ctx } from "../service/ctx.ts";
import type { Registry, Tool } from "../service/registry.ts";

const VERSION = "0.1.0";

/** A registry tool as MCP lists it: same name and description, its input as JSON Schema. */
export function mcpToolOf(tool: Tool): McpTool {
  const { $schema: _, ...schema } = z.toJSONSchema(tool.input, { io: "input" });
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: schema as McpTool["inputSchema"],
  };
}

/** An MCP server over `registry`; connect it to any transport. */
export function createMcpServer(registry: Registry, ctx: Ctx): Server {
  const server = new Server(
    { name: "lienzo", version: VERSION },
    { capabilities: { tools: {} } },
  );
  const listed = registry.tools.map(mcpToolOf);
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: listed }));
  server.setRequestHandler(
    CallToolRequestSchema,
    async ({ params }): Promise<CallToolResult> => {
      const result = await registry.call(
        params.name,
        params.arguments ?? {},
        ctx,
      );
      return result.ok
        ? { content: [{ type: "text", text: JSON.stringify(result.value) }] }
        : {
            isError: true,
            content: [{ type: "text", text: JSON.stringify(result.error) }],
          };
    },
  );
  return server;
}

/**
 * Serves `registry` over stdio until the client closes. stdout carries only the protocol,
 * so console output is sent to stderr before the transport starts.
 */
export async function serveStdio(registry: Registry, ctx: Ctx): Promise<void> {
  console.log = console.info = console.debug = console.error;
  await createMcpServer(registry, ctx).connect(new StdioServerTransport());
}
