/** The tools that cover what only the editor could do before (062/R10–R16). */
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
import type { Scene } from "../model/model.ts";
import { type Ctx, createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { registry } from "./tools/index.ts";

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

const RECIPE = { name: "Caja", kind: "rect", traits: [] };

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-tools-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
  await ok("project_create", { slug: project, name: "Tools" });
  await ok("scene_create", { project, name: "s" });
});

describe("scene_update", () => {
  it("merges settings and keeps the elements", async () => {
    await ok("element_add", { project, scene: "s", kind: "rect" });

    await ok("scene_update", {
      project,
      scene: "s",
      patch: { duration: 6, width: 720 },
    });

    const scene = await saved();
    expect([scene.duration, scene.width, scene.elements.length]).toEqual([
      6, 720, 1,
    ]);
  });

  it("removes a symbol given as null", async () => {
    const symbol = { w: 10, h: 10, children: [] };
    await ok("scene_update", {
      project,
      scene: "s",
      patch: { symbols: { a: symbol, b: symbol } },
    });

    await ok("scene_update", {
      project,
      scene: "s",
      patch: { symbols: { a: null } },
    });

    expect(Object.keys((await saved()).symbols ?? {})).toEqual(["b"]);
  });

  it("refuses elements in the patch", async () => {
    const code = await errorCode("scene_update", {
      project,
      scene: "s",
      patch: { elements: [] },
    });

    expect(code).toBe("invalid_input");
  });

  it("refuses a patch that leaves the scene invalid", async () => {
    const code = await errorCode("scene_update", {
      project,
      scene: "s",
      patch: { fps: "fast" },
    });

    expect(code).toBeDefined();
  });
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
    await ok("scene_create", { project, name: "t" });

    expect(
      await errorCode("scene_rename", { project, from: "s", to: "t" }),
    ).toBe("exists");
  });

  it("deletes a scene", async () => {
    await ok("scene_delete", { project, name: "s" });

    expect(await errorCode("scene_get", { project, scene: "s" })).toBeDefined();
  });

  it("fails to delete a missing scene", async () => {
    expect(await errorCode("scene_delete", { project, name: "nope" })).toBe(
      "not_found",
    );
  });
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
    ).toBe("not_found");
  });
});

describe("animation_save and animation_list", () => {
  it("lists an animation once saved", async () => {
    await ok("animation_save", {
      preset: { name: "Salto", category: "Mías", anim: {} },
    });

    const { animations } = await ok("animation_list", {});
    expect(animations).toEqual([
      { file: "salto", name: "Salto", category: "Mías" },
    ]);
  });

  it("refuses an animation without a name", async () => {
    expect(await errorCode("animation_save", { preset: {} })).toBe(
      "invalid_animation",
    );
  });
});

describe("project_update", () => {
  it("changes the name and keeps the slug", async () => {
    const manifest = await ok("project_update", {
      slug: project,
      name: "Nuevo",
    });

    expect([manifest.name, manifest.slug]).toEqual(["Nuevo", project]);
  });

  it("fails on a missing project", async () => {
    expect(await errorCode("project_update", { slug: "nope", name: "x" })).toBe(
      "not_found",
    );
  });
});

describe("asset_add", () => {
  it("copies a file into a project subfolder", async () => {
    const file = join(root, "logo.png");
    await writeFile(file, "png bytes");

    const { src, filename } = await ok("asset_add", {
      project,
      file,
      folder: "logos",
    });

    const stored = join(root, "projects", project, "assets", String(filename));
    expect(await readFile(stored, "utf8")).toBe("png bytes");
    expect(src).toBe(`/projects/${project}/assets/${filename}`);
  });

  it("refuses an unsupported extension", async () => {
    const file = join(root, "notes.txt");
    await writeFile(file, "x");

    expect(await errorCode("asset_add", { project, file })).toBe(
      "unsupported_type",
    );
  });

  it("refuses a folder that leaves assets/", async () => {
    const file = join(root, "logo.png");
    await writeFile(file, "x");

    expect(
      await errorCode("asset_add", { project, file, folder: "../escape" }),
    ).toBe("invalid_folder");
  });
});

describe("font_install with a local file", () => {
  it("installs the file under the family and weight", async () => {
    const file = join(root, "mine.woff2");
    await writeFile(file, "font bytes");

    const fonts = await call("font_install", {
      family: "Mía",
      weights: [700],
      file,
    });

    expect(fonts).toEqual({
      ok: true,
      value: [{ family: "Mía", weight: 700, file: "Mía-700.woff2" }],
    });
  });
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
