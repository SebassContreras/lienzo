import { createHash } from "node:crypto";
import { demoScene } from "../demo.ts";
import type { Ctx } from "../engine/paint.ts";
import { drawScene } from "../engine/render.ts";
import type { Scene } from "../model/model.ts";
import { RecordingCtx } from "./recording-ctx.ts";

/** Frames compared for each scene: the start, mid-entry, mid-loop and near the end. */
export const FRAMES = [0, 0.37, 1.25, 2.9];

/** The hash of every call `drawScene` makes for each frame of `scene`. */
export function renderHashes(scene: Scene): string[] {
  return FRAMES.map((t) => {
    const ctx = new RecordingCtx();
    drawScene(ctx as unknown as Ctx, scene, t);
    return createHash("sha256").update(ctx.log.join("\n")).digest("hex");
  });
}

export { demoScene };
