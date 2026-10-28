import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../../../model/model.ts";
import { parseScene } from "../../../model/schema.ts";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";

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

describe("animation presets", () => {
  it("copies a named preset in, and reports an unknown one", async () => {
    await writeFile(
      join(h.ctx.root, "presets", "animations", "spin.json"),
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
    await ok("scene_create", { scene: "s" });
    const { id } = await ok("element_add", {
      scene: "s",
      kind: "rect",
      patch: { animPreset: { name: "Spin", start: 0 } },
    });
    const el = (await onDisk("s")).elements.find((e) => e.id === id);
    expect(el?.tracks?.["@rotate"]).toBeDefined();
    const r = await call("element_add", {
      scene: "s",
      kind: "rect",
      patch: { id: "bad", animPreset: { name: "Nope", start: 0 } },
    });
    expect(r).toMatchObject({
      ok: false,
      error: { code: "unknown_anim_preset", path: "patch.animPreset" },
    });
  });

  it("inspects layout and detects out-of-bounds elements (023/D2, R3)", async () => {
    await ok("scene_create", { scene: "oob_demo" });
    await ok("element_add", {
      scene: "oob_demo",
      kind: "rect",
      patch: { x: 5000, y: 5000, w: 200, h: 200 },
    });
    const result = await ok("scene_inspect_layout", { scene: "oob_demo" });
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "out_of_bounds",
        }),
      ]),
    );
  });

  it("returns every top-level element's box beside the diagnostics (023/R2)", async () => {
    await ok("scene_create", { scene: "boxes" });
    const { id } = await ok("element_add", {
      scene: "boxes",
      kind: "rect",
      patch: { x: 10, y: 20, w: 30, h: 40 },
    });

    const result = await ok("scene_inspect_layout", {
      scene: "boxes",
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

    // A saving build is concise by default (064/R6); the scene is read from disk below
    expect(res.elements).toEqual([{ id: "my-rect", kind: "rect" }]);
    expect(res.saved).toBe("compact_built_demo");
    const savedDisk = await onDisk("compact_built_demo");
    const firstEl = savedDisk.elements[0] as Extract<
      Scene["elements"][number],
      { kind: "rect" }
    >;
    expect(firstEl.id).toBe("my-rect");
    expect(firstEl.x).toBe((1080 - 120) / 2);
  });
});
