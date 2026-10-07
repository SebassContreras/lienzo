import { type MutableRefObject, useEffect, useRef, useState } from "react";
import {
  type Box,
  boxesTouch,
  boxOf,
  hitTest,
  indexById,
  type Pt,
  quadAt,
  resolveLine,
  samplePath,
  translate,
} from "../engine/geometry.ts";
import { drawScene } from "../engine/render.ts";
import type { Element, LineEl, Scene } from "../model/model.ts";

export type Clock = { t: number; playing: boolean };

export const PRESET_MIME = "application/x-lienzo-element";

type Handle = "nw" | "ne" | "sw" | "se" | "a" | "b" | "bend";

type Drag =
  | {
      mode: "move";
      start: Pt;
      /** The moving elements as they were when the drag started, and that scene's index. */
      origs: Element[];
      byId: Map<string, Element>;
    }
  | { mode: "resize"; handle: Handle; start: Pt; orig: Element }
  | { mode: "end"; which: "a" | "b"; orig: LineEl }
  | { mode: "bend"; orig: LineEl }
  | { mode: "box"; start: Pt; end: Pt; base: string[] };

/** The rectangle spanned by two corners. */
const spanBox = (a: Pt, b: Pt): Box => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(a.x - b.x),
  h: Math.abs(a.y - b.y),
});

/** Ids of the elements a selection box touches. */
function idsInBox(scene: Scene, box: Box): string[] {
  const byId = indexById(scene);
  return scene.elements
    .filter((el) => {
      if (el.kind !== "line") return boxesTouch(box, boxOf(el));
      const r = resolveLine(el, byId);
      return boxesTouch(box, spanBox(r.a, r.b));
    })
    .map((el) => el.id);
}

const ACCENT = "#38bdf8";
const ATTACH = "#4ade80";

function corners(el: Element) {
  const b = boxOf(el);
  return {
    nw: { x: b.x, y: b.y },
    ne: { x: b.x + b.w, y: b.y },
    sw: { x: b.x, y: b.y + b.h },
    se: { x: b.x + b.w, y: b.y + b.h },
  };
}

function handleAt(
  scene: Scene,
  el: Element,
  p: Pt,
  tol: number,
): Handle | undefined {
  const near = (q: Pt) => Math.hypot(p.x - q.x, p.y - q.y) <= tol;
  if (el.kind === "line") {
    const r = resolveLine(el, indexById(scene));
    if (near(r.a)) return "a";
    if (near(r.b)) return "b";
    if (near(quadAt(r, 0.5))) return "bend";
    return undefined;
  }
  const c = corners(el);
  return (Object.keys(c) as (keyof typeof c)[]).find((k) => near(c[k]));
}

const CURSORS: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  a: "crosshair",
  b: "crosshair",
  bend: "grab",
};

/** Every element moved by the drag, from where it was when the drag started. */
function applyMove(drag: Extract<Drag, { mode: "move" }>, p: Pt): Element[] {
  const dx = p.x - drag.start.x;
  const dy = p.y - drag.start.y;
  const moving = new Set(drag.origs.map((el) => el.id));
  return drag.origs.map((el) => translate(el, dx, dy, drag.byId, moving));
}

