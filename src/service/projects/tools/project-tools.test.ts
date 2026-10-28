import { expect, it } from "vitest";
import { fails, toolSuite } from "../../contract/support.ts";
import { registry } from "../../tools/index.ts";

const suite = toolSuite();
const { call } = suite;

const TOO_BIG = /Demasiado grande/;

it("project_create makes the project id from the name alone", async () => {
  const r = await registry.call(
    "project_create",
    { name: "Café Norte" },
    suite.ctx(),
  );

  expect(r).toMatchObject({ ok: true, value: { project: "cafe-norte" } });
});

it("project_create fills the canvas fields not given", async () => {
  const r = await registry.call(
    "project_create",
    { name: "Vertical", canvas: { height: 1920 } },
    suite.ctx(),
  );

  expect(r).toMatchObject({
    ok: true,
    value: { canvas: { width: 1080, height: 1920, fps: 30, duration: 5 } },
  });
});

it("project_create of an existing project fails with exists", async () => {
  const r = await call("project_create", { name: "P" });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "exists", path: "project" },
  });
});

it("project_update fails on a canvas side above 7680", async () => {
  const r = await call("project_update", { canvas: { width: 20000 } });
  expect(r).toMatchObject(fails(TOO_BIG));
});

it("project_update notices a brand font weight that is not installed", async () => {
  const r = await call("project_update", {
    fonts: [{ family: "Inter", role: "body", weights: [400, 300] }],
  });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/«Inter».*pesos 300/)] },
  });
});

it("project_create with an existing id says to pass project", async () => {
  expect(await call("project_create", { name: "P" })).toMatchObject(
    fails(/pasa `project` con otro id/),
  );
});

it("project_inspect names scenes and presets without .json", async () => {
  await call("preset_save", { recipe: { name: "Mía", kind: "rect" } });
  const r = await call("project_inspect", {});
  expect(r).toMatchObject({
    ok: true,
    value: { scenes: ["s"], presets: ["mia"] },
  });
});
