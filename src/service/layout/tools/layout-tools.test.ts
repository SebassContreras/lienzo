import { expect, it } from "vitest";
import { fails, toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

it("scene_inspect_layout takes scene_get's sparse result as data", async () => {
  const got = (await call("scene_get", { scene: "s" })) as { value: unknown };

  const r = await call("scene_inspect_layout", { data: got.value });

  expect(r).toMatchObject({ ok: true, value: { boxes: expect.any(Array) } });
});

it("scene_inspect_layout fails when given scene and data", async () => {
  const r = await call("scene_inspect_layout", {
    scene: "s",
    data: { elements: [] },
  });
  expect(r).toMatchObject(fails(/no ambos/));
});

it("scene_inspect_layout fails for a time past the duration, at times.N", async () => {
  const r = await call("scene_inspect_layout", { scene: "s", times: [0, 99] });
  expect(r).toMatchObject({
    ok: false,
    error: { code: "invalid_time", path: "times.1" },
  });
});

it("scene_inspect_layout reports unknown_shot at the first requested time", async () => {
  const data = { elements: [{ id: "q", kind: "rect", shot: "nope" }] };
  const r = await call("scene_inspect_layout", { data, times: [2] });
  expect(r).toMatchObject({
    ok: true,
    value: {
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "unknown_shot", t: 2 }),
      ]),
    },
  });
});
