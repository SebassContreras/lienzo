/**
 * The inspector generated from a descriptor (D3): one control per field by its type, and a
 * widget of its own for each custom field or widget a descriptor names.
 */
import { ImageUp, Link2Off, Maximize, Shuffle, Ungroup } from "lucide-react";
import { type ReactNode, useState } from "react";
import { descriptorOf } from "../components/index.ts";
import { imageSize } from "../engine/images.ts";
import type {
  Element,
  Endpoint,
  GroupEl,
  ImageEl,
  ParticlesEl,
} from "../model/model.ts";
import { uploadAsset } from "../presets/store.ts";
import { Check, Color, Num, Section, Select, TextArea } from "./controls.tsx";
import { IconPicker } from "./icon-picker.tsx";
import {
  inspectorLayout,
  type LayoutItem,
  resolve,
  valueAt,
  writeField,
} from "./layout.ts";

export type Change = (fn: (draft: Element) => void) => void;

/** What widgets may need from the editor around the inspector. */
export type EditorContext = {
  nameOf: (id: string) => string;
  /** Scene size, for "Ajustar al lienzo". */
  canvas?: { width: number; height: number };
  onUngroup?: () => void;
  onUpload?: (file: File) => Promise<{ src: string; aspect: number }>;
};

type WidgetProps = {
  el: Element;
  item: LayoutItem;
  value: unknown;
  label: string;
  change: Change;
  ctx: EditorContext;
};

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

function Connection({ item, value, label, change, ctx }: WidgetProps) {
  const end = value as Endpoint;
  const key = item.path[item.path.length - 1] as "a" | "b";
  return end.attach ? (
    <div className="attached">
      <span>
        {label}: conectado a <b>{ctx.nameOf(end.attach)}</b>
      </span>
      <button
        type="button"
        title="Desconectar"
        onClick={() =>
          change((d) => {
            if (d.kind === "line") d[key].attach = undefined;
          })
        }
      >
        <Link2Off size={14} />
      </button>
    </div>
  ) : (
    <div className="hint">
      {label}: libre. Arrástralo sobre una tarjeta o texto para conectarlo.
    </div>
  );
}

/** Custom fields and widgets, by the name descriptors give them. */
const WIDGETS: Record<string, (p: WidgetProps) => ReactNode> = {
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
  image: (p) => <ImageUpload {...p} />,
  connection: (p) => <Connection {...p} />,
  "group-info": ({ el }) => (
    <div className="hint">
      {(el as GroupEl).children.length} elementos. Se mueven, cambian de tamaño
      y se animan juntos.
    </div>
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
  if (field.type === "widget" || field.type === "custom") {
    const render = WIDGETS[field.widget];
    if (!render) throw new Error(`unknown inspector widget ${field.widget}`);
    return render({ el, item, value, label, change, ctx });
  }
  const write = (v: unknown) => change((d) => writeField(d, path, field, v));
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
  return inspectorLayout(d as never, el)
    .filter((s) => s.items.length > 0)
    .map((s) => (
      <Section key={s.title} title={s.title} open={s.open}>
        {s.items.map((item) => (
          <Control
            key={item.path.join(".")}
            el={el}
            item={item}
            change={change}
            ctx={ctx}
          />
        ))}
      </Section>
    ));
}
