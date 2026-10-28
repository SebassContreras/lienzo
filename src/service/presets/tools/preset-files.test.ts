import { cp, mkdir, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
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

const RECIPE = { name: "Caja", kind: "rect", traits: [] };

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

describe("preset_save, preset_rename and preset_delete", () => {
  const projectPresets = () =>
    readdir(join(root, "projects", project, "presets"));

  it("saves a valid recipe into the project's presets", async () => {
    await ok("preset_save", { project, recipe: RECIPE });

    expect(await projectPresets()).toContain("caja.json");
  });

  it("refuses an invalid recipe", async () => {
    expect(
      await errorCode("preset_save", { project, recipe: { name: "x" } }),
    ).toBe("invalid_preset");
  });

  it("refuses to overwrite without overwrite", async () => {
    await ok("preset_save", { project, recipe: RECIPE });

    expect(await errorCode("preset_save", { project, recipe: RECIPE })).toBe(
      "exists",
    );
  });

  it("renames and then deletes a project preset", async () => {
    await ok("preset_save", { project, recipe: RECIPE });

    await ok("preset_rename", { project, from: "caja", to: "Caja 2" });
    await ok("preset_delete", { project, name: "caja-2" });

    expect(await projectPresets()).not.toContain("caja-2.json");
  });

  it("cannot delete a built-in preset", async () => {
    expect(
      await errorCode("preset_delete", { project, name: "01-tarjeta-neon" }),
    ).toBe("built_in");
  });
});
