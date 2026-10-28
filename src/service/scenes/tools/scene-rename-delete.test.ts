import { cp, mkdir, mkdtemp } from "node:fs/promises";
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

describe("scene_rename and scene_delete", () => {
  it("renames a scene to a new name", async () => {
    await ok("scene_rename", { project, from: "s", to: "Otra" });

    const list = (await call("scene_list", { project })) as {
      value: { name: string }[];
    };
    expect(list.value.map((s) => s.name)).toEqual(["otra"]);
  });

  it("refuses a rename onto a taken name", async () => {
    await ok("scene_create", { project, scene: "t" });

    expect(
      await errorCode("scene_rename", { project, from: "s", to: "t" }),
    ).toBe("exists");
  });

  it("deletes a scene", async () => {
    await ok("scene_delete", { project, scene: "s" });

    expect(await errorCode("scene_get", { project, scene: "s" })).toBeDefined();
  });

  it("fails to delete a missing scene", async () => {
    expect(await errorCode("scene_delete", { project, scene: "nope" })).toBe(
      "not_found",
    );
  });
});
