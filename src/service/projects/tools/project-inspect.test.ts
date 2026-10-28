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

describe("project_inspect lists animations and fonts", () => {
  it("names the project's own animation presets and font files", async () => {
    await ok("animation_save", {
      project,
      recipe: { name: "Salto", anim: {} },
    });
    const file = join(root, "mine.ttf");
    await writeFile(file, "font bytes");
    await ok("font_install", { project, family: "Mía", weights: [700], file });

    const details = await ok("project_inspect", { project });

    expect(details.animations).toEqual(["salto"]);
    expect(details.fonts).toEqual(["Mía-700.ttf"]);
  });
});