function applyDrag(
  drag: Exclude<Drag, { mode: "move" } | { mode: "box" }>,
  p: Pt,
  scene: Scene,
  setAttachTarget: (id: string | undefined) => void,
  tol: number,
): Element {
  if (drag.mode === "resize") {
    const o = drag.orig;
    const dx = p.x - drag.start.x;
    const dy = p.y - drag.start.y;
    const h = drag.handle;
    if (o.kind !== "text" && o.kind !== "line") {
      const MIN = 16;
      let { x, y, w, h: height } = o;
      if (h === "ne" || h === "se") w = Math.max(MIN, o.w + dx);
      if (h === "nw" || h === "sw") {
        x = Math.min(o.x + dx, o.x + o.w - MIN);
        w = o.x + o.w - x;
      }
      if (h === "sw" || h === "se") height = Math.max(MIN, o.h + dy);
      if (h === "nw" || h === "ne") {
        y = Math.min(o.y + dy, o.y + o.h - MIN);
        height = o.y + o.h - y;
      }
      if (o.kind === "image" && o.keepAspect && o.aspect > 0) {
        // the dragged corner sets the width; the height follows the picture's shape
        height = w / o.aspect;
        if (h === "nw" || h === "ne") y = o.y + o.h - height;
      }
      return { ...o, x, y, w, h: height };
    }
    if (o.kind === "text") {
      const b = boxOf(o);
      const east = h === "ne" || h === "se";
      const north = h === "nw" || h === "ne";
      const newW = east ? b.w + dx : b.w - dx;
      const ratio = Math.max(0.05, newW / b.w);
      const size = Math.max(6, Math.round(o.size * ratio));
      const k = size / o.size;
      return {
        ...o,
        size,
        x: east ? o.x : o.x + b.w - b.w * k,
        y: north ? o.y + b.h - b.h * k : o.y,
      };
    }
    return o;
  }

  if (drag.mode === "end") {
    const target = hitTest(
      scene,
      p,
      tol,
      drag.orig.id,
      (el) => el.kind !== "line",
    );
    setAttachTarget(target?.id);
    const current = scene.elements.find((e) => e.id === drag.orig.id) as
      | LineEl
      | undefined;
    const base = current ?? drag.orig;
    return { ...base, [drag.which]: { x: p.x, y: p.y, attach: target?.id } };
  }

  // bend
  const current = (scene.elements.find((e) => e.id === drag.orig.id) ??
    drag.orig) as LineEl;
  const r = resolveLine({ ...current, bend: 0 }, indexById(scene));
  const mid = { x: (r.a.x + r.b.x) / 2, y: (r.a.y + r.b.y) / 2 };
  const dx = r.b.x - r.a.x;
  const dy = r.b.y - r.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / len, y: dx / len };
  const bend = 2 * ((p.x - mid.x) * n.x + (p.y - mid.y) * n.y);
  return { ...current, bend: Math.round(bend) };
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  selection: string[],
  hoverId: string | undefined,
  attachId: string | undefined,
  band: Box | undefined,
  zoom: number,
): void {
  const px = 1 / zoom;
  const byId = indexById(scene);
  ctx.save();
  ctx.lineWidth = 1.5 * px;

  const outline = (el: Element, color: string, pad: number) => {
    if (el.kind === "line") {
      const s = samplePath(resolveLine(el, byId), 40);
      ctx.strokeStyle = color;
      ctx.beginPath();
      s.pts.forEach((q, i) => {
        if (i) ctx.lineTo(q.x, q.y);
        else ctx.moveTo(q.x, q.y);
      });
      ctx.stroke();
      return;
    }
    const b = boxOf(el);
    ctx.strokeStyle = color;
    ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
  };

  if (hoverId && !selection.includes(hoverId)) {
    const el = byId.get(hoverId);
    if (el) {
      ctx.setLineDash([4 * px, 4 * px]);
      outline(el, "rgba(56, 189, 248, 0.6)", 2 * px);
      ctx.setLineDash([]);
    }
  }

  if (attachId) {
    const el = byId.get(attachId);
    if (el) {
      ctx.lineWidth = 3 * px;
      outline(el, ATTACH, 6 * px);
      ctx.lineWidth = 1.5 * px;
    }
  }

  // several selected: an outline each, no handles
  if (selection.length > 1) {
    ctx.setLineDash([5 * px, 4 * px]);
    for (const id of selection) {
      const el = byId.get(id);
      if (el) outline(el, ACCENT, 2 * px);
    }
    ctx.setLineDash([]);
  }

  if (band) {
    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    ctx.strokeStyle = ACCENT;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.strokeRect(band.x, band.y, band.w, band.h);
  }

  const sel =
    selection.length === 1 ? byId.get(selection[0] as string) : undefined;
  if (sel) {
    const dot = (q: Pt, fill: string, square = false) => {
      const r = 5 * px;
      ctx.fillStyle = fill;
      ctx.strokeStyle = ACCENT;
      ctx.beginPath();
      if (square) ctx.rect(q.x - r, q.y - r, r * 2, r * 2);
      else ctx.arc(q.x, q.y, r + px, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    if (sel.kind === "line") {
      ctx.setLineDash([5 * px, 4 * px]);
      outline(sel, ACCENT, 0);
      ctx.setLineDash([]);
      const r = resolveLine(sel, byId);
      dot(r.a, sel.a.attach ? ATTACH : "#ffffff");
      dot(r.b, sel.b.attach ? ATTACH : "#ffffff");
      const m = quadAt(r, 0.5);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(Math.PI / 4);
      dot({ x: 0, y: 0 }, "#fde68a", true);
      ctx.restore();
    } else {
      outline(sel, ACCENT, 0);
      for (const q of Object.values(corners(sel))) dot(q, "#ffffff", true);
    }
  }
  ctx.restore();
}

export function Stage({
  scene,
  sceneRef,
  setScene,
  selection,
  setSelection,
  clock,
  checkpoint,
  onDropElement,
  hint,
}: {
  scene: Scene;
  sceneRef: MutableRefObject<Scene>;
  setScene: (s: Scene) => void;
  /** Ids of the selected elements, in the order they were picked. */
  selection: string[];
  setSelection: (ids: string[]) => void;
  clock: MutableRefObject<Clock>;
  checkpoint: () => void;
  onDropElement: (el: Element, at: Pt) => void;
  /** A short tip shown over the bottom of the stage. */
  hint?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ w: 800, h: 600 });
  const drag = useRef<Drag | null>(null);
  const hover = useRef<string | undefined>(undefined);
  const attachTarget = useRef<string | undefined>(undefined);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const zoom = Math.max(
    0.05,
    Math.min((view.w - 48) / scene.width, (view.h - 48) / scene.height),
  );
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry)
        setView({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const s = sceneRef.current;
      if (clock.current.playing) {
        clock.current.t = (clock.current.t + dt) % s.duration;
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const z = zoomRef.current;
        ctx.setTransform(z * dpr, 0, 0, z * dpr, 0, 0);
        drawScene(ctx, s, clock.current.t);
        const d = drag.current;
        drawOverlay(
          ctx,
          s,
          selectionRef.current,
          hover.current,
          attachTarget.current,
          d?.mode === "box" ? spanBox(d.start, d.end) : undefined,
          z,
        );
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, dpr, sceneRef]);

  const toScene = (e: { clientX: number; clientY: number }): Pt => {
    const r = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
  };

  const replace = (...changed: Element[]) => {
    const byId = new Map(changed.map((el) => [el.id, el]));
    const s = sceneRef.current;
    setScene({
      ...s,
      elements: s.elements.map((e) => byId.get(e.id) ?? e),
    });
  };

  /** The single selected element, which shows resize and line handles. */
  const single = () =>
    selection.length === 1
      ? sceneRef.current.elements.find((el) => el.id === selection[0])
      : undefined;

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toScene(e);
    const tol = 9 / zoom;
    const s = sceneRef.current;
    const sel = single();
    if (sel && !e.shiftKey) {
      const h = handleAt(s, sel, p, tol);
      if (h) {
        checkpoint();
        if (sel.kind === "line" && (h === "a" || h === "b")) {
          drag.current = { mode: "end", which: h, orig: sel };
        } else if (sel.kind === "line") {
          drag.current = { mode: "bend", orig: sel };
        } else {
          drag.current = { mode: "resize", handle: h, start: p, orig: sel };
        }
        return;
      }
    }
    const hit = hitTest(s, p, tol);
    if (!hit) {
      // empty canvas: start a selection box (shift adds to the selection)
      const base = e.shiftKey ? selection : [];
      if (!e.shiftKey) setSelection([]);
      drag.current = { mode: "box", start: p, end: p, base };
      return;
    }
    if (e.shiftKey) {
      setSelection(
        selection.includes(hit.id)
          ? selection.filter((id) => id !== hit.id)
          : [...selection, hit.id],
      );
      drag.current = null;
      return;
    }
    const ids = selection.includes(hit.id) ? selection : [hit.id];
    if (ids !== selection) setSelection(ids);
    checkpoint();
    drag.current = {
      mode: "move",
      start: p,
      origs: s.elements.filter((el) => ids.includes(el.id)),
      byId: indexById(s),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toScene(e);
    const tol = 9 / zoom;
    const s = sceneRef.current;
    const canvas = e.currentTarget;
    if (!drag.current) {
      const sel = single();
      const h = sel ? handleAt(s, sel, p, tol) : undefined;
      const hit = hitTest(s, p, tol);
      hover.current = hit?.id;
      canvas.style.cursor = h ? CURSORS[h] : hit ? "move" : "default";
      return;
    }
    const d = drag.current;
    if (d.mode === "box") {
      d.end = p;
      const touched = idsInBox(s, spanBox(d.start, d.end));
      setSelection([
        ...d.base,
        ...touched.filter((id) => !d.base.includes(id)),
      ]);
      return;
    }
    if (d.mode === "move") {
      replace(...applyMove(d, p));
      return;
    }
    replace(
      applyDrag(
        d,
        p,
        s,
        (id) => {
          attachTarget.current = id;
        },
        tol,
      ),
    );
  };

  const onPointerUp = () => {
    drag.current = null;
    attachTarget.current = undefined;
  };

  return (
    <div
      className="stage"
      role="application"
      aria-label="Lienzo"
      ref={wrapRef}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(PRESET_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const json = e.dataTransfer.getData(PRESET_MIME);
        if (!json) return;
        e.preventDefault();
        onDropElement(JSON.parse(json) as Element, toScene(e));
      }}
    >
      <canvas
        ref={canvasRef}
        width={Math.round(scene.width * zoom * dpr)}
        height={Math.round(scene.height * zoom * dpr)}
        style={{ width: scene.width * zoom, height: scene.height * zoom }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          hover.current = undefined;
        }}
      />
      {hint && <div className="stage-hint">{hint}</div>}
    </div>
  );
}
