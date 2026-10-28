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

const _saved = async (scene = "s") =>
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

describe("animation_save and animation_list", () => {
  it("lists an animation once saved", async () => {
    await ok("animation_save", {
      recipe: { name: "Salto", category: "Mías", anim: {} },
    });

    const { animations } = await ok("animation_list", {});
    expect(animations).toEqual([
      { file: "salto", name: "Salto", category: "Mías", source: "global" },
    ]);
  });

  it("refuses an animation without a name", async () => {
    expect(await errorCode("animation_save", { recipe: {} })).toBe(
      "invalid_animation",
    );
  });
});
