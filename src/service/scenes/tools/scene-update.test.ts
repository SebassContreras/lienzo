import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../../../model/model.ts";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

const project = "tools";

let root: string;

let ctx: Ctx;

const call = (tool: string, input: Record<string, unknown>) =>
  registry.call(tool, input, ctx);

async function ok(tool: string, input: Record<string, unknown>) {
  const result = await call(tool, input);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value as Record<string, unknown>;
}

async function errorCode(tool: string, input: Record<string, unknown>) {
  const result = await call(tool, input);
  return result.ok ? undefined : result.error.code;
}

const saved = async (scene = "s") =>
  (await ok("scene_get", { project, scene })) as unknown as Scene;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-tools-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
  await ok("project_create", { project: project, name: "Tools" });
  await ok("scene_create", { project, scene: "s" });
});

describe("scene_update", () => {
  it("merges settings and keeps the elements", async () => {
    await ok("element_add", { project, scene: "s", kind: "rect" });

    await ok("scene_update", {
      project,
      scene: "s",
      patch: { duration: 6, width: 720 },
    });

    const scene = await saved();
    expect([scene.duration, scene.width, scene.elements.length]).toEqual([
      6, 720, 1,
    ]);
  });

  it("removes a symbol given as null", async () => {
    const symbol = { w: 10, h: 10, children: [] };
    await ok("scene_update", {
      project,
      scene: "s",
      patch: { symbols: { a: symbol, b: symbol } },
    });

    await ok("scene_update", {
      project,
      scene: "s",
      patch: { symbols: { a: null } },
    });

    expect(Object.keys((await saved()).symbols ?? {})).toEqual(["b"]);
  });

  it("refuses elements in the patch", async () => {
    const code = await errorCode("scene_update", {
      project,
      scene: "s",
      patch: { elements: [] },
    });

    expect(code).toBe("invalid_input");
  });

  it("refuses a patch that leaves the scene invalid", async () => {
    const code = await errorCode("scene_update", {
      project,
      scene: "s",
      patch: { fps: "fast" },
    });

    expect(code).toBeDefined();
  });
});
