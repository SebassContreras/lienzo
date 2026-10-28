/**
 * Where a component's draw function puts its text (080/D15). The draw runs against a
 * context that keeps the transform, measures with `measureTextWidth` and records the box of
 * every `fillText`/`strokeText`; drawing is the one place each kind lays its text out, so
 * nothing here knows about bubbles, code or steps.
 */

import { descriptorOf } from "../components/index.ts";
import { rest } from "../animations/index.ts";
import type { Box } from "../engine/geometry.ts";
import {
  applyToPoint,
  IDENTITY,
  type Matrix,
  multiply,
  rotation,
  scaling,
  translation,
} from "../engine/matrix.ts";
import type { Ctx } from "../engine/paint.ts";
import { measureTextWidth, type MeasureStyle } from "../engine/text-measure.ts";
import type { Element, Scene } from "../model/model.ts";

export type TextExtent = { text: string; box: Box };

/** Any call or property the draw functions reach for that the recorder does not model. */
const sink: unknown = new Proxy(() => undefined, {
  get: (_t, key) => (key === Symbol.toPrimitive ? () => 0 : sink),
  apply: () => sink,
  construct: () => sink as object,
});

/** `[italic] [weight] <size>px <family>[, …]`, as the draw functions write it. */
const FONT = /^(?:(italic)\s+)?(?:(\d+|bold|normal)\s+)?([\d.]+)px\s+(.+)$/;

export function styleOfFont(font: string, letterSpacing: string): MeasureStyle {
  const m = FONT.exec(font);
  const weight = m?.[2] === "bold" ? 700 : Number(m?.[2] ?? 400) || 400;
  const family = (m?.[4] ?? "sans-serif").split(",")[0]?.trim() ?? "sans-serif";
  return {
    font: family.replace(/^["']|["']$/g, ""),
    size: Number(m?.[3] ?? 10),
    weight,
    italic: m?.[1] === "italic",
    letterSpacing: Number.parseFloat(letterSpacing) || 0,
  };
}

/** Distance from the text's y to the top of its line box, as a fraction of the size. */
const TOP: Record<string, number> = {
  top: 0,
  hanging: 0,
  middle: 0.5,
  bottom: 1,
};

/** A context that records the canvas-space box of the text drawn through it. */
function extentsCtx(extents: TextExtent[]): Ctx {
  let props: Record<string, unknown> = {
    globalAlpha: 1,
    lineWidth: 1,
    font: "10px sans-serif",
    letterSpacing: "0px",
    textAlign: "start",
    textBaseline: "alphabetic",
  };
  let m: Matrix = IDENTITY;
  const stack: { m: Matrix; props: Record<string, unknown> }[] = [];

  const widthOf = (text: string) =>
    measureTextWidth(
      text,
      styleOfFont(String(props.font), String(props.letterSpacing)),
    );

  const record = (text: string, x: number, y: number) => {
    const { size } = styleOfFont(String(props.font), "0px");
    const w = widthOf(text);
    const align = String(props.textAlign);
    const left =
      align === "center"
        ? x - w / 2
        : align === "right" || align === "end"
          ? x - w
          : x;
    const top = y - size * (TOP[String(props.textBaseline)] ?? 0.8);
    const corners = [
      applyToPoint(m, left, top),
      applyToPoint(m, left + w, top),
      applyToPoint(m, left, top + size),
      applyToPoint(m, left + w, top + size),
    ];
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    extents.push({
      text,
      box: {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      },
    });
  };

  const methods: Record<string, (...a: number[]) => unknown> = {
    save: () => stack.push({ m, props: { ...props } }),
    restore: () => {
      const s = stack.pop();
      if (s) {
        m = s.m;
        props = s.props;
      }
    },
    translate: (x, y) => {
      m = multiply(m, translation(x, y));
    },
    scale: (x, y) => {
      m = multiply(m, scaling(x, y));
    },
    rotate: (a) => {
      m = multiply(m, rotation(a));
    },
    transform: (...a) => {
      m = multiply(m, a as Matrix);
    },
    setTransform: (...a) => {
      m = a.length === 6 ? (a as Matrix) : IDENTITY;
    },
    getTransform: () => {
      const [a, b, c, d, e, f] = m;
      return { a, b, c, d, e, f };
    },
    measureText: (text) => ({ width: widthOf(String(text)) }),
    fillText: (text, x, y) => record(String(text), x, y),
    strokeText: (text, x, y) => record(String(text), x, y),
  };

  return new Proxy({} as object, {
    get: (_t, key: string) =>
      key in methods ? methods[key] : key in props ? props[key] : sink,
    set: (_t, key: string, value) => {
      props[key] = value;
      return true;
    },
  }) as Ctx;
}

/**
 * The boxes of the text `el` draws at `t`, at rest (no animation transform), or none when
 * its draw fails here, as a kind that needs WebGL does in Node.
 */
export function textExtentsOf(
  el: Element,
  scene: Scene,
  t: number,
): TextExtent[] {
  const descriptor = descriptorOf(el.kind);
  if (!descriptor) return [];
  const extents: TextExtent[] = [];
  const g = globalThis as { Path2D?: unknown };
  const hadPath2D = g.Path2D !== undefined;
  // Node has no Path2D; draw functions only build shapes with it
  if (!hadPath2D)
    g.Path2D = function Path2D() {
      return sink;
    };
  try {
    descriptor.draw(extentsCtx(extents), el as never, rest(), {
      scene,
      t,
      byId: new Map(),
      drawElements: () => undefined,
    });
  } catch {
    return [];
  } finally {
    if (!hadPath2D) g.Path2D = undefined;
  }
  return extents;
}
