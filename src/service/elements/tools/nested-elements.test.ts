import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Element, Scene } from "../../../model/model.ts";
import { parseScene } from "../../../model/schema.ts";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const call = (name: string, input: unknown) => h.call(name, input);

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

describe("nested element tools and group parent insertion", () => {
  it("adds elements inside nested groups with `parent` and edits, moves, animates and removes them by id or slash path", async () => {
    await ok("scene_build", {
      compact: {
        size: "1080x1080",
        duration: 4,
        elements: [
          {
            id: "shot-1",
            kind: "group",
            w: 400,
            h: 200,
            cw: 400,
            ch: 200,
            children: [
              { id: "s1-bg", kind: "rect", x: 0, y: 0, w: 400, h: 200 },
            ],
          },
        ],
      },
      save: "shots",
    });

    const added = await ok("element_add", {
      scene: "shots",
      kind: "rect",
      parent: "shot-1",
      patch: { w: 80, h: 40 },
    });
    const carId = added.id as string;

    let scene = await onDisk("shots");
    let group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual(["s1-bg", carId]);
    const car = group.children[1] as Extract<Element, { kind: "rect" }>;
    expect({ x: car.x, y: car.y }).toEqual({
      x: (400 - 80) / 2,
      y: (200 - 40) / 2,
    });

    await ok("element_update", {
      scene: "shots",
      id: `shot-1/${carId}`,
      patch: { x: 25 },
    });
    await ok("keyframe_set", {
      scene: "shots",
      id: carId,
      path: "x",
      t: 0,
      value: 25,
    });
    await ok("keyframe_set", {
      scene: "shots",
      id: `shot-1/${carId}`,
      path: "x",
      t: 2,
      value: 200,
    });
    await ok("keyframe_remove", {
      scene: "shots",
      id: carId,
      path: "x",
      t: 0,
    });
    await ok("element_move", {
      scene: "shots",
      id: `shot-1/${carId}`,
      to: "back",
    });

    scene = await onDisk("shots");
    group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual([carId, "s1-bg"]);
    expect((group.children[0] as { x: number }).x).toBe(25);
    expect(group.children[0]?.tracks?.x).toEqual([
      { t: 2, value: 200, easing: "auto" },
    ]);

    await ok("element_remove", {
      scene: "shots",
      id: `shot-1/${carId}`,
    });
    scene = await onDisk("shots");
    group = scene.elements[0] as Extract<Element, { kind: "group" }>;
    expect(group.children.map((c) => c.id)).toEqual(["s1-bg"]);
  });

  it("rejects `element_add` when `parent` does not exist or is not a group and leaves the scene unchanged (051/R2)", async () => {
    await ok("scene_create", { scene: "flat" });
    const { id: rectId } = await ok("element_add", {
      scene: "flat",
      kind: "rect",
    });
    const before = await onDisk("flat");

    const missingParent = await call("element_add", {
      scene: "flat",
      kind: "rect",
      parent: "no-such-group",
    });
    expect(missingParent).toMatchObject({
      ok: false,
      error: { code: "not_found", path: "parent" },
    });

    const nonGroupParent = await call("element_add", {
      scene: "flat",
      kind: "rect",
      parent: rectId,
    });
    expect(nonGroupParent).toMatchObject({
      ok: false,
      error: { code: "not_a_group", path: "parent" },
    });

    expect(await onDisk("flat")).toEqual(before);
  });

  it("sets and clears track repeat, until, and step/hold easings via keyframe_set and scene_build (052/R3, R4)", async () => {
    await ok("scene_build", {
      compact: {
        size: "1080x1080",
        duration: 6,
        elements: [
          {
            id: "wheel",
            kind: "rect",
            tracks: {
              "@rotate": {
                keys: [
                  [0, 0, "linear"],
                  [1, 360],
                ],
                repeat: "loop",
                until: 4,
              },
            },
          },
        ],
      },
      save: "loop-scene",
    });

    let scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual({
      keys: [
        { t: 0, value: 0, easing: "linear" },
        { t: 1, value: 360, easing: "auto" },
      ],
      repeat: "loop",
      until: 4,
    });

    // Update repeat to pingpong and add a keyframe with step easing while keeping until
    await ok("keyframe_set", {
      scene: "loop-scene",
      id: "wheel",
      path: "@rotate",
      t: 0,
      value: 15,
      easing: "step",
      repeat: "pingpong",
    });
    scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual({
      keys: [
        { t: 0, value: 15, easing: "step" },
        { t: 1, value: 360, easing: "auto" },
      ],
      repeat: "pingpong",
      until: 4,
    });

    // Clear repeat ("none") and until (null) without modifying keyframes
    await ok("keyframe_set", {
      scene: "loop-scene",
      id: "wheel",
      path: "@rotate",
      repeat: "none",
      until: null,
    });
    scene = await onDisk("loop-scene");
    expect(scene.elements[0]?.tracks?.["@rotate"]).toEqual([
      { t: 0, value: 15, easing: "step" },
      { t: 1, value: 360, easing: "auto" },
    ]);
  });
});
