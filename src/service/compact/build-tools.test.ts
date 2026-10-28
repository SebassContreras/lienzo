import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../../model/model.ts";
import { parseScene } from "../../model/schema.ts";
import {
  PROJECT,
  type ToolHarness,
  toolHarness,
} from "../../test/tool-harness.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

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

describe("scene_build effects and notices", () => {
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

describe("scene_build audio and fonts", () => {
  it("keeps a scene's audioTracks when overwriting it without audioTracks", async () => {
    const voice = { id: "v1", assetId: "voice", startOffset: 2 };
    await ok("scene_build", {
      compact: { audioTracks: [voice] },
      save: "demo",
    });

    const res = await ok("scene_build", {
      compact: { elements: [{ kind: "rect" }] },
      save: "demo",
      overwrite: true,
    });

    // a bare ref is stored with its project prefix, and the file is missing here (080/R3)
    expect((await onDisk("demo")).audioTracks).toEqual([
      { ...voice, assetId: "/projects/mi-proyecto/assets/voice" },
    ]);
    expect(res.notices).toEqual([
      expect.stringContaining("1 pista(s)"),
      expect.stringContaining("no sonará"),
    ]);
  });

  it("warns about a text font that is not installed", async () => {
    const res = await ok("scene_build", {
      compact: { elements: [{ kind: "text", font: "Montserrat" }] },
    });

    expect(res.notices).toEqual([
      expect.stringContaining("«Montserrat» no está instalada"),
      expect.stringContaining("«Montserrat» es una estimación"),
    ]);
  });

  it("gives no missing-font notice for a family installed in the project, only its estimated width", async () => {
    await mkdir(join(h.ctx.root, "projects", PROJECT, "fonts"), {
      recursive: true,
    });
    await writeFile(
      join(h.ctx.root, "projects", PROJECT, "fonts", "Montserrat-400.ttf"),
      "font",
    );

    const res = await ok("scene_build", {
      compact: {
        elements: [{ kind: "text", font: "Montserrat", weight: 400 }],
      },
    });

    expect(res.notices).toEqual([
      expect.stringContaining("«Montserrat» es una estimación"),
    ]);
  });

  it("keeps scene_validate valid while it warns about the font", async () => {
    const { scene } = await ok("scene_build", {
      compact: { elements: [{ kind: "text", font: "Montserrat" }] },
    });

    const res = await ok("scene_validate", { data: scene });

    expect(res).toEqual({
      valid: true,
      notices: [
        expect.stringContaining("«Montserrat» no está instalada"),
        expect.stringContaining("«Montserrat» es una estimación"),
      ],
    });
  });
});
