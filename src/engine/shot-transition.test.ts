import { describe, expect, it } from "vitest";
import type { Shot } from "../model/model.ts";
import { shotTransitionAt } from "./shots.ts";

const W = 1080;

function shotWith(kind: "cut" | "fade" | "slide" | "zoom"): Shot {
  return {
    id: "s",
    name: "S",
    start: 2,
    end: 4,
    transition: { kind, duration: 1 },
  };
}

describe("shotTransitionAt (063/R1)", () => {
  it("fades a shot in halfway through its entering window", () => {
    // Arrange
    const shot = shotWith("fade");

    // Act
    const view = shotTransitionAt(shot, 1.5, W);

    // Assert
    expect(view).toEqual({ alpha: 0.5, dx: 0, scale: 1 });
  });

  it("shows a fading shot fully between its start and end", () => {
    // Arrange
    const shot = shotWith("fade");

    // Act
    const view = shotTransitionAt(shot, 3, W);

    // Assert
    expect(view).toEqual({ alpha: 1, dx: 0, scale: 1 });
  });

  it("fades a shot out after its end", () => {
    // Arrange
    const shot = shotWith("fade");

    // Act
    const view = shotTransitionAt(shot, 4.75, W);

    // Assert
    expect(view.alpha).toBeCloseTo(0.25);
  });

  it("slides an entering shot in from the right edge", () => {
    // Arrange
    const shot = shotWith("slide");

    // Act
    const view = shotTransitionAt(shot, 1.25, W);

    // Assert
    expect(view).toEqual({ alpha: 1, dx: 810, scale: 1 });
  });

  it("slides an exiting shot out to the left", () => {
    // Arrange
    const shot = shotWith("slide");

    // Act
    const view = shotTransitionAt(shot, 4.5, W);

    // Assert
    expect(view).toEqual({ alpha: 1, dx: -540, scale: 1 });
  });

  it("zooms an entering shot in from 0.8 scale", () => {
    // Arrange
    const shot = shotWith("zoom");

    // Act
    const view = shotTransitionAt(shot, 1, W);

    // Assert
    expect(view).toEqual({ alpha: 0, dx: 0, scale: 0.8 });
  });

  it("leaves a cut untouched inside the overlap window", () => {
    // Arrange
    const shot = shotWith("cut");

    // Act
    const view = shotTransitionAt(shot, 1.5, W);

    // Assert
    expect(view).toEqual({ alpha: 1, dx: 0, scale: 1 });
  });
});
