import { expect, it } from "vitest";
import { withElementDefaults } from "./fill-defaults.ts";
import { defaultScene } from "./model.ts";
import { parseScene } from "./schema.ts";

it("makes a scene with one partial text valid", () => {
  const data = {
    ...defaultScene(),
    elements: [{ id: "t", kind: "text", text: "Hola" }],
  };

  expect(parseScene(withElementDefaults(data))).toMatchObject({ ok: true });
});

it("fills group children from their kind's default", () => {
  const data = {
    ...defaultScene(),
    elements: [
      { id: "g", kind: "group", children: [{ id: "r", kind: "rect" }] },
    ],
  };

  expect(parseScene(withElementDefaults(data))).toMatchObject({ ok: true });
});
