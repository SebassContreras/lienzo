/**
 * SVG path parsing (024/D4): a small adapter over `svgpath` (MIT, A18) that turns any `d`
 * string into absolute cubic Béziers, so the rest of the code never sees SVG commands and
 * the library stays swappable.
 */
import svgpath from "svgpath";

/** One cubic Bézier: start, two control points and end, as `[x0, y0, x1, y1, x2, y2, x3, y3]`. */
export type Cubic = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** A run of joined curves; `closed` when the `d` string ended it with `Z`. */
export type Subpath = { curves: Cubic[]; closed: boolean };

/** A straight segment as a cubic, its control points a third of the way along. */
const lineCubic = (x0: number, y0: number, x1: number, y1: number): Cubic => [
  x0,
  y0,
  x0 + (x1 - x0) / 3,
  y0 + (y1 - y0) / 3,
  x0 + ((x1 - x0) * 2) / 3,
  y0 + ((y1 - y0) * 2) / 3,
  x1,
  y1,
];

/** A quadratic from (x0, y0) as the cubic that draws the same curve. */
const quadCubic = (
  x0: number,
  y0: number,
  qx: number,
  qy: number,
  x: number,
  y: number,
): Cubic => [
  x0,
  y0,
  x0 + ((qx - x0) * 2) / 3,
  y0 + ((qy - y0) * 2) / 3,
  x + ((qx - x) * 2) / 3,
  y + ((qy - y) * 2) / 3,
  x,
  y,
];

/**
 * The subpaths of `d`: relative commands made absolute, shorthands expanded, arcs, lines and
 * quadratics turned into cubics, `Z` closing with a line. Throws an error naming `name`
 * (such as "Forma 2") when `d` is empty or not a valid path (024/R10).
 */
export function parsePath(d: string, name: string): Subpath[] {
  const p = svgpath(d) as ReturnType<typeof svgpath> & { err?: string };
  if (p.err) throw new Error(`${name}: trazado no válido (${p.err})`);
  const out: Subpath[] = [];
  let current: Subpath | undefined;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const add = (c: Cubic) => {
    if (!current) {
      current = { curves: [], closed: false };
      out.push(current);
    }
    current.curves.push(c);
    x = c[6];
    y = c[7];
  };
  p.abs()
    .unshort()
    .unarc()
    .iterate((s) => {
      switch (s[0]) {
        case "M":
          current = undefined;
          x = sx = s[1];
          y = sy = s[2];
          break;
        case "L":
          add(lineCubic(x, y, s[1], s[2]));
          break;
        case "H":
          add(lineCubic(x, y, s[1], y));
          break;
        case "V":
          add(lineCubic(x, y, x, s[1]));
          break;
        case "C":
          add([x, y, s[1], s[2], s[3], s[4], s[5], s[6]]);
          break;
        case "Q":
          add(quadCubic(x, y, s[1], s[2], s[3], s[4]));
          break;
        case "Z":
        case "z":
          if (current) {
            if (x !== sx || y !== sy) add(lineCubic(x, y, sx, sy));
            current.closed = true;
          }
          current = undefined;
          x = sx;
          y = sy;
          break;
      }
    });
  if (out.length === 0) throw new Error(`${name}: el trazado está vacío`);
  return out;
}

/** The error `parsePath` would throw for `d`, or undefined when it is a valid path. */
export function pathError(d: string, name: string): string | undefined {
  try {
    parsePath(d, name);
    return undefined;
  } catch (e) {
    return (e as Error).message;
  }
}
