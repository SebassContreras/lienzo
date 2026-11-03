import { describe, expect, it, test } from "vitest";
import { defaultGroup, defaultRect, type Element } from "./model.ts";
import { rebindShot, shiftTracks } from "./shot-timing.ts";

const shots = [
  { id: "s1", start: 0 },
  { id: "s2", start: 3 },
];
const key = (t: number, value: number) => ({
  t,
  value,
  easing: "auto" as const,
});
const animated = (shot?: string): Element => ({
  ...defaultRect(),
  id: "r",
  ...(shot ? { shot } : {}),
  tracks: { x: [key(0, 0), key(2, 100)] },
});

it("moves an element's tracks to the start of the shot it is bound to", () => {
  const { el, delta } = rebindShot(animated("s1"), "s2", shots);

  expect(delta).toBe(3);
  expect(el).toMatchObject({ shot: "s2", tracks: { x: [{ t: 3 }, { t: 5 }] } });
});

it("moves an unbound element's tracks back to 0", () => {
  const bound = rebindShot(animated(), "s2", shots).el;

  const { el } = rebindShot(bound, undefined, shots);

  expect(el.shot).toBeUndefined();
  expect(el.tracks).toEqual({ x: [key(0, 0), key(2, 100)] });
});

it("moves a group's children's tracks with the group", () => {
  const group: Element = { ...defaultGroup(), id: "g", children: [animated()] };

  const { el } = rebindShot(group, "s2", shots);

  expect(el).toMatchObject({
    children: [{ tracks: { x: [{ t: 3 }, { t: 5 }] } }],
  });
});

it("moves a track's until with its keys", () => {
  const tracks = {
    x: { keys: [key(0, 0), key(1, 5)], repeat: "loop" as const, until: 2 },
  };

  expect(shiftTracks(tracks, 3)).toEqual({
    x: { keys: [key(3, 0), key(4, 5)], repeat: "loop", until: 5 },
  });
});

it("lands keys pushed below 0 on 0, keeping the later one", () => {
  const tracks = { x: [key(0, 0), key(1, 5), key(4, 9)] };

  expect(shiftTracks(tracks, -2)).toEqual({ x: [key(0, 5), key(2, 9)] });
});

describe("rebindShot shifts anim.in and anim.out delays (094/R4)", () => {
  test.each([
    [
      "shifts anim.in.delay and anim.out.delay forward when shot moves forward",
      {
        fromShot: "s1", // start 0
        toShot: "s2",   // start 3 (delta = +3)
        anim: {
          in: { kind: "fade" as const, delay: 0.5, duration: 0.5, from: "left" as const, easing: "linear" as const, amount: 0 },
          out: { kind: "fade" as const, delay: 2.0, duration: 0.5, from: "left" as const, easing: "linear" as const, amount: 0 },
        },
      },
      {
        expectedDelta: 3,
        expectedInDelay: 3.5,
        expectedOutDelay: 5.0,
      },
    ],
    [
      "shifts anim delays backward and bounds at 0",
      {
        fromShot: "s2", // start 3
        toShot: "s1",   // start 0 (delta = -3)
        anim: {
          in: { kind: "fade" as const, delay: 2.0, duration: 0.5, from: "left" as const, easing: "linear" as const, amount: 0 },
          out: { kind: "fade" as const, delay: 5.0, duration: 0.5, from: "left" as const, easing: "linear" as const, amount: 0 },
        },
      },
      {
        expectedDelta: -3,
        expectedInDelay: 0,
        expectedOutDelay: 2.0,
      },
    ],
    [
      "unbinding moves anim delays back to 0-origin",
      {
        fromShot: "s2", // start 3
        toShot: undefined, // origin 0 (delta = -3)
        anim: {
          in: { kind: "fade" as const, delay: 4.5, duration: 0.5, from: "left" as const, easing: "linear" as const, amount: 0 },
        },
      },
      {
        expectedDelta: -3,
        expectedInDelay: 1.5,
      },
    ],
  ])(
    "%s",
    (
      _name,
      { fromShot, toShot, anim },
      expected: { expectedDelta: number; expectedInDelay?: number; expectedOutDelay?: number },
    ) => {
      const { expectedDelta, expectedInDelay, expectedOutDelay } = expected;
      const el: Element = {
        ...defaultRect(),
        id: "r",
        ...(fromShot ? { shot: fromShot } : {}),
        anim: {
          ...defaultRect().anim,
          ...anim,
        },
      };
      const result = rebindShot(el, toShot, shots);
      expect(result.delta).toBe(expectedDelta);
      if (expectedInDelay !== undefined) {
        expect(result.el.anim?.in?.delay).toBe(expectedInDelay);
      }
      if (expectedOutDelay !== undefined) {
        expect(result.el.anim?.out?.delay).toBe(expectedOutDelay);
      }
    },
  );
});
