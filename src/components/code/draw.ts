import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import type { CodeEl } from "./descriptor.ts";
import { THEMES } from "./themes.ts";
import { type Token, tokensOf } from "./tokenize.ts";

const MONO = '"JetBrains Mono", "Fira Code", Consolas, monospace';

/** The first `count` characters of `tokens`, split into lines of tokens. */
export function typedLines(tokens: Token[], count: number): Token[][] {
  const lines: Token[][] = [[]];
  let left = count;
  for (const tok of tokens) {
    if (left <= 0) break;
    const text = tok.text.slice(0, left);
    left -= text.length;
    text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part)
        (lines[lines.length - 1] as Token[]).push({ ...tok, text: part });
    });
  }
  return lines;
}

export function drawCode(ctx: Ctx, el: CodeEl, st: AnimState): void {
  const theme = THEMES[el.theme] ?? THEMES.night;
  const typed = Math.min(1, Math.max(0, el.typed));
  const lines = typedLines(
    tokensOf(el.code, el.language),
    Math.round(el.code.length * typed),
  );
  const total = el.code.split("\n").length;
  const lh = el.size * 1.55;
  const panel = new Path2D();
  panel.roundRect(el.x, el.y, el.w, el.h, Math.min(el.radius, el.h / 2));
  withTransform(ctx, boxOf(el), st, () => {
    ctx.fillStyle = theme.background;
    ctx.fill(panel);
    ctx.save();
    ctx.clip(panel);
    ctx.font = `${el.size}px ${MONO}`;
    ctx.letterSpacing = "0px";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const gutter = el.lineNumbers
      ? ctx.measureText(String(total)).width + el.size * 1.2
      : 0;
    const left = el.x + el.pad + gutter;
    let endX = left;
    let endY = el.y + el.pad + lh / 2;
    lines.forEach((line, i) => {
      const y = el.y + el.pad + lh * (i + 0.5);
      if (el.lineNumbers) {
        ctx.fillStyle = theme.gutter;
        ctx.textAlign = "right";
        ctx.fillText(String(i + 1), left - el.size * 0.8, y);
        ctx.textAlign = "left";
      }
      let x = left;
      for (const tok of line) {
        ctx.fillStyle = theme.tokens[tok.type];
        ctx.fillText(tok.text, x, y);
        x += ctx.measureText(tok.text).width;
      }
      endX = x;
      endY = y;
    });
    if (el.cursor && typed < 1) {
      ctx.fillStyle = theme.tokens.plain;
      ctx.fillRect(
        endX + 1,
        endY - el.size * 0.6,
        el.size * 0.1 + 1,
        el.size * 1.2,
      );
    }
    ctx.restore();
  });
}
