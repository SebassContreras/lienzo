/**
 * The animation picker (018/D10): one tile per kind, each drawing the element itself playing
 * that kind with the same `animate` the export uses. Only the hovered tile (else the chosen
 * one) moves, on one `requestAnimationFrame`; the rest show a still frame.
 */
import { useEffect, useRef, useState } from "react";
import { boxOf } from "../engine/geometry.ts";
import { drawElements } from "../engine/render.ts";
import { type Anim, defaultScene, type Element } from "../model/model.ts";

type Slot = "in" | "loop" | "out";

const W = 72;
const H = 54;
const DPR = 2;
/** Seconds a loop preview takes per cycle; entries and exits rest this long after playing. */
const LOOP_SEC = 1.6;
const REST_SEC = 0.8;
const DELAY = 0.1;

/** `el` with only `slot` playing `kind`, from the start of the preview. */
function sample(el: Element, slot: Slot, kind: string): Element {
  const off = { ...el.anim };
  const anim: Anim = {
    in: { ...off.in, kind: "none" },
    loop: { ...off.loop, kind: "none" },
    out: { ...off.out, kind: "none" },
  };
  if (slot === "loop")
    anim.loop = {
      ...off.loop,
      kind: kind as Anim["loop"]["kind"],
      delay: 0,
      cycles: 1,
      iterations: "infinite",
    };
  else
    anim[slot] = {
      ...off[slot],
      kind: kind as Anim["in"]["kind"],
      delay: DELAY,
    };
  return { ...el, anim } as Element;
}

/** How long one run of the preview lasts. */
function period(el: Element, slot: Slot): number {
  return slot === "loop" ? LOOP_SEC : DELAY + el.anim[slot].duration + REST_SEC;
}

/** Draws `el` playing `kind` at `t`, fitted into the tile with room to move. */
function drawTile(
  canvas: HTMLCanvasElement,
  el: Element,
  slot: Slot,
  kind: string,
  t: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const shown = sample(el, slot, kind);
  const box = boxOf(shown);
  const fit = Math.min(W / (box.w * 1.8 || 1), H / (box.h * 1.8 || 1));
  const scene = { ...defaultScene(), duration: period(el, slot) };
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2);
  ctx.scale(fit, fit);
  ctx.translate(-(box.x + box.w / 2), -(box.y + box.h / 2));
  drawElements(ctx, [shown], scene, t);
}

/** A moment that shows what the kind does, for tiles that are not playing. */
function stillAt(el: Element, slot: Slot): number {
  return slot === "loop" ? LOOP_SEC / 4 : DELAY + el.anim[slot].duration * 0.5;
}

export function AnimPicker({
  el,
  slot,
  label,
  value,
  options,
  onChange,
}: {
  el: Element;
  slot: Slot;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (kind: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const canvases = useRef(new Map<string, HTMLCanvasElement>());
  const playing = hover ?? value;

  // every tile once, still
  useEffect(() => {
    if (!open) return;
    for (const [kind, canvas] of canvases.current)
      drawTile(canvas, el, slot, kind, stillAt(el, slot));
  }, [open, el, slot]);

  // the playing tile, on one frame loop
  useEffect(() => {
    const canvas = canvases.current.get(playing);
    if (!open || !canvas || playing === "none") return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = ((now - start) / 1000) % period(el, slot);
      drawTile(canvas, el, slot, playing, t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      drawTile(canvas, el, slot, playing, stillAt(el, slot));
    };
  }, [open, playing, el, slot]);

  const current = options.find(([v]) => v === value)?.[1] ?? value;
  return (
    <div className="field anim-picker">
      <span>{label}</span>
      <button type="button" onClick={() => setOpen(!open)}>
        {current}
      </button>
      {open && (
        <div className="anim-grid">
          {options.map(([kind, name]) => (
            <button
              type="button"
              key={kind}
              title={name}
              className={kind === value ? "active" : undefined}
              onMouseEnter={() => setHover(kind)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                onChange(kind);
                setOpen(false);
              }}
            >
              {kind !== "none" && (
                <canvas
                  width={W * DPR}
                  height={H * DPR}
                  style={{ width: W, height: H }}
                  ref={(c) => {
                    if (c) canvases.current.set(kind, c);
                    else canvases.current.delete(kind);
                  }}
                />
              )}
              <small>{name}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
