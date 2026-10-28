import { expect, it } from "vitest";
import { fails, toolSuite } from "../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

it("a tool given a key it does not take lists its parameters", async () => {
  const r = await call("element_move", { scene: "s", id: "r", position: 2 });

  expect(r).toMatchObject(
    fails(/«position» no es un parámetro de element_move \(parámetros: .*«to»/),
  );
});

it("tells a value below its range in Spanish", async () => {
  const r = await call("element_update", {
    scene: "s",
    id: "r",
    patch: { w: -5 },
  });

  expect(r).toMatchObject(fails(/Demasiado pequeño/));
});
