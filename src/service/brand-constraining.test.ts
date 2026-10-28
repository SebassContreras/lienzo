import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "./ctx.ts";
import { fakeRenderer } from "./render/fake-renderer.ts";
import { registry } from "./tools/index.ts";

describe("Brand constraining and asset guardrails", () => {
  let tempRoot: string;
  let ctx: Ctx;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "lienzo-brand-test-"));
    ctx = createCtx(tempRoot, fakeRenderer());

    // Create a branded project
    await ctx.projects.create("brand-x", {
      name: "Brand X Corp",
      palette: {
        primary: "#ff0077",
        background: "#0a0a0a",
        custom: [],
      },
      canvas: {
        width: 1080,
        height: 1920,
        fps: 60,
        duration: 10,
      },
      fonts: [],
    });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("scene_create with project applies project canvas defaults and writes to project scenes/", async () => {
    const res = await registry.call(
      "scene_create",
      {
        scene: "story-post",
        project: "brand-x",
      },
      ctx,
    );
    expect(res.ok).toBe(true);

    const projectStore = await ctx.projects.projectStore("brand-x");
    const rawScene = (await projectStore.readScene("story-post")) as {
      width: number;
      height: number;
      fps: number;
      duration: number;
      background: { color: string };
    };
    expect(rawScene).toBeDefined();
    expect(rawScene.width).toBe(1080);
    expect(rawScene.height).toBe(1920);
    expect(rawScene.fps).toBe(60);
    expect(rawScene.duration).toBe(10);
    expect(rawScene.background.color).toBe("#0a0a0a");
  });

  it("element_add produces a warning notice when referencing a foreign unapproved asset", async () => {
    // 1. Create a scene in brand-x
    await registry.call(
      "scene_create",
      {
        scene: "hero-scene",
        project: "brand-x",
      },
      ctx,
    );

    // 2. Add an image element with a foreign asset reference
    const addRes = await registry.call(
      "element_add",
      {
        scene: "hero-scene",
        project: "brand-x",
        kind: "image",
        patch: { src: "assets/unapproved-foreign-image.png" },
      },
      ctx,
    );

    expect(addRes.ok).toBe(true);
    if (addRes.ok) {
      const val = addRes.value as { notices: string[]; id: string };
      expect(
        val.notices.some((n) =>
          n.includes("no existe en assets/ del proyecto «brand-x»"),
        ),
      ).toBe(true);
    }

    // 3. Place an approved asset in projects/brand-x/assets/
    const assetPath = ctx.projects.resolvePath("brand-x", "assets");
    await writeFile(join(assetPath, "brand-logo.png"), "image-content");

    // 4. Add element referencing the approved local asset
    const validAddRes = await registry.call(
      "element_add",
      {
        scene: "hero-scene",
        project: "brand-x",
        kind: "image",
        patch: { src: "assets/brand-logo.png" },
      },
      ctx,
    );

    expect(validAddRes.ok).toBe(true);
    if (validAddRes.ok) {
      const val = validAddRes.value as { notices: string[]; id: string };
      expect(val.notices.some((n) => n.includes("brand-logo"))).toBe(false);
    }
  });
});
