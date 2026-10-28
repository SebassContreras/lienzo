import { describe, expect, it } from "vitest";
import { revealLines } from "../components/text/reveal.ts";
import { animState } from "../engine/anim.ts";
import { EASINGS } from "../engine/easing.ts";
import {
  type Anim,
  defaultGroup,
  defaultRect,
  defaultScene,
} from "../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";
import {
  type AnimState,
  type Delta,
  DIRS,
  type DirName,
  LOOP_IDS,
  LOOPS,
  MOTION_IDS,
  MOTIONS,
  rest,
} from "./index.ts";

installCanvasFakes();
const { drawElements } = await import("../engine/render.ts");

const AMOUNTS = [0, 12, 80];
const SIDES = Object.keys(DIRS) as DirName[];

/** The state a delta leaves an element in, numbers only. */
function numbers(d: Delta): Record<string, number> {
  const s: AnimState = { ...rest(), ...d };
  return Object.fromEntries(
    Object.entries(s).filter(([, v]) => typeof v === "number"),
  ) as Record<string, number>;
}

function expectRest(d: Delta, msg: string) {
  const r = numbers(rest());
  for (const [k, v] of Object.entries(numbers(d)))
    expect(v, `${msg} ${k}`).toBeCloseTo(r[k] as number, 9);
}

/** Nothing of the element shows. */
const hidden = (d: Delta) =>
  (d.alpha ?? 1) * (d.progress ?? 1) * (d.reveal ?? 1) * (d.scale ?? 1) < 1e-9;

describe("the animation registry", () => {
  it("every kind is a pure function of its inputs", () => {
    for (const [id, def] of [
      ...Object.entries(MOTIONS),
      ...Object.entries(LOOPS),
    ]) {
      for (const p of [0, 0.13, 0.5, 0.87, 1]) {
        const a = def.fn(p, def.ease, 20, DIRS.left);
        const b = def.fn(p, def.ease, 20, DIRS.left);
        expect(a, id).toEqual(b);
        for (const v of Object.values(numbers(a)))
          expect(Number.isFinite(v), id).toBe(true);
      }
    }
  });

  it("attention kinds leave the element at rest at both ends, so loops close", () => {
    for (const id of LOOP_IDS) {
      const def = LOOPS[id];
      for (const a of AMOUNTS) {
        expectRest(def.fn(0, def.ease, a, DIRS.down), `${id} p=0 a=${a}`);
        expectRest(def.fn(1, def.ease, a, DIRS.down), `${id} p=1 a=${a}`);
      }
    }
  });

  it("attention kinds move the element somewhere in their cycle", () => {
    for (const id of LOOP_IDS) {
      const def = LOOPS[id];
      const moved = [0.1, 0.2, 0.3, 0.45, 0.6, 0.8].some((p) => {
        const s = numbers(def.fn(p, def.ease, 20, DIRS.down));
        const r = numbers(rest());
        return Object.keys(s).some(
          (k) => Math.abs((s[k] ?? 0) - (r[k] ?? 0)) > 1e-3,
        );
      });
      expect(moved, id).toBe(true);
    }
  });

  it("entrances end at rest and start hidden, from every side", () => {
    for (const id of MOTION_IDS) {
      const def = MOTIONS[id];
      for (const side of SIDES) {
        for (const a of AMOUNTS) {
          const msg = `${id} from ${side} a=${a}`;
          expectRest(def.fn(1, def.ease, a, DIRS[side]), msg);
          expect(hidden(def.fn(0, def.ease, a, DIRS[side])), msg).toBe(true);
        }
      }
    }
  });

  it("directional entrances come from the side they name", () => {
    for (const id of ["slide", "bounce", "back"] as const) {
      const def = MOTIONS[id];
      const at = (side: DirName) => def.fn(0.2, def.ease, 100, DIRS[side]);
      expect(at("down").dy, id).toBeGreaterThan(0);
      expect(at("up").dy, id).toBeLessThan(0);
      expect(at("left").dx, id).toBeLessThan(0);
      expect(at("right").dx, id).toBeGreaterThan(0);
    }
  });

  it("an exit of any entrance ends hidden and holds it", () => {
    const base = defaultRect().anim;
    for (const id of MOTION_IDS) {
      const anim: Anim = {
        ...base,
        out: { ...base.out, kind: id, delay: 1, duration: 0.5, from: "left" },
      };
      expect(animState(anim, 0.5, 4).alpha, `${id} before`).toBeGreaterThan(
        0.99,
      );
      for (const t of [1.5, 3])
        expect(hidden(animState(anim, t, 4)), `${id} t=${t}`).toBe(true);
    }
  });
});

describe("text reveal", () => {
  const lines = ["Hola mundo", "otra vez"];

  it("shows nothing at 0 and everything at 1", () => {
    for (const unit of ["char", "word", "line"] as const) {
      expect(revealLines(lines, 0, unit, true).map((l) => l.text)).toEqual([
        "",
        "",
      ]);
      expect(revealLines(lines, 1, unit, true).map((l) => l.text)).toEqual(
        lines,
      );
    }
  });

  it("counts units across lines in reading order", () => {
    // 4 words: half of them is the first line
    expect(revealLines(lines, 0.5, "word", false)).toEqual([
      { text: "Hola mundo" },
      { text: "" },
    ]);
    // 18 characters: 12 are the first line and 2 of the second
    expect(revealLines(lines, 12 / 18, "char", false)).toEqual([
      { text: "Hola mundo" },
      { text: "ot" },
    ]);
    expect(revealLines(lines, 0.5, "line", false)[1]).toEqual({ text: "" });
  });

  it("a soft reveal fades the next unit in; typewriter does not", () => {
    const soft = revealLines(lines, 0.375, "word", true);
    expect(soft[0]?.text).toBe("Hola ");
    expect(soft[0]?.partial?.text).toBe("mundo");
    expect(soft[0]?.partial?.alpha).toBeCloseTo(0.5, 9);
    expect(revealLines(lines, 0.375, "word", false)[0]?.partial).toBe(
      undefined,
    );
  });
});

describe("group stagger", () => {
  /** Every alpha set while drawing the group, in order. */
  function alphas(stagger: number, t: number): number[] {
    const g = defaultGroup();
    if (g.kind !== "group") throw new Error("not a group");
    g.children = [defaultRect(), defaultRect(), defaultRect()];
    g.anim.in = { ...g.anim.in, kind: "fade", delay: 0, duration: 1 };
    g.anim.in.easing = "linear";
    g.stagger = stagger;
    const ctx = new RecordingCtx();
    drawElements(ctx as never, [g], { ...defaultScene(), elements: [g] }, t);
    return ctx.log
      .filter((l) => l.startsWith("globalAlpha="))
      .map((l) => Number(l.slice("globalAlpha=(".length, -1)));
  }

  it("plays the group's entry on each child in turn", () => {
    const a = alphas(0.25, 0.5);
    // child i is at linear progress 0.5 − 0.25·i
    for (const v of [0.5, 0.25, 0]) expect(a, `alpha ${v}`).toContain(v);
  });

  it("without a stagger the group fades as a whole", () => {
    const a = alphas(0, 0.5);
    expect(a).toContain(0.5);
    expect(a).not.toContain(0.25);
  });
});

it("old kinds keep their default curves", () => {
  expect(MOTIONS.fade.ease).toBe(EASINGS["cubic-out"]);
  expect(MOTIONS.pop.ease).toBe(EASINGS["back-out"]);
  expect(LOOPS.float.ease).toBe(EASINGS.linear);
});
