import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import { linesOf, rowAlpha } from "../../engine/reveal.ts";
import type { ChartEl } from "./descriptor.ts";
import { PALETTES } from "./palettes.ts";

export type Datum = { label: string; value: number };

/** `Etiqueta: valor` lines as data; a line without a number counts as 0. */
export function parseData(data: string): Datum[] {
  return linesOf(data).map((line) => {
    const at = line.lastIndexOf(":");
    const label = at < 0 ? "" : line.slice(0, at).trim();
    const value = Number.parseFloat(at < 0 ? line : line.slice(at + 1));
    return { label, value: Number.isFinite(value) ? value : 0 };
  });
}

/** `n` with at most one decimal, no trailing zero. */
const short = (n: number) => String(Math.round(n * 10) / 10);

export function drawChart(ctx: Ctx, el: ChartEl, st: AnimState): void {
  const data = parseData(el.data);
  if (data.length === 0) return;
  const colors = (PALETTES[el.palette] ?? PALETTES.ocean).colors;
  const colorAt = (i: number) => colors[i % colors.length] as string;
  const k = Math.min(1, Math.max(0, el.progress));
  withTransform(ctx, boxOf(el), st, () => {
    ctx.font = fontString({ ...el, text: "" });
    ctx.letterSpacing = "0px";
    if (el.type === "pie" || el.type === "donut")
      pie(ctx, el, data, k, colorAt);
    else axes(ctx, el, data, k, colorAt);
  });
}

function axes(
  ctx: Ctx,
  el: ChartEl,
  data: Datum[],
  k: number,
  colorAt: (i: number) => string,
) {
  const n = data.length;
  const max = Math.max(1e-9, ...data.map((d) => d.value));
  const labelH = el.size * 1.8;
  const top = el.y + el.size * 1.6;
  const base = el.y + el.h - labelH;
  const plotH = base - top;
  const slot = el.w / n;
  const yOf = (v: number) => base - (Math.max(0, v) / max) * plotH;
  ctx.strokeStyle = el.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(el.x, base);
  ctx.lineTo(el.x + el.w, base);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = el.color;
  data.forEach((d, i) => {
    ctx.fillText(d.label, el.x + slot * (i + 0.5), base + labelH / 2, slot);
  });

  if (el.type === "bar") {
    const bw = slot * 0.6;
    data.forEach((d, i) => {
      // bars grow one after another
      const g = rowAlpha(k, i, n);
      if (g <= 0) return;
      const h = (base - yOf(d.value)) * g;
      const x = el.x + slot * (i + 0.5) - bw / 2;
      const bar = new Path2D();
      bar.roundRect(x, base - h, bw, h, [
        Math.min(8, bw / 4),
        Math.min(8, bw / 4),
        0,
        0,
      ]);
      ctx.fillStyle = colorAt(i);
      ctx.fill(bar);
      if (el.showValues && g >= 1) {
        ctx.fillStyle = el.color;
        ctx.fillText(short(d.value), x + bw / 2, base - h - el.size * 0.8);
      }
    });
    return;
  }

  // line: drawn left to right as `k` grows
  const pts = data.map((d, i) => ({
    x: el.x + slot * (i + 0.5),
    y: yOf(d.value),
  }));
  const span = (n - 1) * k;
  const whole = Math.floor(span);
  ctx.strokeStyle = colorAt(0);
  ctx.lineWidth = Math.max(2, el.size * 0.2);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  pts.slice(0, whole + 1).forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  const from = pts[whole];
  const to = pts[whole + 1];
  if (from && to) {
    const f = span - whole;
    ctx.lineTo(from.x + (to.x - from.x) * f, from.y + (to.y - from.y) * f);
  }
  ctx.stroke();
  pts.forEach((p, i) => {
    if (i > span + 1e-9) return;
    ctx.fillStyle = colorAt(0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3, el.size * 0.28), 0, Math.PI * 2);
    ctx.fill();
    if (el.showValues) {
      ctx.fillStyle = el.color;
      ctx.fillText(short((data[i] as Datum).value), p.x, p.y - el.size);
    }
  });
}

function pie(
  ctx: Ctx,
  el: ChartEl,
  data: Datum[],
  k: number,
  colorAt: (i: number) => string,
) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  const r = Math.min(el.w, el.h) / 2;
  const inner = el.type === "donut" ? r * el.hole : 0;
  const end = -Math.PI / 2 + k * Math.PI * 2;
  let a = -Math.PI / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  data.forEach((d, i) => {
    const sweep = (Math.max(0, d.value) / total) * Math.PI * 2;
    const b = Math.min(a + sweep, end);
    if (b > a) {
      ctx.fillStyle = colorAt(i);
      ctx.beginPath();
      ctx.arc(cx, cy, r, a, b);
      if (inner > 0) ctx.arc(cx, cy, inner, b, a, true);
      else ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
    }
    if (el.showValues && k >= 1 && sweep > 0.25) {
      const mid = a + sweep / 2;
      const at = inner > 0 ? (r + inner) / 2 : r * 0.62;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        d.label || short(d.value),
        cx + Math.cos(mid) * at,
        cy + Math.sin(mid) * at,
      );
    }
    a += sweep;
  });
}
