import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import { defaultScene, type Element } from "../model/model.ts";
import { deadKeyframeEasingNotices } from "./scene-notices.ts";

const withTracks = (tracks: Element["tracks"], id = "a") => ({
  ...createElement("rect"),
  id,
  tracks,
});

const sceneWith = (...elements: Element[]) => ({
  ...defaultScene(),
  elements,
});

describe("deadKeyframeEasingNotices (065/R4)", () => {
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
});
