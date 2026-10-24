import { describe, expect, it } from "vitest";
import type { Shot } from "./model.ts";
import { removeShot, setShot } from "./shots.ts";

const intro: Shot = { id: "intro", name: "intro", start: 0, end: 2 };

describe("setShot", () => {
  it("creates a shot named after its id", () => {
    const result = setShot([], { id: "intro", start: 0, end: 2 });

    expect(result).toEqual({ shots: [{ ...intro }] });
  });

  it("refuses to create a shot without start and end", () => {
    const result = setShot([], { id: "intro", start: 0 });

    expect(result).toMatchObject({
      error: { code: "invalid_input", path: "start" },
    });
  });

  it("updates only the given fields and keeps the input untouched", () => {
    const shots = [intro];

    const result = setShot(shots, { id: "intro", end: 3 });

    expect(result).toEqual({ shots: [{ ...intro, end: 3 }] });
    expect(shots[0]?.end).toBe(2);
  });

  it("merges the camera into the existing one", () => {
    const shots: Shot[] = [{ ...intro, camera: { x: 10, zoom: 2 } }];

    const result = setShot(shots, { id: "intro", camera: { zoom: 1.5 } });

    expect(result).toEqual({
      shots: [{ ...intro, camera: { x: 10, zoom: 1.5 } }],
    });
  });

  it("keeps the shots ordered by start", () => {
    const result = setShot([intro], { id: "late", start: 1, end: 4 });

    expect(result).toMatchObject({ shots: [{ id: "intro" }, { id: "late" }] });
  });

  it("re-sorts when a shot moves before another", () => {
    const shots: Shot[] = [intro, { id: "b", name: "b", start: 3, end: 5 }];

    const result = setShot(shots, { id: "intro", start: 6, end: 8 });

    expect(result).toMatchObject({ shots: [{ id: "b" }, { id: "intro" }] });
  });

  it("refuses an end before the start", () => {
    const result = setShot([intro], { id: "intro", end: -1 });

    expect(result).toMatchObject({
      error: { code: "invalid_input", path: "end" },
    });
  });
});

describe("removeShot", () => {
  it("removes the shot", () => {
    const result = removeShot([intro], "intro");

    expect(result).toEqual({ shots: [] });
  });

  it("fails on a shot that does not exist", () => {
    const result = removeShot([intro], "nope");

    expect(result).toMatchObject({ error: { code: "not_found", path: "id" } });
  });
});
