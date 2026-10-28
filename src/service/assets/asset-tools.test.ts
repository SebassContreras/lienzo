/** Renaming and deleting project assets keeps scenes in step (063/R7). */
import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../../model/model.ts";
import { PNG_1X1 } from "../../test/png.ts";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

const project = "assets";
let root: string;
let ctx: Ctx;

const call = (tool: string, input: Record<string, unknown>) =>
  registry.call(tool, { project, ...input }, ctx);

async function ok(tool: string, input: Record<string, unknown>) {
  const result = await call(tool, input);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value as Record<string, unknown>;
}

const sceneSrc = async (scene: string) =>
  ((await ok("scene_get", { scene })) as unknown as Scene)
    .elements[0] as unknown as {
    src: string;
  };

/** Adds `logo.png` and saves scene `uses` with an image showing it. */
async function sceneUsingLogo(): Promise<string> {
  const file = join(root, "logo.png");
  await writeFile(file, PNG_1X1);
  const { src, filename } = await ok("asset_add", { file });
  await ok("scene_build", {
    compact: { elements: [{ kind: "image", src }] },
    save: "uses",
  });
  return String(filename);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-assets-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
  await registry.call(
    "project_create",
    { project: project, name: "Assets" },
    ctx,
  );
});

describe("asset_rename (063/R7)", () => {
  it("points every scene using the asset at its new path", async () => {
    // Arrange
    const filename = await sceneUsingLogo();

    // Act
    const res = await ok("asset_rename", {
      from: filename,
      to: "logos/acme.png",
    });

    // Assert
    expect(res).toEqual({ path: "logos/acme.png", scenes: ["uses"] });
    expect((await sceneSrc("uses")).src).toBe(
      `/projects/${project}/assets/logos/acme.png`,
    );
  });

  it("follows an image given the bare filename asset_add returns (074/R5)", async () => {
    // Arrange
    const file = join(root, "logo.png");
    await writeFile(file, PNG_1X1);
    const { filename } = await ok("asset_add", { file });
    await ok("scene_build", {
      compact: { elements: [{ kind: "image", src: filename }] },
      save: "bare",
    });

    // Act
    await ok("asset_rename", { from: filename, to: "logos/acme.png" });

    // Assert
    expect((await sceneSrc("bare")).src).toBe(
      `/projects/${project}/assets/logos/acme.png`,
    );
  });

  it("refuses a target that already exists", async () => {
    // Arrange
    const filename = await sceneUsingLogo();
    await writeFile(
      join(root, "projects", project, "assets", "taken.png"),
      "x",
    );

    // Act
    const res = await call("asset_rename", { from: filename, to: "taken.png" });

    // Assert
    expect(res.ok ? undefined : res.error.code).toBe("exists");
  });
});

describe("asset_delete (063/R7)", () => {
  it("refuses while a scene uses the asset and names that scene", async () => {
    // Arrange
    const filename = await sceneUsingLogo();

    // Act
    const res = await call("asset_delete", { path: filename });

    // Assert
    expect(res.ok ? undefined : res.error).toMatchObject({
      code: "in_use",
      message: expect.stringContaining("uses"),
    });
  });

  it("deletes a used asset when forced and reports who used it", async () => {
    // Arrange
    const filename = await sceneUsingLogo();

    // Act
    const res = await ok("asset_delete", { path: filename, force: true });

    // Assert
    expect(res).toEqual({ path: filename, usedBy: ["uses"] });
    expect((await ok("project_inspect", { project: project })).assets).toEqual(
      [],
    );
  });
});
