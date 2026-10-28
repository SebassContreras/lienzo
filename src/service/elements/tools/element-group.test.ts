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

describe("element_group and element_ungroup", () => {
  it("groups two elements and ungroups them back", async () => {
    const a = await ok("element_add", { project, scene: "s", kind: "rect" });
    const b = await ok("element_add", { project, scene: "s", kind: "rect" });

    const { id } = await ok("element_group", {
      project,
      scene: "s",
      ids: [a.id, b.id],
    });
    const grouped = (await saved()).elements.map((el) => el.kind);
    const { ids } = await ok("element_ungroup", { project, scene: "s", id });

    expect([grouped, ids]).toEqual([["group"], [a.id, b.id]]);
  });

  it("fails to group an id that is not at the top level", async () => {
    const a = await ok("element_add", { project, scene: "s", kind: "rect" });

    expect(
      await errorCode("element_group", {
        project,
        scene: "s",
        ids: [a.id, "ghost"],
      }),
    ).toBe("not_found");
  });

  it("fails to ungroup something that is not a group", async () => {
    const a = await ok("element_add", { project, scene: "s", kind: "rect" });

    expect(
      await errorCode("element_ungroup", { project, scene: "s", id: a.id }),
    ).toBe("not_a_group");
  });
});
