import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Boxes,
  Copy,
  Group,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ResolvedFont } from "../model/font-files.ts";
import {
  type Element,
  isStaticMode,
  type Scene,
  type Shot,
  SIZE_PRESETS,
} from "../model/model.ts";
import type { AlignAction } from "./align.ts";
import { Check, Color, Num, Section, Select } from "./controls.tsx";
import { FieldEditor } from "./field-editor.tsx";
import { ReviewSection } from "./scene/review-section.tsx";
import { ShotsSection } from "./scene/shots-section.tsx";
import { SymbolsSection } from "./scene/symbols-section.tsx";
import { OriginPicker } from "./widgets/origin-picker.tsx";

export function ElementInspector({
  el,
  onChange,
  onDelete,
  onDuplicate,
  onLayer,
  onSavePreset,
  onUngroup,
  onMakeSymbol,
  onEditParticle,
  onCropMode,
  nameOf,
  canvas,
  time,
  staticMode,
  fonts,
  shots,
  symbols,
}: {
  el: Element;
  onChange: (el: Element) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 1 | -1) => void;
  onSavePreset?: (name: string) => void;
  onUngroup?: () => void;
  /** Turns the selected top-level group into a symbol (062/D3). */
  onMakeSymbol?: () => void;
  onEditParticle?: () => void;
  onCropMode?: () => void;
  nameOf: (id: string) => string;
  /** Scene size, for "Ajustar al lienzo". */
  canvas?: { width: number; height: number; duration?: number };
  /** The playhead, for keyframes (015). */
  time?: number;
  /** When true, hides animation sections and keyframe controls (033). */
  staticMode?: boolean;
  /** The active project's fonts, for the font picker (045/D4). */
  fonts?: readonly ResolvedFont[];
  /** The scene's shots when `el` is top-level and can bind to one (062/D2). */
  shots?: readonly Shot[];
  /** The scene's symbol names, for the `use` picker (062/D3). */
  symbols?: readonly string[];
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
      {shots && shots.length > 0 && (
        <Section title="Toma">
          <Select
            label="Toma"
            value={el.shot ?? ""}
            options={[
              ["", "Sin toma"],
              ...shots.map((sh) => [sh.id, sh.name] as const),
            ]}
            onChange={(id) =>
              change((d) => {
                if (id) d.shot = id;
                else delete d.shot;
              })
            }
          />
        </Section>
      )}
      <FieldEditor
        el={el}
        change={change}
        ctx={{
          nameOf,
          canvas,
          onUngroup,
          onEditParticle,
          onCropMode,
          time,
          staticMode,
          fonts,
          symbols,
        }}
      />
      {!staticMode && el.kind !== "line" && (
        <OriginPicker
          value={el.origin}
          onChange={(origin) =>
            change((d) => {
              d.origin = origin;
            })
          }
        />
      )}
      {onMakeSymbol && (
        <Section title="Símbolo">
          <button type="button" onClick={onMakeSymbol}>
            <Boxes size={15} /> Crear símbolo desde el grupo
          </button>
          <div className="hint">
            El grupo pasa a los símbolos de la escena y queda una instancia en
            su lugar.
          </div>
        </Section>
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
            Se guarda como JSON en el proyecto activo y aparece en la pestaña
            Presets.
          </div>
        </Section>
      )}
    </div>
  );
}

/** The alignment buttons, in the order shown (022). */
const ALIGN: [AlignAction, string, typeof AlignStartVertical][] = [
  ["left", "Alinear a la izquierda", AlignStartVertical],
  ["centerX", "Centrar horizontalmente", AlignCenterVertical],
  ["right", "Alinear a la derecha", AlignEndVertical],
  ["top", "Alinear arriba", AlignStartHorizontal],
  ["centerY", "Centrar verticalmente", AlignCenterHorizontal],
  ["bottom", "Alinear abajo", AlignEndHorizontal],
  ["distributeX", "Distribuir horizontalmente", AlignHorizontalSpaceAround],
  ["distributeY", "Distribuir verticalmente", AlignVerticalSpaceAround],
];

/** Shown while several elements are selected. */
export function MultiInspector({
  count,
  onDelete,
  onDuplicate,
  onGroup,
  onAlign,
  onUseAsParticle,
}: {
  count: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onAlign: (action: AlignAction) => void;
  /** Set when the selection is a particles element and one other element. */
  onUseAsParticle?: () => void;
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
      <div className="icon-row pad">
        {ALIGN.map(([action, title, Icon]) => (
          <button
            key={action}
            type="button"
            title={title}
            onClick={() => onAlign(action)}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div className="hint pad">
        Arrastra cualquiera de ellos para moverlos juntos. Mayús + clic añade o
        quita elementos de la selección. Ctrl+G los agrupa.
      </div>
      {onUseAsParticle && (
        <div className="pad">
          <button type="button" onClick={onUseAsParticle}>
            <Sparkles size={15} /> Usar como partícula
          </button>
        </div>
      )}
    </div>
  );
}

export function SceneInspector({
  scene,
  onChange,
  focusBackground = 0,
  onSaveBackground,
  onEditSymbol,
  symbolMode = false,
  time,
}: {
  scene: Scene;
  onChange: (s: Scene) => void;
  /** Opens a symbol for editing; the section is hidden without it (062/D4). */
  onEditSymbol?: (name: string) => void;
  /** Editing a symbol: only its size is shown, the rest would be dropped (062/D7). */
  symbolMode?: boolean;
  /** The playhead (s), for camera keyframes. */
  time?: number;
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
  if (symbolMode) {
    return (
      <div className="inspector">
        <div className="inspector-head">
          <div className="name">Símbolo</div>
        </div>
        <Section title="Tamaño del símbolo">
          <Num
            label="Ancho"
            value={scene.width}
            min={10}
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
            min={10}
            max={4000}
            onChange={(v) =>
              change((d) => {
                d.height = Math.round(v);
              })
            }
          />
          <div className="hint">
            Las instancias escalan su contenido a su propia caja.
          </div>
        </Section>
      </div>
    );
  }
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
        {!isStaticMode(scene) && (
          <>
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
          </>
        )}
      </Section>
      {!isStaticMode(scene) && (
        <ShotsSection scene={scene} onChange={onChange} time={time} />
      )}
      {onEditSymbol && <SymbolsSection scene={scene} onEdit={onEditSymbol} />}
      <ReviewSection scene={scene} />
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
