import type { AnimState } from "../../engine/anim.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import { getActiveCue, isWordActive } from "../../engine/subtitles/cue-timing.ts";
import { layoutSubtitleCue } from "../../engine/subtitles/layout.ts";
import { paginateCueForTime } from "../../engine/subtitles/word-window.ts";
import type { DrawContext } from "../descriptor.ts";
import type { SubtitlesEl } from "./descriptor.ts";

/**
 * Deterministically draws subtitles at scene time `t`.
 * Renders the active cue, wrapping lines within `maxWidth`, with optional background pill
 * and word-by-word karaoke highlight color & scale.
 */
export function drawSubtitles(
  ctx: Ctx,
  el: SubtitlesEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const activeCue = getActiveCue(el.cues, dc.t);
  if (!activeCue) {
    return;
  }

  // Setup font measurement
  ctx.save();
  ctx.font = `${el.weight} ${el.size}px ${el.font}`;
  const measure = (text: string) => ctx.measureText(text).width;
  const lineHeightPx = el.size * el.lineHeight;

  // Compute maximum lines that fit inside bounding box height, minus padding
  const availableHeight = el.background
    ? el.h - el.paddingY * 2
    : el.h;
  const maxFitLines = Math.max(1, Math.floor(availableHeight / lineHeightPx));

  // Constrain width to container el.w (or el.maxWidth if smaller)
  const maxAvailableWidth = Math.min(
    el.w - (el.background ? el.paddingX * 2 : 0),
    el.maxWidth,
  );

  // Paginate words into active window that fits inside bounding box (D2@3)
  const windowedCue = paginateCueForTime(activeCue, dc.t, {
    maxLines: maxFitLines,
    wordsPerWindow: el.wordsPerWindow ?? 4,
  });

  const layout = layoutSubtitleCue(
    windowedCue,
    Math.max(100, maxAvailableWidth),
    lineHeightPx,
    measure,
    el.align,
  );
  if (layout.lines.length === 0) {
    ctx.restore();
    return;
  }

  const box = {
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
  };

  withTransform(ctx, box, st, () => {
    ctx.font = `${el.weight} ${el.size}px ${el.font}`;
    ctx.textBaseline = "top";

    const contentWidth = layout.totalWidth;
    const contentHeight = layout.totalHeight;

    // Center content within el.w and el.h bounding box, positioned at (el.x, el.y)
    const startX = el.x + (el.w - contentWidth) / 2;
    const startY = el.y + (el.h - contentHeight) / 2;

    // Draw background box/badge if enabled
    if (el.background && el.bgOpacity > 0) {
      ctx.save();
      ctx.globalAlpha *= el.bgOpacity;
      ctx.fillStyle = el.bgColor;
      const bgX = startX - el.paddingX;
      const bgY = startY - el.paddingY;
      const bgW = contentWidth + el.paddingX * 2;
      const bgH = contentHeight + el.paddingY * 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bgX, bgY, bgW, bgH, el.radius);
      } else {
        ctx.rect(bgX, bgY, bgW, bgH);
      }
      ctx.fill();
      ctx.restore();
    }

    // Render words with karaoke highlights
    for (const line of layout.lines) {
      for (const word of line.words) {
        const isActive = word.timing ? isWordActive(word.timing, dc.t) : false;
        const wordX = startX + word.x;
        const wordY = startY + word.y;

        ctx.save();
        if (isActive) {
          ctx.fillStyle = el.highlightColor;
          if (el.highlightScale !== 1) {
            // Scale active word slightly from its center
            const centerX = wordX + word.width / 2;
            const centerY = wordY + word.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(el.highlightScale, el.highlightScale);
            ctx.translate(-centerX, -centerY);
          }
        } else {
          ctx.fillStyle = el.textColor;
        }

        ctx.fillText(word.word, wordX, wordY);
        ctx.restore();
      }
    }
  });

  ctx.restore();
}
