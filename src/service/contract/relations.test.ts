/**
 * What must hold between writers (082/R7): the same content through different tools ends the
 * same, and a pair of tools that undo each other leaves the scene as it was.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { must, type Sandbox, sandbox } from "./harness.ts";

vi.setConfig({ testTimeout: 30_000 });

let box: Sandbox;
beforeAll(async () => {
  box = await sandbox();
});
afterAll(() => box.ctx.dispose?.());

const call = (tool: string, input: Record<string, unknown>) =>
  must(box.ctx, tool, input);
const elementsOf = async (scene: string) =>
  (await call("scene_get", { scene, full: true })).elements as Record<
    string,
    unknown
  >[];

const BOX = { x: 100, y: 120, w: 240, h: 80 };
const TEXT = { x: 40, y: 400, text: "Hola" };

describe("one scene written by three tools", () => {
  it("keeps every field the writer was given, through scene_build, scene_create and element_add", async () => {
    await call("scene_build", {
      save: "viaBuild",
      compact: {
        elements: [
          { kind: "rect", id: "a", ...BOX },
          { kind: "text", id: "b", ...TEXT },
        ],
      },
    });
    await call("scene_create", {
      scene: "viaCreate",
      data: {
        elements: [
          { id: "a", kind: "rect", ...BOX },
          { id: "b", kind: "text", ...TEXT },
        ],
      },
    });
    await call("scene_create", { scene: "viaAdd" });
    await call("element_add", {
      scene: "viaAdd",
      kind: "rect",
      patch: { id: "a", ...BOX },
    });
    await call("element_add", {
      scene: "viaAdd",
      kind: "text",
      patch: { id: "b", ...TEXT },
    });

    for (const scene of ["viaBuild", "viaCreate", "viaAdd"]) {
      expect(await elementsOf(scene), scene).toMatchObject([
        { id: "a", kind: "rect", ...BOX },
        { id: "b", kind: "text", ...TEXT },
      ]);
    }
  });
});

describe("reading a scene and writing it back", () => {
  it("gives the same scene when scene_get's result is the data of a new scene", async () => {
    await call("scene_create", {
      scene: "src",
      data: { shots: [{ id: "s1", start: 0, end: 2 }] },
    });
    await call("element_add", {
      scene: "src",
      kind: "rect",
      patch: { id: "a", ...BOX, shot: "s1" },
    });
    await call("element_add", {
      scene: "src",
      kind: "text",
      patch: { id: "b", ...TEXT },
    });
    await call("element_group", { scene: "src", ids: ["a", "b"], id: "g" });
    await call("scene_update", {
      scene: "src",
      patch: {
        symbols: {
          chip: {
            w: 50,
            h: 50,
            children: [{ id: "d", kind: "ellipse", w: 20, h: 20 }],
          },
        },
      },
    });

    const original = await call("scene_get", { scene: "src", full: true });
    await call("scene_create", { scene: "copy", data: original });

    expect(await call("scene_get", { scene: "copy", full: true })).toEqual(
      original,
    );
  });
});

describe("grouping and ungrouping", () => {
  it("give back the same elements in the same order when the members are next to each other", async () => {
    await call("scene_create", { scene: "grp" });
    for (const id of ["r1", "r2", "r3"]) {
      await call("element_add", {
        scene: "grp",
        kind: "rect",
        patch: { id, ...BOX },
      });
    }
    const before = await elementsOf("grp");

    await call("element_group", { scene: "grp", ids: ["r1", "r2"], id: "g" });
    await call("element_ungroup", { scene: "grp", id: "g" });

    expect(await elementsOf("grp")).toEqual(before);
  });

  it("keep the members' own draw order whatever order their ids were given in", async () => {
    await call("scene_create", { scene: "grp2" });
    for (const id of ["r1", "r2", "r3"]) {
      await call("element_add", {
        scene: "grp2",
        kind: "rect",
        patch: { id, ...BOX },
      });
    }

    await call("element_group", { scene: "grp2", ids: ["r2", "r1"], id: "g" });
    await call("element_ungroup", { scene: "grp2", id: "g" });

    expect((await elementsOf("grp2")).map((e) => e.id)).toEqual([
      "r1",
      "r2",
      "r3",
    ]);
  });
});

describe("renaming a scene and back", () => {
  it("leaves the scene and the list of scenes as they were", async () => {
    await call("scene_create", {
      scene: "ren",
      data: { elements: [{ id: "a", kind: "rect", ...BOX }] },
    });
    const before = await call("scene_get", { scene: "ren", full: true });
    const listed = await call("scene_list", {});

    await call("scene_rename", { from: "ren", to: "ren2" });
    await call("scene_rename", { from: "ren2", to: "ren" });

    expect(await call("scene_get", { scene: "ren", full: true })).toEqual(
      before,
    );
    expect(await call("scene_list", {})).toEqual(listed);
  });
});

describe("an update applied twice", () => {
  it("leaves an element as one application did", async () => {
    await call("scene_create", {
      scene: "upd",
      data: { elements: [{ id: "a", kind: "rect", ...BOX }] },
    });

    await call("element_update", {
      scene: "upd",
      id: "a",
      patch: { x: 7, opacity: 0.5 },
    });
    const once = await elementsOf("upd");
    await call("element_update", {
      scene: "upd",
      id: "a",
      patch: { x: 7, opacity: 0.5 },
    });

    expect(await elementsOf("upd")).toEqual(once);
  });

  it("leaves the scene's settings as one application did", async () => {
    await call("scene_create", { scene: "upd2" });

    await call("scene_update", {
      scene: "upd2",
      patch: { fps: 24, duration: 5 },
    });
    const once = await call("scene_get", { scene: "upd2", full: true });
    await call("scene_update", {
      scene: "upd2",
      patch: { fps: 24, duration: 5 },
    });

    expect(await call("scene_get", { scene: "upd2", full: true })).toEqual(
      once,
    );
  });
});
