/**
 * The inspector generated from a descriptor (D3): one control per field by its type, and a
 * widget of its own for each custom field or widget a descriptor names.
 */
import {
  Box,
  CircleDot,
  ImageUp,
  Link2Off,
  Maximize,
  Pencil,
  Shuffle,
  Ungroup,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { descriptorOf } from "../components/index.ts";
import { ANCHORS } from "../components/line/descriptor.ts";
import type { ThreeEl } from "../components/three/descriptor.ts";
import { lateSlots } from "../engine/anim.ts";
import { imageSize } from "../engine/assets.ts";
import { applyTracks, writeAt } from "../engine/tracks.ts";
import type {
  Element,
  Endpoint,
  GroupEl,
  ImageEl,
  ParticlesEl,
} from "../model/model.ts";
import { MODEL_FILES, uploadAsset } from "../presets/store.ts";
import { AnimPicker } from "./anim-picker.tsx";
import { Check, Color, Num, Section, Select, TextArea } from "./controls.tsx";
import { IconPicker } from "./icon-picker.tsx";
import { ChannelSection, KeyButton } from "./keyframe-controls.tsx";
import {
  fieldValue,
  inspectorLayout,
  type LayoutItem,
  resolve,
  valueAt,
  writeField,
} from "./layout.ts";
import { PathShapes } from "./path-shapes.tsx";

export type Change = (fn: (draft: Element) => void) => void;

/** What widgets may need from the editor around the inspector. */
export type EditorContext = {
  nameOf: (id: string) => string;
  /** Scene size, for "Ajustar al lienzo"; its duration, for the animation warning. */
  canvas?: { width: number; height: number; duration?: number };
  onUngroup?: () => void;
  /** Puts a particles element's template back on the canvas to be edited. */
  onEditParticle?: () => void;
  /** Opens the crop handles of the selected image on the stage (048/D6). */
  onCropMode?: () => void;
  onUpload?: (file: File) => Promise<{ src: string; aspect: number }>;
  /** The playhead (s): fields show their value there and keyframes are set there (015). */
  time?: number;
  /** When true (static mode), hides keyframe controls and animation sections (033). */
  staticMode?: boolean;
  /** Fonts the active project can use, for the font picker (045/D4). */
  fonts?: readonly ResolvedFont[];
  /** The scene's symbol names, for a `use` element's picker (062/D3). */
  symbols?: readonly string[];
};

type WidgetProps = {
  el: Element;
  item: LayoutItem;
  value: unknown;
  label: string;
  change: Change;
  ctx: EditorContext;
};

/** A slot's kind, picked from previews of the element itself playing each one. */
function AnimKindPicker({ el, item, value, label, change }: WidgetProps) {
  const { field, path } = item;
  if (field.type !== "select") return null;
  return (
    <AnimPicker
      el={el}
      slot={path[1] as "in" | "loop" | "out"}
      label={label}
      value={value as string}
      options={field.options as readonly (readonly [string, string])[]}
      onChange={(v) => change((d) => writeField(d, path, field, v))}
    />
  );
}

/** Stores a picked file in `assets/` and reads its shape once it decodes. */
async function uploadImage(file: File) {
  const src = await uploadAsset(file);
  const { width, height } = await imageSize(src);
  return { src, aspect: width / height };
}

function ImageUpload({ el, change, ctx }: WidgetProps) {
  const image = el as ImageEl;
  const onUpload = ctx.onUpload ?? uploadImage;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <label className="file-pick">
        <ImageUp size={15} />
        {busy ? "Subiendo…" : image.src ? "Cambiar imagen" : "Elegir imagen"}
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            onUpload(file)
              .then(({ src, aspect }) =>
                change((draft) => {
                  const d = draft as ImageEl;
                  d.src = src;
                  d.aspect = aspect;
                  if (d.keepAspect) d.h = d.w / aspect;
                }),
              )
              .catch((err: unknown) => setError(String(err)))
              .finally(() => setBusy(false));
          }}
        />
      </label>
      {error && <div className="hint error">{error}</div>}
      {image.src && (
        <div className="hint">
          Guardada en <code>{image.src.slice(1)}</code>
        </div>
      )}
    </>
  );
}

/** Stores a picked `.glb` in `assets/` and points the 3D element at it. */
function ModelUpload({ el, change }: WidgetProps) {
  const model = (el as ThreeEl).model;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <label className="file-pick">
        <Box size={15} />
        {busy ? "Subiendo…" : model ? "Cambiar modelo" : "Elegir modelo"}
        <input
          type="file"
          accept=".glb"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            uploadAsset(file, MODEL_FILES)
              .then((src) =>
                change((draft) => {
                  (draft as ThreeEl).model = src;
                }),
              )
              .catch((err: unknown) => setError(String(err)))
              .finally(() => setBusy(false));
          }}
        />
      </label>
      {error && <div className="hint error">{error}</div>}
      {model && (
        <div className="hint">
          Guardado en <code>{model.slice(1)}</code>
        </div>
      )}
    </>
  );
}

