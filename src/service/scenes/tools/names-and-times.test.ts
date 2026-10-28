import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-069-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { name: "P" });
  await call("scene_build", {
    save: "s",
    compact: {
      duration: 6,
      shots: [
        { id: "s1", start: 0, end: 3 },
        { id: "s2", start: 3, end: 6 },
      ],
      elements: [
        { kind: "rect", id: "a", shot: "s1" },
        { kind: "rect", id: "b", shot: "s1" },
        { kind: "rect", id: "c", shot: "s2" },
      ],
    },
  });
});

it("rejects a still past the scene's end (069/D9)", async () => {
  const r = await call("scene_export", { scene: "s", format: "png", t: 50 });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "invalid_time", path: "t" },
  });
});

it("renders a still at the scene's last moment (069/D9)", async () => {
  const r = await call("scene_preview", { scene: "s", t: 6 });

  expect(r).toMatchObject({ ok: true });
});

it("says when a name is stored under another one (069/D13)", async () => {
  const r = await call("scene_rename", { from: "s", to: "Main Scene/../x" });

  expect(r).toMatchObject({
    ok: true,
    value: {
      scene: "main-scene-x",
      notices: [expect.stringContaining("main-scene-x")],
    },
  });
});

it("moves a shared shot to the group (069/D13)", async () => {
  const grouped = await call("element_group", { scene: "s", ids: ["a", "b"] });
  const got = await call("scene_get", { scene: "s" });

  expect(grouped).toMatchObject({ ok: true, value: { notices: [] } });
  expect(got).toMatchObject({
    ok: true,
    value: {
      elements: expect.arrayContaining([
        expect.objectContaining({ kind: "group", shot: "s1" }),
      ]),
    },
  });
});

it("notes a group of elements from different shots (069/D13)", async () => {
  const r = await call("element_group", { scene: "s", ids: ["b", "c"] });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("tomas distintas")] },
  });
});
