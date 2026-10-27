import { expect, it } from "vitest";
import { COMPONENTS } from "../index.ts";
import { dataFields, type Fields } from "./field.ts";

/** `kind.path` of every number field named like an opacity whose check is not 0–1. */
function uncheckedOpacities(prefix: string, fields: Fields): string[] {
  return dataFields(fields).flatMap(([key, f]) => {
    const path = `${prefix}.${key}`;
    if (f.type === "object") return uncheckedOpacities(path, f.fields);
    const opacity = f.type === "number" && /opacity/i.test(key);
    const checked = opacity && f.bounds?.[0] === 0 && f.bounds?.[1] === 1;
    return opacity && !checked ? [path] : [];
  });
}

it("checks every opacity field of every kind as 0–1 (078/R1)", () => {
  const unchecked = COMPONENTS.flatMap((d) =>
    uncheckedOpacities(d.kind, d.fields),
  );

  expect(unchecked).toEqual([]);
});
