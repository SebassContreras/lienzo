import type { SubtitleCue, SubtitleWord } from "./types.ts";

export interface PositionedWord {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timing?: SubtitleWord;
}

export interface SubtitleLine {
  words: PositionedWord[];
  text: string;
  width: number;
  y: number;
}

export interface SubtitleLayout {
  lines: SubtitleLine[];
  totalWidth: number;
  totalHeight: number;
}

export interface MeasureTextFn {
  (text: string): number;
}

/**
 * Computes wrapped lines and word positions for a subtitle cue within maxWidth.
 * Pure layout function: accepts a measureText callback so it runs identically
 * in Canvas 2D preview, export, or headless tests.
 */
export function layoutSubtitleCue(
  cue: SubtitleCue,
  maxWidth: number,
  lineHeight: number,
  measureText: MeasureTextFn,
  align: "left" | "center" | "right" = "center",
  highlightScale = 1,
): SubtitleLayout {
  const wordsToLayout: { text: string; timing?: SubtitleWord }[] = [];

  if (cue.words && cue.words.length > 0) {
    for (const w of cue.words) {
      wordsToLayout.push({ text: w.word, timing: w });
    }
  } else {
    const rawTokens = cue.text.split(/\s+/).filter((s) => s.length > 0);
    for (const token of rawTokens) {
      wordsToLayout.push({ text: token });
    }
  }

  if (wordsToLayout.length === 0) {
    return { lines: [], totalWidth: 0, totalHeight: 0 };
  }

  const spaceWidth = measureText(" ");
  const scaleExpansion = Math.max(0, highlightScale - 1);
  const lines: SubtitleLine[] = [];
  let currentLineWords: PositionedWord[] = [];
  let currentLineWidth = 0;

  for (const item of wordsToLayout) {
    const wordWidth = measureText(item.text);
    // Reserve clearance padding for when a word is active and scaled up (039/R3, D3)
    const extraPadding = wordWidth * scaleExpansion;
    const effectiveSpacing = spaceWidth + extraPadding;
    const addedWidth = currentLineWords.length > 0 ? effectiveSpacing + wordWidth : wordWidth;

    if (currentLineWords.length > 0 && currentLineWidth + addedWidth > maxWidth) {
      // Flush current line
      lines.push({
        words: currentLineWords,
        text: currentLineWords.map((w) => w.word).join(" "),
        width: currentLineWidth,
        y: lines.length * lineHeight,
      });
      currentLineWords = [];
      currentLineWidth = 0;
    }

    const wordX = currentLineWords.length > 0 ? currentLineWidth + effectiveSpacing : 0;
    currentLineWords.push({
      word: item.text,
      x: wordX,
      y: lines.length * lineHeight,
      width: wordWidth,
      height: lineHeight,
      timing: item.timing,
    });
    currentLineWidth = wordX + wordWidth;
  }

  if (currentLineWords.length > 0) {
    lines.push({
      words: currentLineWords,
      text: currentLineWords.map((w) => w.word).join(" "),
      width: currentLineWidth,
      y: lines.length * lineHeight,
    });
  }

  // Calculate bounding box and apply horizontal alignment offset
  let maxComputedWidth = 0;
  for (const line of lines) {
    if (line.width > maxComputedWidth) {
      maxComputedWidth = line.width;
    }
  }

  const totalWidth = Math.min(maxWidth, Math.max(maxComputedWidth, 0));
  const totalHeight = lines.length * lineHeight;

  for (const line of lines) {
    let lineOffsetX = 0;
    if (align === "center") {
      lineOffsetX = (totalWidth - line.width) / 2;
    } else if (align === "right") {
      lineOffsetX = totalWidth - line.width;
    }

    if (lineOffsetX !== 0) {
      for (const w of line.words) {
        w.x += lineOffsetX;
      }
    }
  }

  return {
    lines,
    totalWidth,
    totalHeight,
  };
}
