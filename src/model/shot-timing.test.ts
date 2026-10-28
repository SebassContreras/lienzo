import { expect, it } from "vitest";
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
