import { describe, expect, it } from "vitest";
import { COMPONENTS } from "../index.ts";
import { SHAPE_KINDS, shapeFields } from "./descriptor.ts";

describe("SHAPE_KINDS", () => {
  it("lists exactly the kinds built from shapeFields", () => {
    const shapeKeys = Object.keys(shapeFields(1, 1));

    const built = COMPONENTS.filter((d) =>
      shapeKeys.every((k) => k in d.fields),
    ).map((d) => d.kind);

    expect([...SHAPE_KINDS].sort()).toEqual(built.sort());
  });
});
