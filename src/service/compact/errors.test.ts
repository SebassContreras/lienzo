import { expect, it } from "vitest";
import { CompactSceneSchema } from "../../model/compact.ts";
import { unknownVoiceHint } from "../speech/local-adapter.ts";
import { expandScene } from "./expand.ts";

it("takes list items as an array of lines (069/D12)", async () => {
  const compact = CompactSceneSchema.parse({
    elements: [{ kind: "list", items: ["Uno", "Dos"] }],
  });
  const { scene } = await expandScene(compact);
  expect(scene.elements[0]).toMatchObject({ items: "Uno\nDos" });
});

it("reports every missing preset with its path (069/D12)", async () => {
  const run = expandScene(
    { elements: [{ preset: "a" }, { kind: "rect" }, { preset: "b" }] } as never,
    { findPreset: async () => undefined },
  );
  await expect(run).rejects.toThrow(
    /^elements\.0\.preset: .*«a»\nelements\.2\.preset: .*«b»$/,
  );
});

it("lists the voices for an unknown one, mixes included (069/D12)", () => {
  expect(unknownVoiceHint("af_bella+am_adam(0.5)")).toBe("");
  expect(unknownVoiceHint("zz_nope")).toContain("af_heart");
});

it("fails on an unknown size at its path instead of building a square (074/R1)", async () => {
  const run = expandScene({ size: "potato", elements: [] });
  await expect(run).rejects.toThrow(/^size: Tamaño «potato»/);
});
