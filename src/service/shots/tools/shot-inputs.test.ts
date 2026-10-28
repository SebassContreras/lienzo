import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
type Result =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; path: string } };

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx) as Promise<Result>;

const value = async (name: string, input: Record<string, unknown>) => {
  const r = await call(name, input);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa6-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", {
    name: "P",
    canvas: { width: 1080, height: 1920, fps: 30, duration: 6 },
  });
});

const twoRects = async () => {
  await value("scene_create", { scene: "s" });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "a" } });
  await value("element_add", { scene: "s", kind: "rect", patch: { id: "b" } });
};

it("takes camera keyframes without easing in shot_set, as scene_build does", async () => {
  await value("scene_create", { scene: "s" });

  const r = await call("shot_set", {
    scene: "s",
    id: "s1",
    start: 0,
    end: 3,
    camera: {
      tracks: {
        zoom: [
          [0, 1],
          [3, 1.2],
        ],
      },
    },
  });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("notes camera keyframes outside their shot, as times are scene time", async () => {
  await value("scene_create", { scene: "s" });

  const out = await value("shot_set", {
    scene: "s",
    id: "s2",
    start: 3,
    end: 6,
    camera: {
      tracks: {
        zoom: [
          [0, 1],
          [3, 1.2],
        ],
      },
    },
  });

  expect(out.notices).toEqual([expect.stringContaining("zoom en 0s")]);
});

it("lists the easings when one is unknown", async () => {
  const r = await call("scene_build", {
    compact: {
      elements: [
        {
          kind: "rect",
          tracks: {
            x: [
              [0, 0, "wobbly"],
              [1, 10],
            ],
          },
        },
      ],
    },
  });

  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringContaining("ease-out") },
  });
});

it("lists a track's keyframe times when none is at t", async () => {
  await twoRects();
  await value("keyframe_set", {
    scene: "s",
    id: "a",
    path: "x",
    t: 1,
    value: 10,
  });

  const r = await call("keyframe_remove", {
    scene: "s",
    id: "a",
    path: "x",
    t: 2,
  });

  expect(r).toMatchObject({
    ok: false,
    error: { message: expect.stringContaining("1s") },
  });
});