function Connection({ item, value, label, change, ctx }: WidgetProps) {
  const end = value as Endpoint;
  const key = item.path[item.path.length - 1] as "a" | "b";
  return end.attach ? (
    <>
      <div className="attached">
        <span>
          {label}: conectado a <b>{ctx.nameOf(end.attach)}</b>
        </span>
        <button
          type="button"
          title="Desconectar"
          onClick={() =>
            change((d) => {
              if (d.kind === "line") {
                d[key].attach = undefined;
                d[key].anchor = undefined;
              }
            })
          }
        >
          <Link2Off size={14} />
        </button>
      </div>
      <Select
        label="Ancla"
        value={end.anchor ?? "auto"}
        options={ANCHORS}
        onChange={(v) =>
          change((d) => {
            if (d.kind === "line") d[key].anchor = v === "auto" ? undefined : v;
          })
        }
      />
    </>
  ) : (
    <div className="hint">
      {label}: libre. Arrástralo sobre una tarjeta o texto para conectarlo.
    </div>
  );
}

function MaskWidget({ value, label, change, ctx }: WidgetProps) {
  const maskId = (value as string) || "";
  return maskId ? (
    <div className="attached">
      <span>
        {label}: enmascarado por <b>{ctx.nameOf(maskId)}</b>
      </span>
      <button
        type="button"
        title="Quitar máscara"
        onClick={() =>
          change((d) => {
            const fx = (d as unknown as { effects?: { mask?: string } })
              .effects;
            if (fx) fx.mask = "";
          })
        }
      >
        <Link2Off size={14} />
      </button>
    </div>
  ) : (
    <div className="hint">{label}: sin máscara.</div>
  );
}

import type { SubtitleCue } from "../engine/subtitles/types.ts";
/** Custom fields and widgets, by the name descriptors give them. */
import type { ResolvedFont } from "../model/font-files.ts";
import { CuesEditor } from "./widgets/cues-editor.tsx";
import { FontSelect } from "./widgets/font-select.tsx";
import { ImageCropTools } from "./widgets/image-crop.tsx";

const WIDGETS: Record<string, (p: WidgetProps) => ReactNode> = {
  "cues-editor": ({ value, change, ctx }) => (
    <CuesEditor
      cues={(value as SubtitleCue[]) ?? []}
      audioDuration={ctx.canvas?.duration}
      onChange={(cues) =>
        change((d) => {
          (d as unknown as { cues: SubtitleCue[] }).cues = cues;
        })
      }
    />
  ),
  icon: ({ value, change }) => (
    <IconPicker
      value={value as string}
      onChange={(v) =>
        change((d) => {
          if (d.kind === "icon") d.icon = v;
        })
      }
    />
  ),
  symbol: ({ item, value, label, change, ctx }) => {
    const names = ctx.symbols ?? [];
    const current = value as string;
    return (
      <Select
        label={label}
        value={current}
        options={[
          ...(names.includes(current)
            ? []
            : [
                [
                  current,
                  current ? `${current} (no existe)` : "Elige un símbolo",
                ] as const,
              ]),
          ...names.map((n) => [n, n] as const),
        ]}
        onChange={(v) =>
          change((d) => {
            if (item.field.type === "text")
              writeField(d, item.path, item.field, v);
          })
        }
      />
    );
  },
  font: ({ item, value, label, change, ctx }) => (
    <FontSelect
      label={label}
      value={value as string}
      fonts={ctx.fonts}
      onChange={(v) =>
        change((d) => {
          if (item.field.type === "select")
            writeField(d, item.path, item.field, v);
        })
      }
    />
  ),
  image: (p) => <ImageUpload {...p} />,
  model: (p) => <ModelUpload {...p} />,
  "path-shapes": ({ el, change }) =>
    el.kind === "path" && <PathShapes el={el} change={change} />,
  "anim-kind": (p) => <AnimKindPicker {...p} />,
  connection: (p) => <Connection {...p} />,
  mask: (p) => <MaskWidget {...p} />,
  "group-info": ({ el }) => (
    <div className="hint">
      {(el as GroupEl).children.length} elementos. Se mueven, cambian de tamaño
      y se animan juntos.
    </div>
  ),
  "anim-late": ({ el, ctx }) => {
    const duration = ctx.canvas?.duration;
    const late = duration === undefined ? [] : lateSlots(el.anim, duration);
    return (
      late.length > 0 && (
        <div className="hint error">
          {late.join(" y ")} {late.length > 1 ? "terminan" : "termina"} después
          del final de la escena ({duration} s); no se verá completa.
        </div>
      )
    );
  },
  "image-crop": ({ el, change, ctx }) => (
    <ImageCropTools
      el={el as ImageEl}
      onChange={(next) => change((d) => Object.assign(d, next))}
      onCropMode={ctx.onCropMode}
    />
  ),
  ungroup: ({ ctx }) =>
    ctx.onUngroup && (
      <button type="button" onClick={ctx.onUngroup}>
        <Ungroup size={15} /> Desagrupar (Ctrl+Mayús+G)
      </button>
    ),
  reseed: ({ change }) => (
    <button
      type="button"
      title="Coloca los puntos en otras posiciones"
      onClick={() =>
        change((d) => {
          (d as ParticlesEl).seed = 1 + Math.floor(Math.random() * 9999);
        })
      }
    >
      <Shuffle size={15} /> Redistribuir
    </button>
  ),
  "particle-template": ({ el, change, ctx }) =>
    (el as ParticlesEl).template ? (
      <>
        <div className="hint">
          Cada punto dibuja <b>{(el as ParticlesEl).template?.name}</b>.
        </div>
        {ctx.onEditParticle && (
          <button type="button" onClick={ctx.onEditParticle}>
            <Pencil size={15} /> Editar partícula
          </button>
        )}
        <button
          type="button"
          title="Vuelve al punto simple"
          onClick={() =>
            change((d) => {
              (d as ParticlesEl).template = null;
            })
          }
        >
          <CircleDot size={15} /> Usar puntos
        </button>
      </>
    ) : (
      <div className="hint">
        Para que cada punto sea otro elemento, selecciónalo junto con estas
        partículas (Mayús + clic) y pulsa «Usar como partícula».
      </div>
    ),
  "fit-canvas": ({ change, ctx }) => {
    const { canvas } = ctx;
    return (
      canvas && (
        <button
          type="button"
          title="Cubre toda la publicación"
          onClick={() =>
            change((d) => {
              const p = d as ParticlesEl;
              p.x = 0;
              p.y = 0;
              p.w = canvas.width;
              p.h = canvas.height;
            })
          }
        >
          <Maximize size={15} /> Ajustar al lienzo
        </button>
      )
    );
  },
};

