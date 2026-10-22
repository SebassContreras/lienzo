import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { DEFAULT_PROJECT_SLUG, resolveProjectScope } from "./project-scope.ts";

describe("040 project-boundary and scope resolution", () => {
  it("resolves DEFAULT_PROJECT_SLUG when no project is provided", async () => {
    const tmp = join(process.cwd(), "tmp-test-project-boundary");
    await rm(tmp, { recursive: true, force: true });
    await mkdir(join(tmp, "projects", DEFAULT_PROJECT_SLUG, "scenes"), {
      recursive: true,
    });
    await writeFile(
      join(tmp, "projects", DEFAULT_PROJECT_SLUG, "project.json"),
      JSON.stringify({
        name: "Mi Proyecto",
        palette: {
          primary: "#000",
          custom: [],
          background: "#fff",
          surface: "#eee",
          text: "#111",
          accent: "#f00",
        },
        canvas: { width: 1080, height: 1080, fps: 30, duration: 4 },
        fonts: [],
        slug: DEFAULT_PROJECT_SLUG,
        createdAt: new Date().toISOString(),
      }),
    );

    const ctx = createCtx(tmp, fakeRenderer());
    const scope = await resolveProjectScope(ctx);
    expect(scope.slug).toBe("mi-proyecto");
    expect(scope.store).toBeDefined();

    await rm(tmp, { recursive: true, force: true });
  });

  it("strictly detects and warns/rejects foreign project asset references", async () => {
    const tmp = join(process.cwd(), "tmp-test-asset-boundary");
    await rm(tmp, { recursive: true, force: true });
    await mkdir(join(tmp, "projects", "proj-a", "assets"), { recursive: true });
    await mkdir(join(tmp, "projects", "proj-b", "assets"), { recursive: true });

    await writeFile(
      join(tmp, "projects", "proj-a", "assets", "logo.png"),
      "image-data",
    );
    await writeFile(
      join(tmp, "projects", "proj-b", "assets", "other.png"),
      "image-data",
    );

    const ctx = createCtx(tmp, fakeRenderer());

    // Valid asset in proj-a
    const valid = await ctx.projects.checkAsset("proj-a", "logo.png");
    expect(valid.ok).toBe(true);

    // Cross-project reference to proj-b inside proj-a must be flagged
    const crossProject = await ctx.projects.checkAsset(
      "proj-a",
      "/projects/proj-b/assets/other.png",
    );
    expect(crossProject.ok).toBe(false);
    expect(crossProject.warning).toContain("Aislamiento estricto");
    expect(crossProject.warning).toContain("proj-b");

    await rm(tmp, { recursive: true, force: true });
  });

  it("accepts an asset reference that points into a subfolder of assets/", async () => {
    const tmp = join(process.cwd(), "tmp-test-nested-asset");
    await rm(tmp, { recursive: true, force: true });
    await mkdir(join(tmp, "projects", "proj-a", "assets", "brand"), {
      recursive: true,
    });
    await writeFile(
      join(tmp, "projects", "proj-a", "assets", "brand", "profile.jpg"),
      "image-data",
    );
    const ctx = createCtx(tmp, fakeRenderer());

    const check = await ctx.projects.checkAsset(
      "proj-a",
      "/api/projects/proj-a/assets/brand/profile.jpg",
    );

    expect(check.ok).toBe(true);
    await rm(tmp, { recursive: true, force: true });
  });
});
