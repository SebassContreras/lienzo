import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectManifest } from "../../model/project.ts";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "../tools/index.ts";
import { createProjectStore, type ProjectStore } from "./project-store.ts";

describe("ProjectStore & Lifecycle Tools", () => {
  let tempRoot: string;
  let store: ProjectStore;
  let ctx: Ctx;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "lienzo-project-test-"));
    store = createProjectStore(tempRoot);
    ctx = createCtx(tempRoot, fakeRenderer());
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("validates manifests with parseProjectManifest", () => {
    const valid = {
      slug: "brand-a",
      name: "Brand A",
      palette: { primary: "#ff0000" },
    };
    const res = parseProjectManifest(valid);
    expect(res.ok).toBe(true);

    const invalid = {
      slug: "INVALID SLUG!",
      name: "",
    };
    const badRes = parseProjectManifest(invalid);
    expect(badRes.ok).toBe(false);
  });

  it("creates, inspects, lists, updates, and deletes projects via ProjectStore", async () => {
    expect(await store.list()).toEqual([]);

    const created = await store.create("client-alpha", {
      name: "Client Alpha",
      palette: { primary: "#123456", custom: ["#abcdef"] },
      canvas: { width: 1200, height: 630, fps: 60, duration: 8 },
      fonts: [],
    });
    expect(created.slug).toBe("client-alpha");
    expect(created.name).toBe("Client Alpha");

    const details = await store.get("client-alpha");
    expect(details).toBeDefined();
    expect(details?.manifest.name).toBe("Client Alpha");
    expect(details?.assets).toEqual([]);
    expect(details?.presets).toEqual([]);
    expect(details?.scenes).toEqual([]);

    const list = await store.list();
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe("client-alpha");
    expect(list[0].palettePrimary).toBe("#123456");

    const updated = await store.update("client-alpha", {
      name: "Client Alpha Updated",
    });
    expect(updated.name).toBe("Client Alpha Updated");

    const deleted = await store.delete("client-alpha");
    expect(deleted).toBe(true);
    expect(await store.get("client-alpha")).toBeUndefined();
    expect(await store.list()).toEqual([]);
  });

  it("runs project_create, project_list, project_inspect, project_delete via service registry", async () => {
    // 1. project_create
    const createRes = await registry.call(
      "project_create",
      {
        project: "acme-corp",
        name: "Acme Corp",
        palette: { primary: "#0055ff" },
      },
      ctx,
    );
    expect(createRes.ok).toBe(true);

    // 2. project_list
    const listRes = await registry.call("project_list", {}, ctx);
    expect(listRes.ok).toBe(true);
    if (listRes.ok) {
      const items = listRes.value as Array<{ project: string; name: string }>;
      expect(items.some((i) => i.project === "acme-corp")).toBe(true);
    }

    // 3. project_inspect
    const inspectRes = await registry.call(
      "project_inspect",
      { project: "acme-corp" },
      ctx,
    );
    expect(inspectRes.ok).toBe(true);
    if (inspectRes.ok) {
      const val = inspectRes.value as { manifest: { name: string } };
      expect(val.manifest.name).toBe("Acme Corp");
    }

    // 4. project_delete
    const deleteRes = await registry.call(
      "project_delete",
      { project: "acme-corp" },
      ctx,
    );
    expect(deleteRes.ok).toBe(true);

    // Inspect non-existing
    const missingRes = await registry.call(
      "project_inspect",
      { project: "acme-corp" },
      ctx,
    );
    expect(missingRes.ok).toBe(false);
  });
});
