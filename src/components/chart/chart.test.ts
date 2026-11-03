import { describe, expect, test } from "vitest";
import { defaultElement } from "../../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../../test/recording-ctx.ts";
import type { ChartEl } from "./descriptor.ts";
import { drawChart } from "./draw.ts";

installCanvasFakes();

describe("pie / donut chart slice and label rendering (094/R3)", () => {
  const dummyState = {
    t: 0,
    progress: 1,
    loop: 1,
    loopProgress: 1,
    cycle: 0,
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 },
  };

  test.each([
    [
      "narrow slice before wide slices renders all fills before any text",
      {
        sliceData: "Solar: 6.9\nRenew: 25.1\nOther: 68",
        showValues: true,
      },
      {
        expectedLabelTexts: ["Solar (6.9)", "Renew (25.1)", "Other (68)"],
        expectedFillOrder: true,
      },
    ],
    [
      "showValues true with label formats as label (value)",
      {
        sliceData: "Solar: 6.9",
        showValues: true,
      },
      {
        expectedLabelTexts: ["Solar (6.9)"],
        expectedFillOrder: true,
      },
    ],
    [
      "showValues true when label already contains formatted value does not duplicate",
      {
        sliceData: "Solar (6.9): 6.9\nWind 20%: 20",
        showValues: true,
      },
      {
        expectedLabelTexts: ["Solar (6.9)", "Wind 20%"],
        expectedFillOrder: true,
      },
    ],
    [
      "showValues true with empty label displays only value",
      {
        sliceData: "6.9",
        showValues: true,
      },
      {
        expectedLabelTexts: ["6.9"],
        expectedFillOrder: true,
      },
    ],
    [
      "showValues false displays label only",
      {
        sliceData: "Solar: 6.9",
        showValues: false,
      },
      {
        expectedLabelTexts: ["Solar"],
        expectedFillOrder: true,
      },
    ],
    [
      "narrow sweep <= 0.25 rad suppresses label",
      {
        sliceData: "Tiny: 1\nHuge: 100", // 1 / 101 * 2pi ~= 0.06 rad <= 0.25 rad
        showValues: true,
      },
      {
        expectedLabelTexts: ["Huge (100)"],
        expectedFillOrder: true,
      },
    ],
  ])(
    "%s",
    (
      _name,
      { sliceData, showValues },
      { expectedLabelTexts, expectedFillOrder },
    ) => {
      const ctx = new RecordingCtx();
      const el: ChartEl = {
        ...(defaultElement("chart") as ChartEl),
        type: "donut",
        data: sliceData,
        showValues,
        progress: 1,
        w: 400,
        h: 400,
      };

      drawChart(ctx as unknown as CanvasRenderingContext2D, el, dummyState);

      const fills = ctx.log
        .map((entry, idx) => ({ entry, idx }))
        .filter((x) => x.entry === "fill()");
      const texts = ctx.log
        .map((entry, idx) => ({ entry, idx }))
        .filter((x) => x.entry.startsWith("fillText("));

      if (expectedFillOrder && texts.length > 0 && fills.length > 0) {
        const lastFillIdx = Math.max(...fills.map((f) => f.idx));
        const firstTextIdx = Math.min(...texts.map((t) => t.idx));
        expect(lastFillIdx).toBeLessThan(firstTextIdx);
      }

      const textValues = texts.map((t) => {
        const match = t.entry.match(/^fillText\((.*?),(.*?),(.*?)\)$/);
        return match ? match[1] : "";
      });

      expect(textValues).toEqual(expectedLabelTexts);
    },
  );
});
