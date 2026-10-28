import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { isElementActiveInShot } from "../../engine/shots.ts";
import {
  defaultRect,
  defaultScene,
  type Scene,
  type Shot,
} from "../../model/model.ts";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { inspectLayout } from "../layout/layout.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

let ctx: Ctx;

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa5-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
});

const shots: Shot[] = [
  { id: "s1", name: "s1", start: 0, end: 3 },
  { id: "s2", name: "s2", start: 3, end: 6 },
];

const inShot = (shot: string) => ({ ...defaultRect(), id: shot, shot });

it("gives the instant of a cut to the shot that starts there", () => {
  expect(isElementActiveInShot(inShot("s1"), 3, shots, 6)).toBe(false);
  expect(isElementActiveInShot(inShot("s2"), 3, shots, 6)).toBe(true);
});

it("keeps the last shot on the scene's final instant", () => {
  expect(isElementActiveInShot(inShot("s2"), 6, shots, 6)).toBe(true);
});

it("reports no overlap between two shots at the instant of their cut", () => {
  const box = { x: 100, y: 100, w: 200, h: 200 };
  const scene: Scene = {
    ...defaultScene(),
    duration: 6,
    shots,
    elements: [
      { ...defaultRect(), ...box, id: "a", shot: "s1" },
      { ...defaultRect(), ...box, id: "cnt", shot: "s2" },
    ],
  };

  const overlaps = inspectLayout(scene, [3]).filter(
    (d) => d.code === "shape_overlap",
  );

  expect(overlaps).toEqual([]);
});
