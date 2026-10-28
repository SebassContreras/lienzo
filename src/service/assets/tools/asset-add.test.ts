import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { PNG_1X1 } from "../../../test/png.ts";
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

describe("asset_add", () => {
  it("copies a file into a project subfolder", async () => {
    const file = join(root, "logo.png");
    await writeFile(file, PNG_1X1);

    const { src, filename } = await ok("asset_add", {
      project,
      file,
      folder: "logos",
    });

    const stored = join(root, "projects", project, "assets", String(filename));
    expect(await readFile(stored)).toEqual(PNG_1X1);
    expect(src).toBe(`/projects/${project}/assets/${filename}`);
  });

  it("refuses a file that only has an image extension (069/D8)", async () => {
    const file = join(root, "fake.png");
    await writeFile(file, "not a png");

    expect(await errorCode("asset_add", { project, file })).toBe(
      "invalid_image",
    );
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
