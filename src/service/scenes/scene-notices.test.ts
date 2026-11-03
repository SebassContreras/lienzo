import { describe, expect, it, test } from "vitest";
import { createElement } from "../../components/index.ts";
import { defaultScene, type Element } from "../../model/model.ts";
import {
  animOutsideShotNotices,
  deadKeyframeEasingNotices,
} from "./scene-notices.ts";

const withTracks = (tracks: Element["tracks"], id = "a") => ({
  ...createElement("rect"),
  id,
  tracks,
});

const sceneWith = (...elements: Element[]) => ({
  ...defaultScene(),
  elements,
});

describe("deadKeyframeEasingNotices", () => {
  it("notes an easing on the last keyframe of a track", () => {
    const rect = withTracks({
      x: [
        { t: 0, value: 0, easing: "auto" },
        { t: 2, value: 100, easing: "ease-out" },
      ],
    });

    const notices = deadKeyframeEasingNotices(sceneWith(rect));

    expect(notices).toEqual([
      {
        elementId: "a",
        message: expect.stringMatching(/«x».*«a».*ease-out.*t=2.*siguiente/),
      },
    ]);
  });

  it("is quiet when the last keyframe is auto or linear", () => {
    const rect = withTracks({
      x: [
        { t: 0, value: 0, easing: "ease-out" },
        { t: 2, value: 100, easing: "auto" },
      ],
      y: [
        { t: 0, value: 0, easing: "ease-in" },
        { t: 2, value: 100, easing: "linear" },
      ],
    });

    expect(deadKeyframeEasingNotices(sceneWith(rect))).toEqual([]);
  });

  it("finds a track of a group's child and names the top-level element", () => {
    const child = withTracks(
      { x: [{ t: 1, value: 5, easing: "ease-in-out" }] },
      "kid",
    );
    const group = { ...createElement("group"), id: "g", children: [child] };

    const notices = deadKeyframeEasingNotices(sceneWith(group));

    expect(notices.map((n) => n.elementId)).toEqual(["g"]);
  });

  describe("animOutsideShotNotices (094/R4)", () => {
    test.each([
      [
        "anim.in finishes before shot start",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            in: {
              kind: "fade" as const,
              delay: 0.15,
              duration: 0.4,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedPattern: /«el1».*«s2»/ },
      ],
      [
        "anim.in starts at or after shot end",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            in: {
              kind: "fade" as const,
              delay: 11.5,
              duration: 0.5,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedPattern: /«el1».*«s2»/ },
      ],
      [
        "anim.out finishes before shot start",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            out: {
              kind: "fade" as const,
              delay: 5.25,
              duration: 0.25,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedPattern: /«el1».*«s2»/ },
      ],
      [
        "anim.out starts at or after shot end",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            out: {
              kind: "fade" as const,
              delay: 11,
              duration: 0.5,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedPattern: /«el1».*«s2»/ },
      ],
      [
        "nominal in-bounds anim.in and anim.out",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            in: {
              kind: "fade" as const,
              delay: 5.65,
              duration: 0.5,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
            out: {
              kind: "fade" as const,
              delay: 10.25,
              duration: 0.5,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: false },
      ],
      [
        "unbound element with low delay",
        {
          shot: undefined,
          anim: {
            in: {
              kind: "fade" as const,
              delay: 0.15,
              duration: 0.4,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: false },
      ],
      [
        "boundary equality delay + duration == shot.start triggers notice",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            in: {
              kind: "fade" as const,
              delay: 5,
              duration: 0.5, // 5.0 + 0.5 == 5.5
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedPattern: /«el1».*«s2»/ },
      ],
      [
        "compound in and out outside shot",
        {
          shot: { id: "s2", start: 5.5, end: 11 },
          anim: {
            in: {
              kind: "fade" as const,
              delay: 1,
              duration: 1,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
            out: {
              kind: "fade" as const,
              delay: 12,
              duration: 1,
              from: "left" as const,
              easing: "linear" as const,
              amount: 0,
            },
          },
        },
        { expectedNotice: true, expectedCount: 2, expectedPattern: /«el1».*«s2»/ },
      ],
    ])(
      "%s",
      (
        _name,
        { shot, anim },
        expected: { expectedNotice: boolean; expectedPattern?: RegExp; expectedCount?: number },
      ) => {
        const { expectedNotice, expectedPattern, expectedCount } = expected;
        const el: Element = {
          ...createElement("rect"),
          id: "el1",
          ...(shot ? { shot: shot.id } : {}),
          anim: {
            ...createElement("rect").anim,
            ...anim,
          },
        };
        const scene = {
          ...defaultScene(),
          shots: shot ? [{ name: shot.id, ...shot }] : [],
          elements: [el],
        };
        const notices = animOutsideShotNotices(scene);
        if (expectedNotice) {
          expect(notices.length).toBeGreaterThanOrEqual(expectedCount ?? 1);
          expect(notices[0]?.message).toMatch(expectedPattern!);
        } else {
          expect(notices).toEqual([]);
        }
      },
    );
  });
});