/** The widget names descriptors may use. */
export const WIDGET_NAMES = Object.keys(WIDGETS);

/** One row of the inspector: the control `item`'s field type calls for. */
function Control({
  el,
  item,
  change,
  ctx,
}: {
  el: Element;
  item: LayoutItem;
  change: Change;
  ctx: EditorContext;
}) {
  const { field, parent, path } = item;
  const value = valueAt(el, path);
  const label = field.type === "widget" ? "" : resolve(field.label, parent);
  if (
    field.type === "widget" ||
    field.type === "custom" ||
    ((field.type === "select" || field.type === "text") && field.widget)
  ) {
    const render = WIDGETS[field.widget as string];
    if (!render) throw new Error(`unknown inspector widget ${field.widget}`);
    return render({ el, item, value, label, change, ctx });
  }
  const key = path.join(".");
  const t = ctx.time;
  const keyed = t !== undefined && isAnimatable(el.kind, key);
  const write = (v: unknown) =>
    change((d) =>
      keyed
        ? writeAt(
            d,
            key,
            fieldValue(field, v) as number | string,
            t,
            (dd, vv) => writeField(dd, path, field, vv),
          )
        : writeField(d, path, field, v),
    );
  switch (field.type) {
    case "number":
      return (
        <Num
          label={label}
          value={value as number}
          min={resolve(field.min, parent)}
          max={resolve(field.max, parent)}
          step={field.step}
          onChange={write}
        />
      );
    case "color":
      return <Color label={label} value={value as string} onChange={write} />;
    case "check":
      return (
        <Check label={label} checked={value as boolean} onChange={write} />
      );
    case "text":
      return (
        <TextArea label={label} value={value as string} onChange={write} />
      );
    case "select": {
      const options = field.options.map(([v, l]) => [String(v), l] as const);
      return (
        <Select
          label={label}
          value={String(value)}
          options={options}
          onChange={(v) =>
            write(field.options.find(([o]) => String(o) === v)?.[0] ?? v)
          }
        />
      );
    }
  }
}

/** Every section of `el`'s inspector, generated from its kind's descriptor. */
export function FieldEditor({
  el,
  change,
  ctx,
}: {
  el: Element;
  change: Change;
  ctx: EditorContext;
}) {
  const d = descriptorOf(el.kind);
  if (!d) return null;
  const t = ctx.time;
  // what the element is at the playhead, so keyframed fields show their value there
  const shown = t !== undefined && el.tracks ? applyTracks(el, t).el : el;
  const isStatic = Boolean(ctx.staticMode);
  const sections = inspectorLayout(d as never, shown)
    .filter((s) => s.items.length > 0)
    .filter((s) => !isStatic || s.title !== "Animación")
    .map((s) => (
      <Section key={s.title} title={s.title} open={s.open}>
        {s.items.map((item) => {
          const key = item.path.join(".");
          const control = (
            <Control
              key={key}
              el={shown}
              item={item}
              change={change}
              ctx={ctx}
            />
          );
          return !isStatic && t !== undefined && d.animatable.includes(key) ? (
            <div className="keyed" key={key}>
              {control}
              <KeyButton el={el} path={key} t={t} change={change} />
            </div>
          ) : (
            control
          );
        })}
      </Section>
    ));
  return (
    <>
      {sections}
      {!isStatic && t !== undefined && el.kind !== "line" && (
        <ChannelSection el={el} t={t} change={change} />
      )}
    </>
  );
}

/** Keyframes may drive `path` of an element of `kind`. */
const isAnimatable = (kind: string, path: string) =>
  descriptorOf(kind)?.animatable.includes(path) ?? false;
