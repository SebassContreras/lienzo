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
import { ImageResult } from "../service/image.ts";
import type { Registry, Tool } from "../service/registry.ts";
import { gitCommit } from "./build-id.ts";

const VERSION = "0.1.0";

/** How every tool answers, told once to the client instead of in each description (079). */
const RULES =
  "Every tool: object and array arguments are JSON values (a JSON string holding one is read " +
  "too); scene, asset and export tools need `project` (project_list); a failure is " +
  "`{ code, message, path }`, and a scene or recipe check adds `errors`, one per problem at its " +
  "path, an element named by the id you gave or else by its index; messages are Spanish; `notices` name what was " +
  "ignored or may surprise, never a failure. Coordinates: `x, y` is an element's top-left " +
  "corner; use `at` to place by anchor. Workflow: .agents/skills/lienzo-usage/SKILL.md.";

/** A registry tool as MCP lists it: same name and description, its input as JSON Schema. */
function mcpToolOf(tool: Tool): McpTool {
  const { $schema: _, ...schema } = z.toJSONSchema(tool.input, { io: "input" });
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: schema as McpTool["inputSchema"],
  };
}

/**
 * A tool's value as MCP content: an `ImageResult` is an image (010/D3), followed by its
 * saved `file` as JSON text when it has one (058/D7); anything else is JSON text.
 */
function contentOf(value: unknown): CallToolResult["content"] {
  const image = ImageResult.safeParse(value);
  if (!image.success) return [{ type: "text", text: JSON.stringify(value) }];
  const { image: picture, file } = image.data;
  return file === undefined
    ? [{ type: "image", ...picture }]
    : [
        { type: "image", ...picture },
        { type: "text", text: JSON.stringify({ file }) },
      ];
}

/** An MCP server over `registry`; connect it to any transport. */
export function createMcpServer(registry: Registry, ctx: Ctx): Server {
  const server = new Server(
    { name: "lienzo", version: VERSION },
    {
      capabilities: { tools: {} },
      instructions: `lienzo ${VERSION}, commit ${gitCommit(ctx.root) ?? "desconocido"}. If it differs from \`git rev-parse --short HEAD\`, restart this server: it runs the code it started with. ${RULES}`,
    },
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
        ? { content: contentOf(result.value) }
        : {
            isError: true,
            content: [{ type: "text", text: JSON.stringify(result.error) }],
          };
    },
  );
  return server;
}

/**
 * Serves `registry` over stdio and resolves once the client is gone: stdin ends (how MCP
 * clients shut a stdio server down) or SIGINT/SIGTERM arrives. The caller then disposes the
 * ctx (010/D4); the SDK's transport does not watch stdin's end itself. stdout carries only
 * the protocol, so console output is sent to stderr before the transport starts.
 */
export async function serveStdio(registry: Registry, ctx: Ctx): Promise<void> {
  console.log = console.info = console.debug = console.error;
  const server = createMcpServer(registry, ctx);
  const gone = new Promise<void>((resolve) => {
    process.stdin.once("end", resolve);
    process.stdin.once("close", resolve);
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  await server.connect(new StdioServerTransport());
  await gone;
  await server.close();
}
