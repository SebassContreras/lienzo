import { expect, it } from "vitest";
import { toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

it("scene_export lists an asset the project lacks", async () => {
  await call("element_add", {
    scene: "s",
    kind: "image",
    patch: { id: "pic", src: "missing.png" },
  });
  const r = await call("scene_export", { scene: "s", format: "png" });
  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringMatching(/missing\.png.*marcador/)] },
  });
});

it("scene_preview lists an asset the project lacks and a changed extension", async () => {
  await call("element_add", {
    scene: "s",
    kind: "image",
    patch: { id: "pic", src: "missing.png" },
  });
  const r = await call("scene_preview", { scene: "s", out: "p.jpg" });
  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: [
        expect.stringMatching(/extensión sigue al formato real/),
        expect.stringMatching(/missing\.png/),
      ],
    },
  });
});
