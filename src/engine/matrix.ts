/** A 2D affine transform as canvas takes it: [a, b, c, d, e, f]. */
export type Matrix = [number, number, number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `a` followed by `b`: what `ctx.transform(...b)` does to a context whose matrix is `a`. */
export const multiply = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

export const translation = (x: number, y: number): Matrix => [1, 0, 0, 1, x, y];

export const scaling = (x: number, y: number): Matrix => [x, 0, 0, y, 0, 0];

export const rotation = (angle: number): Matrix => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, s, -s, c, 0, 0];
};

export const applyToPoint = (m: Matrix, x: number, y: number) => ({
  x: m[0] * x + m[2] * y + m[4],
  y: m[1] * x + m[3] * y + m[5],
});
