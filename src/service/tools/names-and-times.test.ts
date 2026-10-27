import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import type { Scene } from "../../model/model.ts";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "./index.ts";

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
  expect(
    await call("scene_export", { scene: "s", format: "png", t: 50 }),
  ).toMatchObject({
    ok: false,
    error: { code: "invalid_time", path: "t" },
  });
  expect((await call("scene_preview", { scene: "s", t: 6 })).ok).toBe(true);
});

it("says when a name is stored under another one (069/D13)", async () => {
  const r = await call("scene_rename", { from: "s", to: "Main Scene/../x" });
  expect(r.ok && r.value).toMatchObject({ scene: "main-scene-x" });
  expect(r.ok && (r.value as { notices: string[] }).notices[0]).toContain(
    "main-scene-x",
  );
});

it("moves a shared shot to the group and notes mixed ones (069/D13)", async () => {
  const same = await call("element_group", { scene: "s", ids: ["a", "b"] });
  const got = await call("scene_get", { scene: "s" });
  const group = got.ok
    ? (got.value as Scene).elements.find(
        (e) => e.id === (same.ok && (same.value as { id: string }).id),
      )
    : undefined;
  expect(group?.shot).toBe("s1");
  const mixed = await call("element_group", {
    scene: "s",
    ids: [group?.id, "c"],
  });
  expect(
    mixed.ok && (mixed.value as { notices: string[] }).notices[0],
  ).toContain("tomas distintas");
});
