import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
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

  it("fails when asked for several weights, since a file is one weight (080/R16)", async () => {
    const file = join(root, "mine.woff2");
    await writeFile(file, "font bytes");

    const result = await call("font_install", {
      family: "Mía",
      weights: [400, 700],
      file,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "invalid_input", path: "weights" },
    });
  });
});
