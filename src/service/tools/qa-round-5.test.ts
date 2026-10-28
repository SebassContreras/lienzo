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
import { type Ctx, createCtx } from "../ctx.ts";
import { inspectLayout } from "../layout/layout.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "./index.ts";

/** Cases the fifth QA run reported, held at the tool boundary (073). */
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

it("names a nested element by its id path in a failing write", async () => {
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "a" } });
  await call("element_add", { scene: "s", kind: "rect", patch: { id: "b" } });
  const grouped = await call("element_group", { scene: "s", ids: ["a", "b"] });
  const g = (grouped as { value: { id: string } }).value.id;

  const r = await call("element_update", {
    scene: "s",
    id: `${g}/b`,
    patch: { w: -50 },
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      path: `elements.${g}/b.w`,
      message: expect.stringContaining(`elements.${g}/b.w:`),
    },
  });
});

it("finds a project preset by its display name", async () => {
  await call("preset_save", { recipe: { name: "Mi tarjeta", kind: "rect" } });

  const r = await call("preset_get", { name: "Mi tarjeta" });

  expect(r).toMatchObject({ ok: true, value: { source: "user" } });
});
