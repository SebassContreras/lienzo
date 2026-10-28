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

it("checks every opacity field of every kind as 0–1", () => {
  const unchecked = COMPONENTS.flatMap((d) =>
    uncheckedOpacities(d.kind, d.fields),
  );

  expect(unchecked).toEqual([]);
});

/** The names of every number field of every kind whose check has no lower bound. */
function unboundedNumbers(fields: Fields): string[] {
  return dataFields(fields).flatMap(([key, f]) => {
    if (f.type === "object") return unboundedNumbers(f.fields);
    const bounded = Number.isFinite(f.type === "number" ? f.bounds?.[0] : 0);
    return f.type === "number" && !bounded ? [key] : [];
  });
}

it("leaves only coordinates, angles, timing and counts with no lower bound", () => {
  const names = new Set(COMPONENTS.flatMap((d) => unboundedNumbers(d.fields)));

  // a new number field that may go below 0 joins this list on purpose
  expect([...names].sort()).toEqual([
    "amount",
    "angle",
    "aspect",
    "bend",
    "count",
    "cycles",
    "delay",
    "flow",
    "from",
    "highlightScale",
    "hole",
    "letterSpacing",
    "lineHeight",
    "maxWidth",
    "rotX",
    "rotY",
    "rotZ",
    "seed",
    "spacing",
    "speed",
    "spin",
    "strength",
    "targetX",
    "targetY",
    "targetZ",
    "to",
    "typingSpeed",
    "wordsPerWindow",
    "x",
    "y",
    "z",
  ]);
});
