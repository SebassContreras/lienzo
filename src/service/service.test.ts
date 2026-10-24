import { existsSync } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { defineComponent } from "../components/descriptor.ts";
import { ellipse } from "../components/ellipse/descriptor.ts";
import { registerComponent } from "../components/index.ts";
import { boxOf, center } from "../engine/geometry.ts";
import { applyTracks } from "../engine/tracks.ts";
import type { Element, Scene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import { type Ctx, createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { registry } from "./tools/index.ts";

let ctx: Ctx;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-service-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
  await registry.call(
    "project_create",
    { slug: PROJECT, name: "Mi proyecto" },
    ctx,
  );
});

/** Every call names the test project (046/R1); tools without `project` ignore it. */
const PROJECT = "mi-proyecto";

async function call(name: string, input: unknown) {
  const scoped =
    input && typeof input === "object" ? { project: PROJECT, ...input } : input;
  return registry.call(name, scoped, ctx);
}

async function ok(name: string, input: unknown) {
  const r = await call(name, input);
  if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.error)}`);
  return r.value as Record<string, unknown>;
}

const sceneFiles = () =>
  readdir(join(ctx.root, "projects", "mi-proyecto", "scenes")).catch(() => []);

/** The file on disk, checked to open in the editor (R5). */
async function onDisk(name: string): Promise<Scene> {
  const raw = await readFile(
    join(ctx.root, "projects", "mi-proyecto", "scenes", `${name}.json`),
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
    expect(await ok("scene_validate", { scene: { width: "x" } })).toMatchObject(
      { valid: false, path: expect.any(String) },
    );
  });

  it("creates, edits and reads a scene that opens in the editor", async () => {
    await ok("scene_create", { name: "Demo" });
    expect(await call("scene_create", { name: "Demo" })).toMatchObject({
      ok: false,
      error: { code: "exists", path: "name" },
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
    await ok("background_set", { scene: "demo", values: { color: "#123456" } });
    scene = await onDisk("demo");
    expect(scene.elements).toHaveLength(1);
    expect(scene.background.color).toBe("#123456");
    expect(await ok("scene_get", { scene: "demo" })).toEqual(scene);
    const list = (await ok("scene_list", {})) as unknown as unknown[];
    expect(list).toEqual([
      expect.objectContaining({ name: "demo", valid: true }),
    ]);
  });

  it("re-centres an updated text's box on the point given as `at` (R3)", async () => {
    await ok("scene_create", { name: "demo" });
    const { id } = await ok("element_add", {
      scene: "demo",
      kind: "text",
      set: { x: 540, y: 100, align: "center" },
    });

    await ok("element_update", {
      scene: "demo",
      id,
      patch: { text: "Un título más largo" },
      at: { x: 540, y: 300 },
    });

    const el = (await onDisk("demo")).elements[0] as Element;
    expect(center(boxOf(el))).toEqual({ x: 540, y: 300 });
  });

  it("keeps an updated element's position when no `at` is given (R3)", async () => {
    await ok("scene_create", { name: "demo" });
    const { id } = await ok("element_add", {
      scene: "demo",
      kind: "rect",
      set: { x: 20, y: 30 },
    });

    await ok("element_update", { scene: "demo", id, patch: { w: 50 } });

    const el = (await onDisk("demo")).elements[0] as Element;
    expect(boxOf(el)).toMatchObject({ x: 20, y: 30, w: 50 });
  });

  it("writes nothing when an edit would make the scene invalid (R4)", async () => {
    await ok("scene_create", { name: "demo" });
    const { id } = await ok("element_add", { scene: "demo", kind: "rect" });
    const scenePath = join(
      ctx.root,
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
      name: "bad",
      scene: { width: -1 },
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

describe("descriptor-driven tools (R6)", () => {
  it("handles a test-only kind with no tool change, and its keyframes play", async () => {
    registerComponent(
      defineComponent({ ...ellipse, kind: "blob", label: "Blob" } as never),
    );
    const kinds = (await ok("component_list", {})) as unknown as {
      kind: string;
      animatable: string[];
    }[];
    expect(kinds.find((k) => k.kind === "blob")?.animatable).toContain("x");
    await ok("scene_create", { name: "s" });
    const { id } = await ok("element_add", { scene: "s", kind: "blob" });
    await ok("element_update", { scene: "s", id, patch: { w: 50 } });
    await ok("keyframe_set", { scene: "s", id, path: "x", t: 0, value: 0 });
    await ok("keyframe_set", { scene: "s", id, path: "x", t: 2, value: 100 });
    expect(
      await call("keyframe_set", {
        scene: "s",
        id,
        path: "nope",
        t: 0,
        value: 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "unknown_path" } });
    const el = (await onDisk("s")).elements[0] as Element & { x: number };
    expect(el.kind).toBe("blob");
    expect((applyTracks(el, 1).el as typeof el).x).toBeCloseTo(50, 0);
    await ok("keyframe_remove", { scene: "s", id, path: "x", t: 2 });
    await ok("element_move", { scene: "s", id, to: 0 });
    await ok("element_remove", { scene: "s", id });
    expect((await onDisk("s")).elements).toEqual([]);
  });
});

describe("animation presets (D6, R7)", () => {
  it("copies a named preset in, and reports an unknown one", async () => {
    await writeFile(
      join(ctx.root, "presets", "animations", "spin.json"),
      JSON.stringify({
        name: "Spin",
        tracks: {
          "@rotate": [
            { t: 0, value: 0, easing: "linear" },
            { t: 1, value: 90, easing: "linear" },
          ],
        },
      }),
    );
    await ok("scene_create", { name: "s" });
    const { id } = await ok("element_add", {
      scene: "s",
      kind: "rect",
      set: { animPreset: { name: "Spin", start: 0 } },
    });
    const el = (await onDisk("s")).elements.find((e) => e.id === id);
    expect(el?.tracks?.["@rotate"]).toBeDefined();
    const r = await call("element_add", {
      scene: "s",
      kind: "rect",
      set: { animPreset: { name: "Nope", start: 0 } },
    });
    expect(r).toMatchObject({
      ok: false,
      error: { code: "unknown_anim_preset", path: "elements.1.animPreset" },
    });
  });

  it("inspects layout and detects out-of-bounds elements (023/D2, R3)", async () => {
    await ok("scene_create", { name: "oob_demo" });
    await ok("element_add", {
      scene: "oob_demo",
      kind: "rect",
      set: { x: 5000, y: 5000, w: 200, h: 200 },
    });
    const result = await ok("scene_inspect_layout", { name: "oob_demo" });
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "out_of_bounds",
        }),
      ]),
    );
  });

  it("returns every top-level element's box beside the diagnostics (023/R2)", async () => {
    await ok("scene_create", { name: "boxes" });
    const { id } = await ok("element_add", {
      scene: "boxes",
      kind: "rect",
      set: { x: 10, y: 20, w: 30, h: 40 },
    });

    const result = await ok("scene_inspect_layout", {
      name: "boxes",
      times: [0],
    });

    expect(result.boxes).toEqual([{ id, t: 0, x: 10, y: 20, w: 30, h: 40 }]);
  });

  it("builds a scene from compact format with scene_build and saves it (011/T006)", async () => {
    const res = await ok("scene_build", {
      compact: {
        size: "1080x1080",
        duration: 2,
        elements: [
          {
            id: "my-rect",
            kind: "rect",
            w: 120,
            h: 80,
            at: "center",
          },
        ],
      },
      save: "compact_built_demo",
    });

    expect(res.scene).toBeDefined();
    expect(res.saved).toMatchObject({ scene: "compact_built_demo" });
    const savedDisk = await onDisk("compact_built_demo");
    const firstEl = savedDisk.elements[0] as Extract<
      Scene["elements"][number],
      { kind: "rect" }
    >;
    expect(firstEl.id).toBe("my-rect");
    expect(firstEl.x).toBe((1080 - 120) / 2);
  });
});

describe("scene_build effects and notices (058/R1)", () => {
  it("keeps partial effects on a compact element", async () => {
    const res = await ok("scene_build", {
      compact: { elements: [{ kind: "rect", effects: { blur: 6 } }] },
    });

    const rect = (res.scene as Scene).elements[0];
    expect(rect.effects).toEqual({ blur: 6, blend: "normal", mask: "" });
  });

  it("returns a notice for an unknown effect key", async () => {
    const res = await ok("scene_build", {
      compact: { elements: [{ kind: "rect", effects: { blurr: 6 } }] },
    });

    expect(res.notices).toEqual([
      expect.stringContaining("elements.0.effects: «blurr»"),
    ]);
  });
});

describe("scene_preview out (058/R3)", () => {
  const exports = () => join(ctx.root, "projects", "mi-proyecto", "exports");

  it("saves the PNG inside exports/ and returns its path", async () => {
    await ok("scene_create", { name: "demo" });

    const res = await ok("scene_preview", { scene: "demo", out: "look.png" });

    expect(res.file).toBe(join(exports(), "look.png"));
    await expect(readFile(res.file as string)).resolves.toBeDefined();
  });

  it("rejects an `out` outside exports/ and writes nothing", async () => {
    await ok("scene_create", { name: "demo" });

    const r = await call("scene_preview", { scene: "demo", out: "../x.png" });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "out_of_project",
      path: "out",
    });
    expect(existsSync(join(ctx.root, "projects", "mi-proyecto", "x.png"))).toBe(
      false,
    );
  });

  it("writes nothing without `out`", async () => {
    await ok("scene_create", { name: "demo" });

    const res = await ok("scene_preview", { scene: "demo" });

    expect(res.file).toBeUndefined();
    expect(existsSync(exports())).toBe(false);
  });
});

describe("scene_export (010/R1)", () => {
  it("writes inside the project's exports/ and rejects an `out` outside it (046/R2)", async () => {
    const exports = join(ctx.root, "projects", "mi-proyecto", "exports");
    await ok("scene_create", { name: "demo" });
    const png = await ok("scene_export", { scene: "demo", format: "png" });
    expect(png.file).toBe(join(exports, "demo.png"));
    expect(png.notices).toEqual([]);
    const gif = await ok("scene_export", {
      scene: "demo",
      format: "gif",
      out: "out/post.gif",
    });
    expect(gif.file).toBe(join(exports, "out", "post.gif"));
    await expect(readFile(gif.file as string)).resolves.toHaveLength(
      gif.bytes as number,
    );
    for (const out of ["../escape.png", "../../../root.png", ctx.root]) {
      const r = await call("scene_export", {
        scene: "demo",
        format: "png",
        out,
      });
      expect(r.ok ? undefined : r.error).toMatchObject({
        code: "out_of_project",
        path: "out",
      });
    }
  });

  it("falls back to WebM, and says so, when H.264 is unavailable", async () => {
    ctx = createCtx(ctx.root, fakeRenderer("video/webm"));
    await ok("scene_create", { name: "demo" });
    const r = await ok("scene_export", {
      scene: "demo",
      format: "mp4",
      out: "clip.mp4",
    });
    expect(r.file).toBe(
      join(ctx.root, "projects", "mi-proyecto", "exports", "clip.webm"),
    );
    expect(r.type).toBe("video/webm");
    expect(r.notices).toHaveLength(1);
  });
});

describe("project scope (046/R1)", () => {
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
  ];

  it("every tool that touches scenes requires `project`", async () => {
    for (const name of SCENE_TOOLS) {
      const r = await registry.call(name, {}, ctx);
      expect(r.ok ? undefined : r.error.message, name).toContain("project");
    }
    const unscoped = registry.tools
      .filter((t) => !SCENE_TOOLS.includes(t.name))
      .filter(
        (t) => "project" in (t.input as unknown as { shape: object }).shape,
      )
      .map((t) => t.name);
    expect(unscoped.sort()).toEqual(["font_install", "font_list"]);
  });

  it("edits only the named project's scene, even when another has the same name", async () => {
    await ok("project_create", { slug: "otro", name: "Otro" });
    await ok("scene_create", { name: "demo" });
    await ok("scene_create", { name: "demo", project: "otro" });
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

describe("nested element tools and group parent insertion (051/R1, R2)", () => {
  it("adds elements inside nested groups with `parent` and edits, moves, animates and removes them by id or slash path", async () => {
    await ok("scene_build", {
      compact: {
        size: "1080x1080",
        duration: 4,
        elements: [
          {
            id: "shot-1",
            kind: "group",
            w: 400,
            h: 200,
            cw: 400,
            ch: 200,
            children: [
              { id: "s1-bg", kind: "rect", x: 0, y: 0, w: 400, h: 200 },
            ],
          },
        ],
      },
      save: "shots",
    });

    const added = await ok("element_add", {
      scene: "shots",
      kind: "rect",
      parent: "shot-1",
      set: { w: 80, h: 40 },
    });
    const carId = added.id as string;

    let scene = await onDisk("shots");
    let group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual(["s1-bg", carId]);
    const car = group.children[1] as Extract<Element, { kind: "rect" }>;
    expect({ x: car.x, y: car.y }).toEqual({
      x: (400 - 80) / 2,
      y: (200 - 40) / 2,
    });

    await ok("element_update", {
      scene: "shots",
      id: `shot-1/${carId}`,
      patch: { x: 25 },
    });
    await ok("keyframe_set", {
      scene: "shots",
      id: carId,
      path: "x",
      t: 0,
      value: 25,
    });
    await ok("keyframe_set", {
      scene: "shots",
      id: `shot-1/${carId}`,
      path: "x",
      t: 2,
      value: 200,
    });
    await ok("keyframe_remove", {
      scene: "shots",
      id: carId,
      path: "x",
      t: 0,
    });
    await ok("element_move", {
      scene: "shots",
      id: `shot-1/${carId}`,
      to: "back",
    });

    scene = await onDisk("shots");
    group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual([carId, "s1-bg"]);
    expect((group.children[0] as { x: number }).x).toBe(25);
    expect(group.children[0]?.tracks?.x).toEqual([
      { t: 2, value: 200, easing: "auto" },
    ]);

    await ok("element_remove", {
      scene: "shots",
      id: `shot-1/${carId}`,
    });
    scene = await onDisk("shots");
    group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual(["s1-bg"]);
  });

  it("rejects `element_add` when `parent` does not exist or is not a group and leaves the scene unchanged (051/R2)", async () => {
    await ok("scene_create", { name: "flat" });
    const { id: rectId } = await ok("element_add", {
      scene: "flat",
      kind: "rect",
    });
    const before = await onDisk("flat");

    const missingParent = await call("element_add", {
      scene: "flat",
      kind: "rect",
      parent: "no-such-group",
    });
    expect(missingParent).toMatchObject({
      ok: false,
      error: { code: "not_found", path: "parent" },
    });

    const nonGroupParent = await call("element_add", {
      scene: "flat",
      kind: "rect",
      parent: rectId,
    });
    expect(nonGroupParent).toMatchObject({
      ok: false,
      error: { code: "not_a_group", path: "parent" },
    });

    expect(await onDisk("flat")).toEqual(before);
  });

  it("sets and clears track repeat, until, and step/hold easings via keyframe_set and scene_build (052/R3, R4)", async () => {
    await ok("scene_build", {
      compact: {
        size: "1080x1080",
        duration: 6,
        elements: [
          {
            id: "wheel",
            kind: "rect",
            tracks: {
              "@rotate": {
                keys: [
                  [0, 0, "linear"],
                  [1, 360],
                ],
                repeat: "loop",
                until: 4,
              },
            },
          },
        ],
      },
      save: "loop-scene",
    });

    let scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual({
      keys: [
        { t: 0, value: 0, easing: "linear" },
        { t: 1, value: 360, easing: "auto" },
      ],
      repeat: "loop",
      until: 4,
    });

    // Update repeat to pingpong and add a keyframe with step easing while keeping until
    await ok("keyframe_set", {
      scene: "loop-scene",
      id: "wheel",
      path: "@rotate",
      t: 0,
      value: 15,
      easing: "step",
      repeat: "pingpong",
    });
    scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual({
      keys: [
        { t: 0, value: 15, easing: "step" },
        { t: 1, value: 360, easing: "auto" },
      ],
      repeat: "pingpong",
      until: 4,
    });

    // Clear repeat ("none") and until (null) without modifying keyframes
    await ok("keyframe_set", {
      scene: "loop-scene",
      id: "wheel",
      path: "@rotate",
      repeat: "none",
      until: null,
    });
    scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual([
      { t: 0, value: 15, easing: "step" },
      { t: 1, value: 360, easing: "auto" },
    ]);
  });
});
