import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../cli/main.ts";
import { type Ctx, createCtx } from "../service/ctx.ts";
import { fakeRenderer } from "../service/render/fake-renderer.ts";
import { registry } from "../service/tools/index.ts";
import { createMcpServer } from "./server.ts";

let ctx: Ctx;
let client: Client;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-mcp-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { project: "p", name: "P" }, ctx);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createMcpServer(registry, ctx).connect(serverSide);
  client = new Client({ name: "test", version: "0" });
  await client.connect(clientSide);
});

afterEach(() => client.close());

type Text = { type: "text"; text: string };

async function mcp(name: string, args: Record<string, unknown>) {
  const r = await client.callTool({ name, arguments: args });
  return {
    isError: r.isError === true,
    json: JSON.parse((r.content as Text[])[0]?.text ?? "null") as unknown,
  };
}

async function cli(argv: string[]) {
  let stdout = "";
  let stderr = "";
  const code = await run(
    argv,
    {
      stdout: (t) => {
        stdout += t;
      },
      stderr: (t) => {
        stderr += t;
      },
      read: async () => "",
    },
    ctx,
  );
  return { code, json: JSON.parse(code === 0 ? stdout : stderr) as unknown };
}

describe("lienzo MCP server", () => {
  it("lists every registry tool with the same name, description and object schema (R1)", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(registry.tools.map((t) => t.name));
    for (const [i, t] of tools.entries()) {
      expect(t.description).toBe(registry.tools[i]?.description);
      expect(t.inputSchema.type).toBe("object");
    }
  });

  it("calls every tool and answers with a JSON text result (R1)", async () => {
    for (const tool of registry.tools) {
      const r = await mcp(tool.name, {});
      expect(r.json).not.toBeNull();
    }
  });

  it("gives the same result as the CLI for the same input (R1)", async () => {
    await mcp("scene_create", { scene: "demo", project: "p" });
    const viaMcp = await mcp("scene_get", { scene: "demo", project: "p" });
    const viaCli = await cli([
      "scene_get",
      "--scene",
      "demo",
      "--project",
      "p",
    ]);
    expect(viaMcp.isError).toBe(false);
    expect(viaCli.code).toBe(0);
    expect(viaMcp.json).toEqual(viaCli.json);
  });

  it("reports a tool error as isError with the CLI's message (R2)", async () => {
    for (const [name, args, argv] of [
      [
        "scene_get",
        { scene: "missing", project: "p" },
        ["scene_get", "--scene", "missing", "--project", "p"],
      ],
      ["scene_get", {}, ["scene_get"]],
      ["nope_tool", {}, ["nope_tool"]],
    ] as const) {
      const r = await mcp(name, args);
      expect(r.isError).toBe(true);
      const c = await cli([...argv]);
      expect(c.code).toBe(1);
      expect((r.json as { message: string }).message).toBe(
        name === "nope_tool"
          ? "No existe la herramienta «nope_tool»"
          : (c.json as { message: string }).message,
      );
    }
  });

  it("returns scene_preview as image content (010/R2)", async () => {
    await mcp("scene_create", { scene: "demo", project: "p" });
    const r = await client.callTool({
      name: "scene_preview",
      arguments: { scene: "demo", project: "p" },
    });
    expect(r.isError).toBeFalsy();
    expect(r.content).toEqual([
      { type: "image", mimeType: "image/png", data: expect.any(String) },
    ]);
  });

  it("returns scene_preview with `out` as image then its file (058/R3)", async () => {
    await mcp("scene_create", { scene: "demo", project: "p" });
    const r = await client.callTool({
      name: "scene_preview",
      arguments: { scene: "demo", project: "p", out: "look.png" },
    });
    expect(r.content).toEqual([
      { type: "image", mimeType: "image/png", data: expect.any(String) },
      { type: "text", text: expect.stringMatching(/look\.png"\}$/) },
    ]);
  });
});

describe("build id (072/D1)", () => {
  it("names the commit the server started from in its instructions", async () => {
    const root = await mkdtemp(join(tmpdir(), "lienzo-git-"));
    await mkdir(join(root, ".git", "refs", "heads"), { recursive: true });
    await writeFile(join(root, ".git", "HEAD"), "ref: refs/heads/main\n");
    await writeFile(
      join(root, ".git", "refs", "heads", "main"),
      "90aee3237aa28af38080c40246338626a6cff1dd\n",
    );
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await createMcpServer(registry, createCtx(root, fakeRenderer())).connect(
      serverSide,
    );
    const other = new Client({ name: "test", version: "0" });
    await other.connect(clientSide);

    const instructions = other.getInstructions();

    expect(instructions).toContain("commit 90aee32");
    await other.close();
  });

  it("tells the client how every tool takes arguments and answers failures (079/R2)", async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await createMcpServer(
      registry,
      createCtx(await mkdtemp(join(tmpdir(), "lienzo-rules-")), fakeRenderer()),
    ).connect(serverSide);
    const other = new Client({ name: "test", version: "0" });
    await other.connect(clientSide);

    const instructions = other.getInstructions();

    expect(instructions).toContain("a JSON string holding one is read");
    expect(instructions).toContain("`errors`, one per problem");
    await other.close();
  });
});
