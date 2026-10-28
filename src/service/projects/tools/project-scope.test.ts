import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../../../model/model.ts";
import { parseScene } from "../../../model/schema.ts";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";
import { registry } from "../../tools/index.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const call = (name: string, input: unknown) => h.call(name, input);

const ok = (name: string, input: unknown) => h.ok(name, input);

async function onDisk(name: string): Promise<Scene> {
  const raw = await readFile(
    join(h.ctx.root, "projects", "mi-proyecto", "scenes", `${name}.json`),
    "utf8",
  );
  const parsed = parseScene(JSON.parse(raw));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe("project scope", () => {
  const SCENE_TOOLS = [
    "scene_list",
    "scene_get",
    "scene_create",
    "scene_build",
    "scene_validate",
    "scene_preview",
    "scene_export",
    "scene_inspect_layout",
    "scene_generate_speech",
    "element_add",
    "element_update",
    "element_remove",
    "element_move",
    "background_set",
    "keyframe_set",
    "keyframe_remove",
    "shot_set",
    "image_trim",
    "scene_update",
    "scene_rename",
    "scene_delete",
    "element_group",
    "element_ungroup",
    "preset_save",
    "preset_rename",
    "preset_delete",
    "asset_add",
    "asset_rename",
    "asset_delete",
  ];

  it("every tool that touches scenes requires `project`", async () => {
    for (const name of SCENE_TOOLS) {
      const r = await registry.call(name, {}, h.ctx);
      expect(r.ok ? undefined : r.error.message, name).toContain("project");
    }
    const unscoped = registry.tools
      .filter((t) => !SCENE_TOOLS.includes(t.name))
      .filter(
        (t) => "project" in (t.input as unknown as { shape: object }).shape,
      )
      .map((t) => t.name);
    expect(unscoped.sort()).toEqual([
      "animation_delete",
      "animation_list",
      "animation_save",
      "font_install",
      "font_list",
      "preset_get",
      "preset_list",
      "project_create",
      "project_delete",
      "project_inspect",
      "project_update",
    ]);
  });

  it("edits only the named project's scene, even when another has the same name", async () => {
    await ok("project_create", { project: "otro", name: "Otro" });
    await ok("scene_create", { scene: "demo" });
    await ok("scene_create", { scene: "demo", project: "otro" });
    const { id } = await ok("element_add", {
      scene: "demo",
      project: "otro",
      kind: "rect",
    });
    await ok("element_update", {
      scene: "demo",
      project: "otro",
      id,
      patch: { x: 7 },
    });
    expect(
      (await ok("scene_get", { scene: "demo", project: "otro" })).elements,
    ).toHaveLength(1);
    expect((await onDisk("demo")).elements).toHaveLength(0);
    const missing = await call("scene_get", {
      scene: "demo",
      project: "nadie",
    });
    expect(missing.ok ? undefined : missing.error.code).toBe(
      "project_not_found",
    );
  });
});
