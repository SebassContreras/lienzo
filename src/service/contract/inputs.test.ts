import { describe, expect, it } from "vitest";
import { z } from "zod";
import { registry } from "../tools/index.ts";
import {
  baseInput,
  inputSchemaOf,
  invalidVariants,
  structuredKeys,
} from "./inputs.ts";

const schemaOf = (shape: z.ZodRawShape) => inputSchemaOf(z.object(shape));

describe("the base input", () => {
  it("has every required key with a value of its type and none of the optional ones", () => {
    const schema = schemaOf({
      name: z.string().min(3),
      count: z.number().int().min(2),
      on: z.boolean(),
      list: z.array(z.string()),
      kind: z.enum(["a", "b"]),
      note: z.string().optional(),
    });

    expect(baseInput(schema)).toEqual({
      name: "xxx",
      count: 2,
      on: false,
      list: [],
      kind: "a",
    });
  });

  it("takes the values given for the keys the schema declares, optional or not", () => {
    const schema = schemaOf({ project: z.string().optional(), id: z.string() });

    expect(baseInput(schema, { project: "p", nothing: 1 })).toEqual({
      id: "x",
      project: "p",
    });
  });

  it("stays inside a numeric range", () => {
    const schema = schemaOf({ fps: z.number().int().min(1).max(60) });

    expect(baseInput(schema)).toEqual({ fps: 1 });
  });
});

describe("the invalid variants", () => {
  const schema = schemaOf({
    scene: z.string().min(1),
    fps: z.number().int().min(1).max(60),
    mode: z.enum(["static", "video"]),
    keep: z.boolean().optional(),
  });
  const variants = invalidVariants(schema, baseInput(schema));
  const byLabel = (label: string) => variants.find((v) => v.label === label);

  it("remove a required key and set it to null", () => {
    expect(byLabel("scene missing")?.input).toEqual({ fps: 1, mode: "static" });
    expect(byLabel("scene null")?.input).toMatchObject({ scene: null });
  });

  it("give a wrong type, an unknown option and the edges outside a range", () => {
    expect(byLabel("scene of the wrong type")?.input).toMatchObject({
      scene: 5,
    });
    expect(byLabel("mode an unknown option")?.input).toMatchObject({
      mode: "__no_such_option__",
    });
    expect(byLabel("fps below its minimum")?.input).toMatchObject({ fps: 0 });
    expect(byLabel("fps above its maximum")?.input).toMatchObject({ fps: 61 });
    expect(byLabel("fps not a whole number")?.input).toMatchObject({
      fps: 1.5,
    });
    expect(byLabel("scene empty")?.input).toMatchObject({ scene: "" });
  });

  it("break an optional key too, as a wrong type", () => {
    expect(byLabel("keep of the wrong type")?.input).toMatchObject({
      keep: "x",
    });
  });

  it("add one input that breaks two different keys and names both", () => {
    const both = variants.find((v) => v.paths.length === 2);

    expect(both?.paths).toEqual(["scene", "fps"]);
    expect(both?.input).toEqual({ mode: "static" });
  });

  it("each differ from the base input", () => {
    const base = baseInput(schema);

    expect(
      variants.filter((v) => JSON.stringify(v.input) === JSON.stringify(base)),
    ).toEqual([]);
  });
});

describe("the required object and array keys", () => {
  it("are the ones a JSON string may stand for", () => {
    const schema = schemaOf({
      patch: z.record(z.string(), z.unknown()),
      ids: z.array(z.string()),
      id: z.string(),
    });

    expect(structuredKeys(schema)).toEqual(["patch", "ids"]);
  });
});

describe("every registered tool's input schema", () => {
  it.each(registry.tools.map((tool) => tool.name))(
    "%s gives a base input and variants that differ from it",
    (name) => {
      const tool = registry.get(name);
      const schema = inputSchemaOf(tool?.input ?? z.object({}));
      const base = baseInput(schema);
      const variants = invalidVariants(schema, base);
      const sameAsBase = variants.filter(
        (v) => JSON.stringify(v.input) === JSON.stringify(base),
      );

      expect(sameAsBase).toEqual([]);
      expect(variants.length).toBeGreaterThanOrEqual(
        (schema.required ?? []).length * 2,
      );
    },
  );
});
