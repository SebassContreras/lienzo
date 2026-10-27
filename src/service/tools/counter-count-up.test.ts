import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "./index.ts";

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

it("gives a counter added with no progress a count-up track (071/D5)", async () => {
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

it("keeps a counter given a progress value still (071/D5)", async () => {
  await call("element_add", {
    scene: "s",
    kind: "counter",
    patch: { progress: 0.5 },
  });

  expect(await counterOf()).not.toHaveProperty("tracks.progress");
});

it("gives a built counter with no progress a count-up track (071/D5)", async () => {
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
