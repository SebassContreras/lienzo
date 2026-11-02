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

it("background_set suggests patch when an unknown object parameter is passed (093/R5)", async () => {
  const r = await call("background_set", {
    scene: "s",
    values: { color: "#0F172A" },
  });

  expect(r).toMatchObject(fails(/¿van dentro de «patch»\?/));
});

it("background_set refinement message reads Indica preset o patch (093/R5)", async () => {
  const r = await call("background_set", {
    scene: "s",
  });

  expect(r).toMatchObject(fails(/Indica preset o patch/));
});
