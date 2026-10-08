import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Copy,
  Group,
  ImageUp,
  Link2Off,
  Maximize,
  Shuffle,
  Trash2,
  Ungroup,
} from "lucide-react";
import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { imageSize } from "../engine/images.ts";
import {
  ANIM_LABELS,
  ANIMS_BY_KIND,
  type Anim,
  type AnimKind,
  type Element,
  type FlowKind,
  FONTS,
  type Glow,
  type GroupEl,
  type IconEl,
  type ImageEl,
  type LineEl,
  type ParticlesEl,
  type Scene,
  type Shadow,
  type ShapeEl,
  SIZE_PRESETS,
  type StrokeStyle,
  type TextEl,
} from "../model/model.ts";
import { uploadAsset } from "../presets/store.ts";
import { IconPicker } from "./icon-picker.tsx";

/** Stores a picked file in `assets/` and reads its shape once it decodes. */
async function uploadImage(file: File) {
  const src = await uploadAsset(file);
  const { width, height } = await imageSize(src);
  return { src, aspect: width / height };
}

/* ---------- small field controls ---------- */

export function Section({
  title,
  children,
  open = true,
  ref,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  ref?: Ref<HTMLDetailsElement>;
}) {
  return (
    <details className="section" open={open} ref={ref}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

export function Num({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        className="num"
        type="number"
        step={step}
        value={Number(value.toFixed(2))}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

export function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="hex"
        value={value}
        onChange={(e) => {
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value);
        }}
      />
    </label>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="field check">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field column">
      <span>{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const STROKES = [
  ["solid", "Continuo"],
  ["dashed", "Guiones"],
  ["dotted", "Puntos"],
] as const satisfies readonly (readonly [StrokeStyle, string])[];
const ALIGNS = [
  ["left", "Izquierda"],
  ["center", "Centro"],
  ["right", "Derecha"],
] as const;
const FLOWS = [
  ["none", "Ninguno"],
  ["pulse", "Pulsos de luz"],
  ["ants", "Camino de hormigas"],
  ["comet", "Cometa"],
] as const satisfies readonly (readonly [FlowKind, string])[];
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const fontOptions = FONTS.map((f) => [f, f] as const);
const weightOptions = WEIGHTS.map((w) => [String(w), String(w)] as const);

function GlowFields({
  glow,
  onChange,
}: {
  glow: Glow;
  onChange: (g: Glow) => void;
}) {
  return (
    <>
      <Check
        label="Activo"
        checked={glow.enabled}
        onChange={(enabled) => onChange({ ...glow, enabled })}
      />
      {glow.enabled && (
        <>
          <Color
            label="Color"
            value={glow.color}
            onChange={(color) => onChange({ ...glow, color })}
          />
          <Num
            label="Difusión"
            value={glow.blur}
            max={150}
            onChange={(blur) => onChange({ ...glow, blur })}
          />
          <Num
            label="Intensidad"
            value={glow.strength}
            min={1}
            max={4}
            onChange={(strength) => onChange({ ...glow, strength })}
          />
        </>
      )}
    </>
  );
}

function ShadowFields({
  shadow,
  onChange,
}: {
  shadow: Shadow;
  onChange: (s: Shadow) => void;
}) {
  return (
    <>
      <Check
        label="Activa"
        checked={shadow.enabled}
        onChange={(enabled) => onChange({ ...shadow, enabled })}
      />
      {shadow.enabled && (
        <>
          <Color
            label="Color"
            value={shadow.color}
            onChange={(color) => onChange({ ...shadow, color })}
          />
          <Num
            label="Opacidad"
            value={shadow.opacity}
            max={1}
            step={0.01}
            onChange={(opacity) => onChange({ ...shadow, opacity })}
          />
          <Num
            label="Difusión"
            value={shadow.blur}
            max={150}
            onChange={(blur) => onChange({ ...shadow, blur })}
          />
          <Num
            label="X"
            value={shadow.x}
            min={-100}
            max={100}
            onChange={(x) => onChange({ ...shadow, x })}
          />
          <Num
            label="Y"
            value={shadow.y}
            min={-100}
            max={100}
            onChange={(y) => onChange({ ...shadow, y })}
          />
        </>
      )}
    </>
  );
}

function AnimFields({
  anim,
  kinds,
  onChange,
}: {
  anim: Anim;
  kinds: AnimKind[];
  onChange: (a: Anim) => void;
}) {
  const loops = ["float", "pulse", "breathe"].includes(anim.kind);
  const usesAmount = ["float", "pulse", "breathe", "slide-up"].includes(
    anim.kind,
  );
  return (
    <>
      <Select
        label="Tipo"
        value={anim.kind}
        options={kinds.map((k) => [k, ANIM_LABELS[k]] as const)}
        onChange={(kind) => onChange({ ...anim, kind })}
      />
      {usesAmount && (
        <Num
          label={
            anim.kind === "float" || anim.kind === "slide-up"
              ? "Distancia"
              : "Intensidad %"
          }
          value={anim.amount}
          max={anim.kind === "breathe" ? 100 : 80}
          onChange={(amount) => onChange({ ...anim, amount })}
        />
      )}
      {loops && (
        <Num
          label="Ciclos / loop"
          value={anim.cycles}
          min={1}
          max={8}
          onChange={(cycles) => onChange({ ...anim, cycles })}
        />
      )}
      {anim.kind !== "none" && (
        <Num
          label="Retraso (s)"
          value={anim.delay}
          max={5}
          step={0.1}
          onChange={(delay) => onChange({ ...anim, delay })}
        />
      )}
    </>
  );
}

/* ---------- per-kind inspectors ---------- */

type Change<T> = (fn: (draft: T) => void) => void;

function ShapeInspector({
  el,
  change,
}: {
  el: ShapeEl;
  change: Change<ShapeEl>;
}) {
  return (
    <>
      <Section title="Forma">
        <Num
          label="Ancho"
          value={el.w}
          min={10}
          max={1600}
          onChange={(v) =>
            change((d) => {
              d.w = v;
            })
          }
        />
        <Num
          label="Alto"
          value={el.h}
          min={10}
          max={1600}
          onChange={(v) =>
            change((d) => {
              d.h = v;
            })
          }
        />
        {el.kind === "rect" && (
          <Num
            label="Esquinas"
            value={el.radius}
            max={300}
            onChange={(v) =>
              change((d) => {
                if (d.kind === "rect") d.radius = v;
              })
            }
          />
        )}
      </Section>
      <Section title="Fondo">
        <Color
          label="Color"
          value={el.fill.color}
          onChange={(v) =>
            change((d) => {
              d.fill.color = v;
            })
          }
        />
        <Check
          label="Degradado"
          checked={el.fill.gradient}
          onChange={(v) =>
            change((d) => {
              d.fill.gradient = v;
            })
          }
        />
        {el.fill.gradient && (
          <>
            <Color
              label="Color 2"
              value={el.fill.color2}
              onChange={(v) =>
                change((d) => {
                  d.fill.color2 = v;
                })
              }
            />
            <Num
              label="Ángulo"
              value={el.fill.angle}
              max={360}
              onChange={(v) =>
                change((d) => {
                  d.fill.angle = v;
                })
              }
            />
          </>
        )}
        <Num
          label="Opacidad"
          value={el.fill.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.fill.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Brillo de fondo">
        <GlowFields
          glow={el.bgGlow}
          onChange={(g) =>
            change((d) => {
              d.bgGlow = g;
            })
          }
        />
      </Section>
      <Section title="Borde">
        <Num
          label="Grosor"
          value={el.border.width}
          max={20}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.border.width = v;
            })
          }
        />
        <Color
          label="Color"
          value={el.border.color}
          onChange={(v) =>
            change((d) => {
              d.border.color = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.border.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.border.opacity = v;
            })
          }
        />
        <Select
          label="Estilo"
          value={el.border.style}
          options={STROKES}
          onChange={(v) =>
            change((d) => {
              d.border.style = v;
            })
          }
        />
        {el.border.style !== "solid" && (
          <Num
            label="Movimiento"
            value={el.border.flow}
            min={-20}
            max={20}
            onChange={(v) =>
              change((d) => {
                d.border.flow = v;
              })
            }
          />
        )}
      </Section>
      <Section title="Brillo del borde">
        <GlowFields
          glow={el.borderGlow}
          onChange={(g) =>
            change((d) => {
              d.borderGlow = g;
            })
          }
        />
      </Section>
      <Section title="Sombra" open={false}>
        <ShadowFields
          shadow={el.shadow}
          onChange={(v) =>
            change((d) => {
              d.shadow = v;
            })
          }
        />
      </Section>
      <Section title="Texto interior">
        <TextArea
          label="Texto"
          value={el.label.text}
          onChange={(v) =>
            change((d) => {
              d.label.text = v;
            })
          }
        />
        <Select
          label="Fuente"
          value={el.label.font}
          options={fontOptions}
          onChange={(v) =>
            change((d) => {
              d.label.font = v;
            })
          }
        />
        <Num
          label="Tamaño"
          value={el.label.size}
          min={8}
          max={200}
          onChange={(v) =>
            change((d) => {
              d.label.size = v;
            })
          }
        />
        <Select
          label="Peso"
          value={String(el.label.weight)}
          options={weightOptions}
          onChange={(v) =>
            change((d) => {
              d.label.weight = Number(v);
            })
          }
        />
        <Color
          label="Color"
          value={el.label.color}
          onChange={(v) =>
            change((d) => {
              d.label.color = v;
            })
          }
        />
        <Select
          label="Alineación"
          value={el.label.align}
          options={ALIGNS}
          onChange={(v) =>
            change((d) => {
              d.label.align = v;
            })
          }
        />
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND[el.kind]}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

function ImageInspector({
  el,
  change,
  onUpload,
}: {
  el: ImageEl;
  change: Change<ImageEl>;
  onUpload: (file: File) => Promise<{ src: string; aspect: number }>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Section title="Imagen">
        <label className="file-pick">
          <ImageUp size={15} />
          {busy ? "Subiendo…" : el.src ? "Cambiar imagen" : "Elegir imagen"}
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
                  change((d) => {
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
        {el.src && (
          <div className="hint">
            Guardada en <code>{el.src.slice(1)}</code>
          </div>
        )}
      </Section>
      <Section title="Forma">
        <Num
          label="Ancho"
          value={el.w}
          min={10}
          max={2000}
          onChange={(v) =>
            change((d) => {
              d.w = v;
              if (d.keepAspect) d.h = v / d.aspect;
            })
          }
        />
        <Num
          label="Alto"
          value={el.h}
          min={10}
          max={2000}
          onChange={(v) =>
            change((d) => {
              d.h = v;
              if (d.keepAspect) d.w = v * d.aspect;
            })
          }
        />
        <Check
          label="Proporción"
          checked={el.keepAspect}
          onChange={(v) =>
            change((d) => {
              d.keepAspect = v;
              if (v) d.h = d.w / d.aspect;
            })
          }
        />
        <Num
          label="Esquinas"
          value={el.radius}
          max={300}
          onChange={(v) =>
            change((d) => {
              d.radius = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Borde">
        <Num
          label="Grosor"
          value={el.border.width}
          max={20}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.border.width = v;
            })
          }
        />
        {el.border.width > 0 && (
          <>
            <Color
              label="Color"
              value={el.border.color}
              onChange={(v) =>
                change((d) => {
                  d.border.color = v;
                })
              }
            />
            <Num
              label="Opacidad"
              value={el.border.opacity}
              max={1}
              step={0.01}
              onChange={(v) =>
                change((d) => {
                  d.border.opacity = v;
                })
              }
            />
          </>
        )}
      </Section>
      <Section title="Sombra" open={false}>
        <ShadowFields
          shadow={el.shadow}
          onChange={(v) =>
            change((d) => {
              d.shadow = v;
            })
          }
        />
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.image}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

function GroupInspector({
  el,
  change,
  onUngroup,
}: {
  el: GroupEl;
  change: Change<GroupEl>;
  onUngroup?: () => void;
}) {
  return (
    <>
      <Section title="Grupo">
        <div className="hint">
          {el.children.length} elementos. Se mueven, cambian de tamaño y se
          animan juntos.
        </div>
        <Num
          label="Ancho"
          value={el.w}
          min={10}
          max={4000}
          onChange={(v) =>
            change((d) => {
              d.w = v;
            })
          }
        />
        <Num
          label="Alto"
          value={el.h}
          min={10}
          max={4000}
          onChange={(v) =>
            change((d) => {
              d.h = v;
            })
          }
        />
        {onUngroup && (
          <button type="button" onClick={onUngroup}>
            <Ungroup size={15} /> Desagrupar (Ctrl+Mayús+G)
          </button>
        )}
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.group}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

function IconInspector({ el, change }: { el: IconEl; change: Change<IconEl> }) {
  return (
    <>
      <Section title="Icono">
        <IconPicker
          value={el.icon}
          onChange={(v) =>
            change((d) => {
              d.icon = v;
            })
          }
        />
      </Section>
      <Section title="Trazo">
        <Num
          label="Tamaño"
          value={el.w}
          min={16}
          max={1200}
          onChange={(v) =>
            change((d) => {
              d.w = v;
              d.h = v;
            })
          }
        />
        <Num
          label="Grosor"
          value={el.stroke}
          min={0.5}
          max={4}
          step={0.25}
          onChange={(v) =>
            change((d) => {
              d.stroke = v;
            })
          }
        />
        <Color
          label="Color"
          value={el.color}
          onChange={(v) =>
            change((d) => {
              d.color = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Fondo del icono">
        <Check
          label="Activo"
          checked={el.tile.enabled}
          onChange={(v) =>
            change((d) => {
              d.tile.enabled = v;
            })
          }
        />
        {el.tile.enabled && (
          <>
            <Color
              label="Color"
              value={el.tile.color}
              onChange={(v) =>
                change((d) => {
                  d.tile.color = v;
                })
              }
            />
            <Check
              label="Degradado"
              checked={el.tile.gradient}
              onChange={(v) =>
                change((d) => {
                  d.tile.gradient = v;
                })
              }
            />
            {el.tile.gradient && (
              <>
                <Color
                  label="Color 2"
                  value={el.tile.color2}
                  onChange={(v) =>
                    change((d) => {
                      d.tile.color2 = v;
                    })
                  }
                />
                <Num
                  label="Ángulo"
                  value={el.tile.angle}
                  max={360}
                  onChange={(v) =>
                    change((d) => {
                      d.tile.angle = v;
                    })
                  }
                />
              </>
            )}
            <Num
              label="Opacidad"
              value={el.tile.opacity}
              max={1}
              step={0.01}
              onChange={(v) =>
                change((d) => {
                  d.tile.opacity = v;
                })
              }
            />
            <Num
              label="Esquinas"
              value={el.tile.radius}
              max={300}
              onChange={(v) =>
                change((d) => {
                  d.tile.radius = v;
                })
              }
            />
            <Num
              label="Margen"
              value={el.tile.padding}
              max={300}
              onChange={(v) =>
                change((d) => {
                  d.tile.padding = v;
                })
              }
            />
          </>
        )}
      </Section>
      <Section title="Brillo">
        <GlowFields
          glow={el.glow}
          onChange={(g) =>
            change((d) => {
              d.glow = g;
            })
          }
        />
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.icon}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

function TextInspector({ el, change }: { el: TextEl; change: Change<TextEl> }) {
  return (
    <>
      <Section title="Texto">
        <TextArea
          label="Contenido"
          value={el.text}
          onChange={(v) =>
            change((d) => {
              d.text = v;
            })
          }
        />
        <Select
          label="Fuente"
          value={el.font}
          options={fontOptions}
          onChange={(v) =>
            change((d) => {
              d.font = v;
            })
          }
        />
        <Num
          label="Tamaño"
          value={el.size}
          min={8}
          max={300}
          onChange={(v) =>
            change((d) => {
              d.size = v;
            })
          }
        />
        <Select
          label="Peso"
          value={String(el.weight)}
          options={weightOptions}
          onChange={(v) =>
            change((d) => {
              d.weight = Number(v);
            })
          }
        />
        <Check
          label="Cursiva"
          checked={el.italic}
          onChange={(v) =>
            change((d) => {
              d.italic = v;
            })
          }
        />
        <Select
          label="Alineación"
          value={el.align}
          options={ALIGNS}
          onChange={(v) =>
            change((d) => {
              d.align = v;
            })
          }
        />
        <Num
          label="Interlineado"
          value={el.lineHeight}
          min={0.7}
          max={2.5}
          step={0.05}
          onChange={(v) =>
            change((d) => {
              d.lineHeight = v;
            })
          }
        />
        <Num
          label="Espaciado"
          value={el.letterSpacing}
          min={-10}
          max={40}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.letterSpacing = v;
            })
          }
        />
      </Section>
      <Section title="Color">
        <Color
          label="Color"
          value={el.color}
          onChange={(v) =>
            change((d) => {
              d.color = v;
            })
          }
        />
        <Check
          label="Degradado"
          checked={el.gradient}
          onChange={(v) =>
            change((d) => {
              d.gradient = v;
            })
          }
        />
        {el.gradient && (
          <Color
            label="Color 2"
            value={el.color2}
            onChange={(v) =>
              change((d) => {
                d.color2 = v;
              })
            }
          />
        )}
        <Num
          label="Opacidad"
          value={el.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Brillo">
        <GlowFields
          glow={el.glow}
          onChange={(g) =>
            change((d) => {
              d.glow = g;
            })
          }
        />
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.text}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

function LineInspector({
  el,
  change,
  nameOf,
}: {
  el: LineEl;
  change: Change<LineEl>;
  nameOf: (id: string) => string;
}) {
  const end = (which: "a" | "b", label: string) =>
    el[which].attach ? (
      <div className="attached">
        <span>
          {label}: conectado a <b>{nameOf(el[which].attach as string)}</b>
        </span>
        <button
          type="button"
          title="Desconectar"
          onClick={() =>
            change((d) => {
              d[which].attach = undefined;
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
  return (
    <>
      <Section title="Conexión">
        {end("a", "Inicio")}
        {end("b", "Fin")}
        <Num
          label="Curva"
          value={el.bend}
          min={-400}
          max={400}
          onChange={(v) =>
            change((d) => {
              d.bend = v;
            })
          }
        />
        <Check
          label="Flecha inicio"
          checked={el.arrowStart}
          onChange={(v) =>
            change((d) => {
              d.arrowStart = v;
            })
          }
        />
        <Check
          label="Flecha fin"
          checked={el.arrowEnd}
          onChange={(v) =>
            change((d) => {
              d.arrowEnd = v;
            })
          }
        />
      </Section>
      <Section title="Trazo">
        <Num
          label="Grosor"
          value={el.width}
          min={0.5}
          max={30}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.width = v;
            })
          }
        />
        <Color
          label="Color"
          value={el.color}
          onChange={(v) =>
            change((d) => {
              d.color = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.opacity}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.opacity = v;
            })
          }
        />
        <Select
          label="Estilo"
          value={el.style}
          options={STROKES}
          onChange={(v) =>
            change((d) => {
              d.style = v;
            })
          }
        />
      </Section>
      <Section title="Brillo">
        <GlowFields
          glow={el.glow}
          onChange={(g) =>
            change((d) => {
              d.glow = g;
            })
          }
        />
      </Section>
      <Section title="Flujo animado">
        <Select
          label="Efecto"
          value={el.flow.kind}
          options={FLOWS}
          onChange={(v) =>
            change((d) => {
              d.flow.kind = v;
            })
          }
        />
        {el.flow.kind !== "none" && (
          <>
            <Color
              label="Color"
              value={el.flow.color}
              onChange={(v) =>
                change((d) => {
                  d.flow.color = v;
                })
              }
            />
            <Num
              label="Velocidad"
              value={el.flow.speed}
              min={1}
              max={30}
              onChange={(v) =>
                change((d) => {
                  d.flow.speed = v;
                })
              }
            />
            {el.flow.kind !== "ants" && (
              <Num
                label="Cantidad"
                value={el.flow.count}
                min={1}
                max={10}
                onChange={(v) =>
                  change((d) => {
                    d.flow.count = v;
                  })
                }
              />
            )}
            <Num
              label="Tamaño"
              value={el.flow.size}
              min={1}
              max={30}
              step={0.5}
              onChange={(v) =>
                change((d) => {
                  d.flow.size = v;
                })
              }
            />
            <Check
              label="Invertir sentido"
              checked={el.flow.reverse}
              onChange={(v) =>
                change((d) => {
                  d.flow.reverse = v;
                })
              }
            />
          </>
        )}
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.line}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

/* ---------- panels ---------- */

function ParticlesInspector({
  el,
  change,
  canvas,
}: {
  el: ParticlesEl;
  change: Change<ParticlesEl>;
  canvas?: { width: number; height: number };
}) {
  return (
    <>
      <Section title="Partículas">
        <Num
          label="Cantidad"
          value={el.count}
          min={1}
          max={300}
          onChange={(v) =>
            change((d) => {
              d.count = Math.round(Math.min(300, Math.max(1, v)));
            })
          }
        />
        <Num
          label="Velocidad"
          value={el.speed}
          min={1}
          max={6}
          onChange={(v) =>
            change((d) => {
              d.speed = Math.round(Math.max(1, v));
            })
          }
        />
        <Num
          label="Recorrido"
          value={el.drift}
          max={300}
          onChange={(v) =>
            change((d) => {
              d.drift = Math.max(0, v);
            })
          }
        />
        <Num
          label="Semilla"
          value={el.seed}
          min={1}
          max={9999}
          onChange={(v) =>
            change((d) => {
              d.seed = Math.round(v);
            })
          }
        />
        <button
          type="button"
          title="Coloca los puntos en otras posiciones"
          onClick={() =>
            change((d) => {
              d.seed = 1 + Math.floor(Math.random() * 9999);
            })
          }
        >
          <Shuffle size={15} /> Redistribuir
        </button>
        {canvas && (
          <button
            type="button"
            title="Cubre toda la publicación"
            onClick={() =>
              change((d) => {
                d.x = 0;
                d.y = 0;
                d.w = canvas.width;
                d.h = canvas.height;
              })
            }
          >
            <Maximize size={15} /> Ajustar al lienzo
          </button>
        )}
      </Section>
      <Section title="Puntos">
        <Num
          label="Tamaño"
          value={el.dot.size}
          max={20}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.dot.size = v;
            })
          }
        />
        <Color
          label="Color"
          value={el.dot.color}
          onChange={(v) =>
            change((d) => {
              d.dot.color = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.dot.opacity}
          max={1}
          step={0.05}
          onChange={(v) =>
            change((d) => {
              d.dot.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Líneas">
        <Num
          label="Distancia de unión"
          value={el.link.distance}
          max={400}
          onChange={(v) =>
            change((d) => {
              d.link.distance = v;
            })
          }
        />
        <Num
          label="Grosor"
          value={el.link.width}
          max={6}
          step={0.25}
          onChange={(v) =>
            change((d) => {
              d.link.width = v;
            })
          }
        />
        <Color
          label="Color"
          value={el.link.color}
          onChange={(v) =>
            change((d) => {
              d.link.color = v;
            })
          }
        />
        <Num
          label="Opacidad"
          value={el.link.opacity}
          max={1}
          step={0.05}
          onChange={(v) =>
            change((d) => {
              d.link.opacity = v;
            })
          }
        />
      </Section>
      <Section title="Brillo">
        <GlowFields
          glow={el.glow}
          onChange={(g) =>
            change((d) => {
              d.glow = g;
            })
          }
        />
      </Section>
      <Section title="Animación">
        <AnimFields
          anim={el.anim}
          kinds={ANIMS_BY_KIND.particles}
          onChange={(a) =>
            change((d) => {
              d.anim = a;
            })
          }
        />
      </Section>
    </>
  );
}

export function ElementInspector({
  el,
  onChange,
  onDelete,
  onDuplicate,
  onLayer,
  onSavePreset,
  onUngroup,
  nameOf,
  canvas,
}: {
  el: Element;
  onChange: (el: Element) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 1 | -1) => void;
  onSavePreset?: (name: string) => void;
  onUngroup?: () => void;
  nameOf: (id: string) => string;
  /** Scene size, for "Ajustar al lienzo". */
  canvas?: { width: number; height: number };
}) {
  const [presetName, setPresetName] = useState("");
  const change = <T extends Element>(fn: (draft: T) => void) => {
    const draft = structuredClone(el) as T;
    fn(draft);
    onChange(draft);
  };
  return (
    <div className="inspector">
      <div className="inspector-head">
        <input
          className="name"
          value={el.name}
          onChange={(e) =>
            change((d) => {
              d.name = e.target.value;
            })
          }
        />
        <div className="icon-row">
          <button
            type="button"
            title="Traer adelante"
            onClick={() => onLayer(1)}
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            title="Enviar atrás"
            onClick={() => onLayer(-1)}
          >
            <ArrowDown size={15} />
          </button>
          <button type="button" title="Duplicar (Ctrl+D)" onClick={onDuplicate}>
            <Copy size={15} />
          </button>
          <button type="button" title="Eliminar (Supr)" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {(el.kind === "rect" || el.kind === "ellipse") && (
        <ShapeInspector el={el} change={change} />
      )}
      {el.kind === "icon" && <IconInspector el={el} change={change} />}
      {el.kind === "group" && (
        <GroupInspector el={el} change={change} onUngroup={onUngroup} />
      )}
      {el.kind === "image" && (
        <ImageInspector el={el} change={change} onUpload={uploadImage} />
      )}
      {el.kind === "text" && <TextInspector el={el} change={change} />}
      {el.kind === "line" && (
        <LineInspector el={el} change={change} nameOf={nameOf} />
      )}
      {el.kind === "particles" && (
        <ParticlesInspector el={el} change={change} canvas={canvas} />
      )}
      {onSavePreset && (
        <Section title="Guardar como preset">
          <div className="preset-save">
            <input
              placeholder={el.name}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                onSavePreset(presetName.trim() || el.name);
                setPresetName("");
              }}
            >
              <BookmarkPlus size={15} /> Guardar
            </button>
          </div>
          <div className="hint">
            Se guarda como JSON en <code>presets/</code> y aparece en la
            biblioteca.
          </div>
        </Section>
      )}
    </div>
  );
}

/** Shown while several elements are selected. */
export function MultiInspector({
  count,
  onDelete,
  onDuplicate,
  onGroup,
}: {
  count: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
}) {
  return (
    <div className="inspector">
      <div className="inspector-head">
        <div className="name">{count} elementos</div>
        <div className="icon-row">
          <button type="button" title="Agrupar (Ctrl+G)" onClick={onGroup}>
            <Group size={15} />
          </button>
          <button type="button" title="Duplicar (Ctrl+D)" onClick={onDuplicate}>
            <Copy size={15} />
          </button>
          <button type="button" title="Eliminar (Supr)" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="hint pad">
        Arrastra cualquiera de ellos para moverlos juntos. Mayús + clic añade o
        quita elementos de la selección. Ctrl+G los agrupa.
      </div>
    </div>
  );
}

export function SceneInspector({
  scene,
  onChange,
  focusBackground = 0,
  onSaveBackground,
}: {
  scene: Scene;
  onChange: (s: Scene) => void;
  /** Each time this number changes, the "Fondo" section opens and scrolls into view. */
  focusBackground?: number;
  onSaveBackground?: (name: string) => void;
}) {
  const [backgroundName, setBackgroundName] = useState("");
  const backgroundRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const section = backgroundRef.current;
    if (!focusBackground || !section) return;
    section.open = true;
    section.scrollIntoView({ block: "start", behavior: "smooth" });
    section.classList.remove("flash");
    void section.offsetWidth;
    section.classList.add("flash");
  }, [focusBackground]);
  const change = (fn: (d: Scene) => void) => {
    const draft = structuredClone(scene);
    fn(draft);
    onChange(draft);
  };
  const bg = scene.background;
  const sizeKey = `${scene.width}x${scene.height}`;
  const sizeOptions = [
    ...SIZE_PRESETS.map((p) => [`${p.width}x${p.height}`, p.label] as const),
    ...(SIZE_PRESETS.some((p) => `${p.width}x${p.height}` === sizeKey)
      ? []
      : [[sizeKey, `Personalizado ${scene.width}×${scene.height}`] as const]),
  ];
  return (
    <div className="inspector">
      <div className="inspector-head">
        <div className="name">Publicación</div>
      </div>
      <div className="hint pad">
        Arrastra componentes desde la izquierda. Selecciona uno para editarlo.
      </div>
      <Section title="Formato">
        <Select
          label="Tamaño"
          value={sizeKey}
          options={sizeOptions}
          onChange={(v) =>
            change((d) => {
              const [w, h] = v.split("x").map(Number);
              d.width = w as number;
              d.height = h as number;
            })
          }
        />
        <Num
          label="Ancho"
          value={scene.width}
          min={200}
          max={4000}
          onChange={(v) =>
            change((d) => {
              d.width = Math.round(v);
            })
          }
        />
        <Num
          label="Alto"
          value={scene.height}
          min={200}
          max={4000}
          onChange={(v) =>
            change((d) => {
              d.height = Math.round(v);
            })
          }
        />
        <Num
          label="Duración (s)"
          value={scene.duration}
          min={1}
          max={20}
          step={0.5}
          onChange={(v) =>
            change((d) => {
              d.duration = v;
            })
          }
        />
        <Num
          label="FPS"
          value={scene.fps}
          min={10}
          max={60}
          onChange={(v) =>
            change((d) => {
              d.fps = v;
            })
          }
        />
      </Section>
      <Section title="Fondo" ref={backgroundRef}>
        <Color
          label="Color"
          value={bg.color}
          onChange={(v) =>
            change((d) => {
              d.background.color = v;
            })
          }
        />
        <Check
          label="Degradado"
          checked={bg.gradient}
          onChange={(v) =>
            change((d) => {
              d.background.gradient = v;
            })
          }
        />
        {bg.gradient && (
          <>
            <Color
              label="Color 2"
              value={bg.color2}
              onChange={(v) =>
                change((d) => {
                  d.background.color2 = v;
                })
              }
            />
            <Num
              label="Ángulo"
              value={bg.angle}
              max={360}
              onChange={(v) =>
                change((d) => {
                  d.background.angle = v;
                })
              }
            />
          </>
        )}
        <Num
          label="Luz central"
          value={bg.spotlight}
          max={1}
          step={0.01}
          onChange={(v) =>
            change((d) => {
              d.background.spotlight = v;
            })
          }
        />
        {bg.spotlight > 0 && (
          <Color
            label="Color luz"
            value={bg.spotlightColor}
            onChange={(v) =>
              change((d) => {
                d.background.spotlightColor = v;
              })
            }
          />
        )}
        <Check
          label="Puntos"
          checked={bg.dots}
          onChange={(v) =>
            change((d) => {
              d.background.dots = v;
            })
          }
        />
        {bg.dots && (
          <>
            <Color
              label="Color puntos"
              value={bg.dotColor}
              onChange={(v) =>
                change((d) => {
                  d.background.dotColor = v;
                })
              }
            />
            <Num
              label="Separación"
              value={bg.dotGap}
              min={8}
              max={120}
              onChange={(v) =>
                change((d) => {
                  d.background.dotGap = v;
                })
              }
            />
          </>
        )}
        {onSaveBackground && (
          <div className="preset-save stacked">
            <input
              placeholder="Nombre del fondo"
              value={backgroundName}
              onChange={(e) => setBackgroundName(e.target.value)}
            />
            <button
              type="button"
              title="Guardar fondo como preset"
              onClick={() => {
                onSaveBackground(backgroundName.trim() || "Mi fondo");
                setBackgroundName("");
              }}
            >
              <BookmarkPlus size={15} /> Guardar fondo como preset
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}
