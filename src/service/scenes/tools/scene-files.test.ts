import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { boxOf, center } from "../../../engine/geometry.ts";
import type { Element, Scene } from "../../../model/model.ts";
import { parseScene } from "../../../model/schema.ts";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const call = (name: string, input: unknown) => h.call(name, input);

const ok = (name: string, input: unknown) => h.ok(name, input);

const sceneFiles = () =>
  readdir(join(h.ctx.root, "projects", "mi-proyecto", "scenes")).catch(
    () => [],
  );

async function onDisk(name: string): Promise<Scene> {
  const raw = await readFile(
    join(h.ctx.root, "projects", "mi-proyecto", "scenes", `${name}.json`),
    "utf8",
  );
  const parsed = parseScene(JSON.parse(raw));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe("service tools", () => {
  it("lists components and presets, and gets a preset", async () => {
    const kinds = (await ok("component_list", {})) as unknown as {
      kind: string;
    }[];
    expect(kinds.map((k) => k.kind)).toContain("rect");
    const presets = (await ok("preset_list", {})) as unknown as {
      name: string;
      kind: string;
    }[];
    const element = presets.find((p) => p.kind !== "background");
    expect(element).toBeDefined();
    const got = await ok("preset_get", { name: element?.name });
    expect(got.source).toBe("built-in");
  });

  it("validates presets and scenes, naming the failing path", async () => {
    expect(
      await ok("preset_validate", {
        recipe: { name: "A", kind: "rect", traits: ["nope"] },
      }),
    ).toMatchObject({ valid: false });
    expect(await ok("scene_validate", { data: { width: "x" } })).toMatchObject({
      valid: false,
      path: expect.any(String),
    });
  });

  it("creates, edits and reads a scene that opens in the editor", async () => {
    await ok("scene_create", { scene: "Demo" });
    expect(await call("scene_create", { scene: "Demo" })).toMatchObject({
      ok: false,
      error: { code: "exists", path: "scene" },
    });
    const a = await ok("element_add", { scene: "demo", kind: "rect" });
    const presets = (await ok("preset_list", {})) as unknown as {
      name: string;
      kind: string;
    }[];
    const element = presets.find((p) => p.kind !== "background");
    const b = await ok("element_add", {
      scene: "demo",
      preset: element?.name,
      at: { x: 100, y: 100 },
    });
    await ok("element_update", {
      scene: "demo",
      id: a.id,
      patch: { x: 7 },
    });
    await ok("element_move", { scene: "demo", id: b.id, to: "back" });
    let scene = await onDisk("demo");
    expect(scene.elements.map((e) => e.id)).toEqual([b.id, a.id]);
    expect((scene.elements[1] as Element & { x: number }).x).toBe(7);
    await ok("element_remove", { scene: "demo", id: b.id });
    await ok("background_set", { scene: "demo", patch: { color: "#123456" } });
    scene = await onDisk("demo");
    expect(scene.elements).toHaveLength(1);
    expect(scene.background.color).toBe("#123456");
    expect(await ok("scene_get", { scene: "demo", full: true })).toEqual(scene);
    const list = (await ok("scene_list", {})) as unknown as unknown[];
    expect(list).toEqual([
      expect.objectContaining({ name: "demo", valid: true }),
    ]);
  });

  it("re-centres an updated text's box on the point given as `at` (R3)", async () => {
    await ok("scene_create", { scene: "demo" });
    const { id } = await ok("element_add", {
      scene: "demo",
      kind: "text",
      patch: { x: 540, y: 100, align: "center" },
    });

    await ok("element_update", {
      scene: "demo",
      id,
      patch: { text: "Un título más largo" },
      at: { x: 540, y: 300 },
    });

    const el = (await onDisk("demo")).elements[0] as Element;
    const c = center(boxOf(el));
    // `at` positions are rounded to two decimals (068/D5)
    expect(c.x).toBeCloseTo(540, 2);
    expect(c.y).toBeCloseTo(300, 2);
  });

  it("keeps an updated element's position when no `at` is given (R3)", async () => {
    await ok("scene_create", { scene: "demo" });
    const { id } = await ok("element_add", {
      scene: "demo",
      kind: "rect",
      patch: { x: 20, y: 30 },
    });

    await ok("element_update", { scene: "demo", id, patch: { w: 50 } });

    const el = (await onDisk("demo")).elements[0] as Element;
    expect(boxOf(el)).toMatchObject({ x: 20, y: 30, w: 50 });
  });

  it("writes nothing when an edit would make the scene invalid (R4)", async () => {
    await ok("scene_create", { scene: "demo" });
    const { id } = await ok("element_add", { scene: "demo", kind: "rect" });
    const scenePath = join(
      h.ctx.root,
      "projects",
      "mi-proyecto",
      "scenes",
      "demo.json",
    );
    const before = await readFile(scenePath, "utf8");
    const r = await call("element_update", {
      scene: "demo",
      id,
      patch: { w: "wide" },
    });
    expect(r).toMatchObject({
      ok: false,
      error: { path: expect.stringMatching(/w/) },
    });
    expect(await readFile(scenePath, "utf8")).toBe(before);
    const bad = await call("scene_create", {
      scene: "bad",
      data: { width: -1 },
    });
    expect(bad.ok).toBe(false);
    expect(await sceneFiles()).toEqual(["demo.json"]);
  });

  it("reports bad input and unknown tools", async () => {
    expect(await call("element_add", { scene: "x" })).toMatchObject({
      ok: false,
      error: { path: "preset" },
    });
    expect(await call("nope_tool", {})).toMatchObject({
      ok: false,
      error: { code: "unknown_tool" },
    });
  });
});
