/**
 * A fake 2D context for Node tests: it records every drawing call and property write as
 * text, so two renders of the same scene can be compared without a browser. Identical logs
 * mean identical pixels.
 */

type M = [number, number, number, number, number, number];

const fmt = (v: unknown): string => {
  if (typeof v === "number") return Number(v.toFixed(6)).toString();
  if (Array.isArray(v)) return `[${v.map(fmt).join(",")}]`;
  if (v && typeof v === "object" && "log" in v)
    return `{${(v as { log: string[] }).log.join(";")}}`;
  return String(v);
};

class Recorder {
  log: string[] = [];
  protected rec(name: string, args: unknown[]) {
    this.log.push(`${name}(${args.map(fmt).join(",")})`);
  }
}

class FakePath2D extends Recorder {
  constructor(d?: unknown) {
    super();
    if (d !== undefined) this.rec("d", [d]);
  }
}
for (const m of [
  "moveTo",
  "lineTo",
  "arc",
  "ellipse",
  "rect",
  "roundRect",
  "closePath",
  "bezierCurveTo",
  "quadraticCurveTo",
  "arcTo",
  "addPath",
]) {
  (FakePath2D.prototype as unknown as Record<string, unknown>)[m] = function (
    this: FakePath2D,
    ...args: unknown[]
  ) {
    this.rec(m, args);
  };
}

class FakeGradient extends Recorder {
  constructor(kind: string, args: unknown[]) {
    super();
    this.rec(kind, args);
  }
  addColorStop(...args: unknown[]) {
    this.rec("stop", args);
  }
}

const mul = (a: M, b: M): M => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

/** Widths are a fixed function of the text and font size, like a monospace font. */
function measure(font: string, text: string) {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10);
  return { width: text.length * size * 0.55 };
}

const STATE = [
  "fillStyle",
  "strokeStyle",
  "globalAlpha",
  "lineWidth",
  "lineCap",
  "lineJoin",
  "lineDashOffset",
  "shadowColor",
  "shadowBlur",
  "shadowOffsetX",
  "shadowOffsetY",
  "font",
  "letterSpacing",
  "textBaseline",
  "textAlign",
  "globalCompositeOperation",
] as const;

export class RecordingCtx extends Recorder {
  private m: M = [1, 0, 0, 1, 0, 0];
  private props: Record<string, unknown> = {
    globalAlpha: 1,
    lineWidth: 1,
    lineDashOffset: 0,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: "10px sans-serif",
    letterSpacing: "0px",
  };
  private dash: number[] = [];
  private stack: { m: M; props: Record<string, unknown>; dash: number[] }[] =
    [];

  constructor() {
    super();
    for (const p of STATE) {
      Object.defineProperty(this, p, {
        get: () => this.props[p],
        set: (v) => {
          this.props[p] = v;
          this.rec(`${p}=`, [v]);
        },
      });
    }
  }
  save() {
    this.stack.push({ m: this.m, props: { ...this.props }, dash: this.dash });
    this.rec("save", []);
  }
  restore() {
    const s = this.stack.pop();
    if (s) ({ m: this.m, props: this.props, dash: this.dash } = s);
    this.rec("restore", []);
  }
  translate(x: number, y: number) {
    this.m = mul(this.m, [1, 0, 0, 1, x, y]);
    this.rec("translate", [x, y]);
  }
  scale(x: number, y: number) {
    this.m = mul(this.m, [x, 0, 0, y, 0, 0]);
    this.rec("scale", [x, y]);
  }
  rotate(a: number) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    this.m = mul(this.m, [c, s, -s, c, 0, 0]);
    this.rec("rotate", [a]);
  }
  setTransform(...args: number[]) {
    this.m = (args.length === 6 ? args : [1, 0, 0, 1, 0, 0]) as M;
    this.rec("setTransform", args);
  }
  getTransform() {
    const [a, b, c, d, e, f] = this.m;
    return { a, b, c, d, e, f };
  }
  setLineDash(d: number[]) {
    this.dash = [...d];
    this.rec("setLineDash", [d]);
  }
  getLineDash() {
    return [...this.dash];
  }
  measureText(text: string) {
    return measure(String(this.props.font), text);
  }
  createLinearGradient(...args: number[]) {
    return new FakeGradient("linear", args);
  }
  createRadialGradient(...args: number[]) {
    return new FakeGradient("radial", args);
  }
}
for (const m of [
  "beginPath",
  "closePath",
  "moveTo",
  "lineTo",
  "arc",
  "ellipse",
  "rect",
  "roundRect",
  "bezierCurveTo",
  "quadraticCurveTo",
  "fill",
  "stroke",
  "clip",
  "fillRect",
  "strokeRect",
  "clearRect",
  "fillText",
  "strokeText",
  "drawImage",
]) {
  (RecordingCtx.prototype as unknown as Record<string, unknown>)[m] = function (
    this: RecordingCtx,
    ...args: unknown[]
  ) {
    (this as unknown as { rec: (n: string, a: unknown[]) => void }).rec(
      m,
      args,
    );
  };
}

/** Puts the fakes where the engine looks for `Path2D` and `OffscreenCanvas`. */
export function installCanvasFakes(): void {
  const g = globalThis as Record<string, unknown>;
  g.Path2D = FakePath2D;
  g.OffscreenCanvas = class {
    getContext() {
      return new RecordingCtx();
    }
  };
}
