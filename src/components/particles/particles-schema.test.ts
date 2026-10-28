import { describe, expect, it } from "vitest";
import { defaultParticles, defaultScene } from "../../model/model.ts";
import { parseScene } from "../../model/schema.ts";

/** A scene holding one particles element with `over` applied. */
function sceneWith(over: Record<string, unknown>) {
  return { ...defaultScene(), elements: [{ ...defaultParticles(), ...over }] };
}

describe("particles schema", () => {
  it("accepts a speed of 0", () => {
    expect(parseScene(sceneWith({ speed: 0 })).ok).toBe(true);
  });

  it("accepts a fractional speed", () => {
    expect(parseScene(sceneWith({ speed: 0.5 })).ok).toBe(true);
  });

  it("rejects a negative speed", () => {
    expect(parseScene(sceneWith({ speed: -1 })).ok).toBe(false);
  });

  it("rejects a twinkle above 1", () => {
    expect(parseScene(sceneWith({ twinkle: 1.5 })).ok).toBe(false);
  });

  it("rejects a negative gravity", () => {
    expect(parseScene(sceneWith({ gravity: -0.1 })).ok).toBe(false);
  });

  it("rejects an unknown motion", () => {
    expect(parseScene(sceneWith({ motion: "swirl" })).ok).toBe(false);
  });

  it("reads an older particles element as drifting, untwinkling points", () => {
    const old = sceneWith({});
    const el = old.elements[0] as unknown as Record<string, unknown>;
    delete el.motion;
    delete el.direction;
    delete el.gravity;
    delete el.twinkle;

    const parsed = parseScene(old);

    expect(parsed.ok && parsed.value.elements[0]).toMatchObject({
      motion: "drift",
      direction: 90,
      gravity: 0,
      twinkle: 0,
    });
  });
});
