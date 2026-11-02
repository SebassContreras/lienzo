import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);
const counterOf = async () => {
  const r = (await call("scene_get", { scene: "s" })) as {
    value: { elements: { kind: string }[] };
  };
  return r.value.elements.find((el) => el.kind === "counter");
};

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-counter-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_create", { scene: "s" });
});

it("gives a counter added with no progress a count-up track", async () => {
  await call("element_add", { scene: "s", kind: "counter" });

  expect(await counterOf()).toMatchObject({
    tracks: {
      progress: [
        { t: 0, value: 0 },
        { t: 1.5, value: 1 },
      ],
    },
  });
});

it("keeps a counter given a progress value still", async () => {
  await call("element_add", {
    scene: "s",
    kind: "counter",
    patch: { progress: 0.5 },
  });

  expect(await counterOf()).not.toHaveProperty("tracks.progress");
});

it("gives a built counter with no progress a count-up track", async () => {
  await call("scene_build", {
    compact: { duration: 1, elements: [{ kind: "counter" }] },
    save: "s",
    overwrite: true,
  });

  expect(await counterOf()).toMatchObject({
    tracks: {
      progress: [
        { t: 0, value: 0 },
        { t: 1, value: 1 },
      ],
    },
  });
});

it("starts a new counter's count-up when its shot starts", async () => {
  await call("scene_build", {
    compact: {
      duration: 6,
      shots: [
        { id: "s1", start: 0, end: 3 },
        { id: "s2", start: 3, end: 6 },
      ],
      elements: [{ kind: "counter", shot: "s2" }],
    },
    save: "s",
    overwrite: true,
  });

  expect(await counterOf()).toMatchObject({
    tracks: {
      progress: [
        { t: 3, value: 0 },
        { t: 4.5, value: 1 },
      ],
    },
  });
});

it("ends an added counter's count-up with its shot", async () => {
  await call("scene_update", { scene: "s", patch: { duration: 6 } });
  await call("shot_set", {
    scene: "s",
    id: "s2",
    start: 3,
    end: 4,
  });

  await call("element_add", {
    scene: "s",
    kind: "counter",
    patch: { shot: "s2" },
  });

  expect(await counterOf()).toMatchObject({
    tracks: {
      progress: [
        { t: 3, value: 0 },
        { t: 4, value: 1 },
      ],
    },
  });
});

describe("group child counter shot timing (092/R1)", () => {
  it("times count-up from ancestor group's shot start when added with parent", async () => {
    await call("scene_update", { scene: "s", patch: { duration: 8 } });
    await call("shot_set", { scene: "s", id: "s2", start: 4, end: 8 });
    await call("element_add", {
      scene: "s",
      kind: "group",
      patch: { id: "g2", shot: "s2" },
    });
    await call("element_add", {
      scene: "s",
      kind: "counter",
      parent: "g2",
      patch: { id: "cnt" },
    });

    const res = (await call("scene_get", { scene: "s" })) as any;
    const group = res.value.elements.find((el: any) => el.id === "g2");
    const counter = group.children.find((el: any) => el.id === "cnt");

    expect(counter).toMatchObject({
      tracks: {
        progress: [
          { t: 4, value: 0 },
          { t: 5.5, value: 1 },
        ],
      },
    });
  });

  it("times preset tracks from ancestor group's shot start when added with parent", async () => {
    await call("scene_update", { scene: "s", patch: { duration: 8 } });
    await call("shot_set", { scene: "s", id: "s2", start: 4, end: 8 });
    await call("element_add", {
      scene: "s",
      kind: "group",
      patch: { id: "g2", shot: "s2" },
    });
    await call("element_add", {
      scene: "s",
      preset: "Barra de progreso",
      parent: "g2",
      patch: { id: "bar" },
    });

    const res = (await call("scene_get", { scene: "s" })) as any;
    const group = res.value.elements.find((el: any) => el.id === "g2");
    const bar = group.children.find((el: any) => el.id === "bar");

    expect(bar.tracks.value[0].t).toBe(4);
  });
});
