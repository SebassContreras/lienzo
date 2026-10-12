import { describe, expect, it } from "vitest";
import { EASINGS } from "../easing.ts";
import { hashOf, morphPairs } from "./cache.ts";
import { interpolate, spanAt } from "./morph.ts";
import { prepareMorph, RING_POINTS, signedArea } from "./morph-prep.ts";
import { parsePath, pathError } from "./parse.ts";

const SQUARE = "M0 0 H100 V100 H0 Z";
const SQUARE_CCW = "M0 0 V100 H100 V0 Z";
const SQUARE_SHIFTED = "M100 100 H0 V0 H100 Z";
const CIRCLE = "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z";
const RING = `${CIRCLE} M50 25 A25 25 0 1 0 50 75 A25 25 0 1 0 50 25 Z`;

describe("parsing (R5, R10)", () => {
  it("reads every command, absolute and relative, as cubics", () => {
    const d =
      "M0 0 L10 0 l0 10 H20 h5 V30 v5 C40 40 50 40 60 30 c5 0 10 5 10 10 S90 60 100 50 s10 10 20 0 Q130 40 140 50 q5 5 10 0 T170 50 t10 0 A10 10 0 0 1 200 50 a10 10 0 0 1 20 0 Z m10 10 l5 5 z";
    const subs = parsePath(d, "Forma 1");
    expect(subs).toHaveLength(2);
    expect(subs[0]?.closed).toBe(true);
    for (const sub of subs) {
      for (const c of sub.curves) expect(c).toHaveLength(8);
      // each curve starts where the previous one ended
      sub.curves.slice(1).forEach((c, i) => {
        const prev = sub.curves[i] as readonly number[];
        expect([c[0], c[1]]).toEqual([prev[6], prev[7]]);
      });
    }
    const first = subs[0]?.curves[0] as readonly number[];
    expect([first[6], first[7]]).toEqual([10, 0]);
  });

  it("names the shape when its path is invalid or empty", () => {
    expect(pathError("M0 0 L", "Forma 2")).toMatch(/^Forma 2: /);
    expect(pathError("", "Forma 3")).toMatch(/^Forma 3: /);
    expect(pathError(SQUARE, "Forma 1")).toBeUndefined();
  });
});

describe("morphing (R4–R8)", () => {
  const pts = (d: string) => parsePath(d, "x");

  it("pairs shapes with different point and subpath counts", () => {
    const pairs = prepareMorph(pts(CIRCLE), pts(RING));
    expect(pairs).toHaveLength(2);
    for (const p of pairs) {
      expect(p.a).toHaveLength(RING_POINTS * 2);
      expect(p.b).toHaveLength(RING_POINTS * 2);
    }
    // the hole has no partner: it grows from a single point
    const grown = pairs[1]?.a as number[];
    expect(new Set(grown.filter((_, i) => i % 2 === 0)).size).toBe(1);
  });

  it("does not twist: same winding and the nearest start", () => {
    const [pair] = prepareMorph(pts(SQUARE), pts(SQUARE_CCW));
    expect(Math.sign(signedArea(pair?.b as number[]))).toBe(
      Math.sign(signedArea(pair?.a as number[])),
    );
    const [shifted] = prepareMorph(pts(SQUARE), pts(SQUARE_SHIFTED));
    // the same square started elsewhere morphs without moving
    const a = shifted?.a as number[];
    const b = shifted?.b as number[];
    a.forEach((v, i) => expect(b[i]).toBeCloseTo(v, 6));
  });

  it("gives the same points for the same value, and closes a loop", () => {
    const pairs = morphPairs(SQUARE, CIRCLE, ["A", "B"]);
    const at = (m: number) => {
      const { k } = spanAt(m, 3, EASINGS["ease-in-out"]);
      return interpolate(pairs, k);
    };
    expect(at(0.4)).toEqual(at(0.4));
    // shapes [A, B, A]: the last shape is the first again, so the loop closes
    const sorted = (r: { pts: number[] }[]) =>
      r
        .flatMap((x) => x.pts)
        .map((v) => Math.round(v * 1e4) / 1e4)
        .sort((p, q) => p - q);
    const first = interpolate(morphPairs(SQUARE, CIRCLE, ["A", "B"]), 0);
    const last = interpolate(morphPairs(CIRCLE, SQUARE, ["B", "A"]), 1);
    expect(sorted(last)).toEqual(sorted(first));
  });

  it("picks the span between neighbouring shapes, clamped", () => {
    const linear = EASINGS.linear;
    expect(spanAt(0, 3, linear)).toEqual({ i: 0, k: 0 });
    expect(spanAt(1.25, 3, linear)).toEqual({ i: 1, k: 0.25 });
    expect(spanAt(9, 3, linear)).toEqual({ i: 1, k: 1 });
    expect(spanAt(0.5, 1, linear)).toEqual({ i: 0, k: 0 });
  });
});

describe("cache (R9)", () => {
  it("prepares a pair once and hands back the same arrays", () => {
    const a = morphPairs(SQUARE, RING, ["A", "B"]);
    expect(morphPairs(SQUARE, RING, ["A", "B"])).toBe(a);
    expect(hashOf(SQUARE)).not.toBe(hashOf(CIRCLE));
  });
});
