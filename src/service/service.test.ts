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
});

async function call(name: string, input: unknown) {
  return registry.call(name, input, ctx);
}

async function ok(name: string, input: unknown) {
  const r = await call(name, input);
  if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.error)}`);
  return r.value as Record<string, unknown>;
}

const sceneFiles = () => readdir(join(ctx.root, "scenes")).catch(() => []);

/** The file on disk, checked to open in the editor (R5). */
async function onDisk(name: string): Promise<Scene> {
  const raw = await readFile(join(ctx.root, "scenes", `${name}.json`), "utf8");
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

  it("writes nothing when an edit would make the scene invalid (R4)", async () => {
    await ok("scene_create", { name: "demo" });
    const { id } = await ok("element_add", { scene: "demo", kind: "rect" });
    const before = await readFile(
      join(ctx.root, "scenes", "demo.json"),
      "utf8",
    );
    const r = await call("element_update", {
      scene: "demo",
      id,
      patch: { w: "wide" },
    });
    expect(r).toMatchObject({
      ok: false,
      error: { path: expect.stringMatching(/w/) },
    });
    expect(await readFile(join(ctx.root, "scenes", "demo.json"), "utf8")).toBe(
      before,
    );
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

describe("scene_export (010/R1)", () => {
  it("writes exports/<scene>.<ext>, or `out` relative to the root", async () => {
    await ok("scene_create", { name: "demo" });
    const png = await ok("scene_export", { scene: "demo", format: "png" });
    expect(png.file).toBe(join(ctx.root, "exports", "demo.png"));
    expect(png.notices).toEqual([]);
    const gif = await ok("scene_export", {
      scene: "demo",
      format: "gif",
      out: "out/post.gif",
    });
    expect(gif.file).toBe(join(ctx.root, "out", "post.gif"));
    await expect(readFile(gif.file as string)).resolves.toHaveLength(
      gif.bytes as number,
    );
  });

  it("falls back to WebM, and says so, when H.264 is unavailable", async () => {
    ctx = createCtx(ctx.root, fakeRenderer("video/webm"));
    await ok("scene_create", { name: "demo" });
    const r = await ok("scene_export", {
      scene: "demo",
      format: "mp4",
      out: "clip.mp4",
    });
    expect(r.file).toBe(join(ctx.root, "clip.webm"));
    expect(r.type).toBe("video/webm");
    expect(r.notices).toHaveLength(1);
  });
});
