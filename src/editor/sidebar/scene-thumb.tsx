import { useEffect, useRef } from "react";
import { loadSceneAssets } from "../../engine/assets.ts";
import { drawScene } from "../../engine/render.ts";
import type { Scene } from "../../model/model.ts";

const THUMB_W = 120;
const THUMB_H = 90;

/**
 * The whole scene scaled into a small canvas, drawn once its images have decoded, at a
 * moment entry animations are over (1.5 s, or the loop's end if shorter).
 */
export function SceneThumb({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const draw = () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!live || !canvas || !ctx) return;
      const k = Math.min(
        canvas.width / scene.width,
        canvas.height / scene.height,
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(
        k,
        0,
        0,
        k,
        (canvas.width - scene.width * k) / 2,
        (canvas.height - scene.height * k) / 2,
      );
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, scene.width, scene.height);
      ctx.clip();
      drawScene(ctx, scene, Math.min(1.5, scene.duration));
      ctx.restore();
    };
    Promise.all([loadSceneAssets(scene), document.fonts.ready]).then(draw);
    return () => {
      live = false;
    };
  }, [scene]);
  const dpr = window.devicePixelRatio || 1;
  return (
    <canvas
      ref={ref}
      className="scene-thumb"
      width={THUMB_W * dpr}
      height={THUMB_H * dpr}
      style={{ width: THUMB_W, height: THUMB_H }}
    />
  );
}
