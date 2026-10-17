import { Palette, Plus, Trash2 } from "lucide-react";
import type { ColorPalette } from "../../model/project.ts";

export type BrandPaletteEditorProps = {
  value: ColorPalette;
  onChange: (palette: ColorPalette) => void;
  disabled?: boolean;
};

interface PaletteColorField {
  key: keyof Omit<ColorPalette, "custom">;
  label: string;
  description: string;
  required?: boolean;
}

const PALETTE_FIELDS: PaletteColorField[] = [
  {
    key: "primary",
    label: "Primario",
    description: "Color principal de marca",
    required: true,
  },
  {
    key: "secondary",
    label: "Secundario",
    description: "Color de soporte o contraste",
  },
  {
    key: "accent",
    label: "Acento",
    description: "Llamadas a la acción y destaques",
  },
  {
    key: "surface",
    label: "Superficie",
    description: "Fondos de tarjetas y contenedores",
  },
  {
    key: "background",
    label: "Fondo",
    description: "Fondo predeterminado del lienzo",
  },
  { key: "text", label: "Texto", description: "Color tipográfico principal" },
];

export function BrandPaletteEditor({
  value,
  onChange,
  disabled = false,
}: BrandPaletteEditorProps) {
  const updateField = (
    key: keyof Omit<ColorPalette, "custom">,
    colorVal: string,
  ) => {
    onChange({
      ...value,
      [key]: colorVal || undefined,
    });
  };

  const handleCustomChange = (index: number, colorVal: string) => {
    const nextCustom = [...(value.custom ?? [])];
    nextCustom[index] = colorVal;
    onChange({ ...value, custom: nextCustom });
  };

  const addCustomColor = () => {
    onChange({
      ...value,
      custom: [...(value.custom ?? []), "#6366f1"],
    });
  };

  const removeCustomColor = (index: number) => {
    const nextCustom = [...(value.custom ?? [])];
    nextCustom.splice(index, 1);
    onChange({ ...value, custom: nextCustom });
  };

  return (
    <div
      className="brand-palette-editor"
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 600,
          fontSize: "13px",
        }}
      >
        <Palette size={16} />
        <span>Paleta de Colores de la Marca</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {PALETTE_FIELDS.map(({ key, label, description, required }) => {
          const currentColor =
            (value[key] as string | undefined) ??
            (key === "primary" ? "#3b82f6" : "");
          return (
            <div
              key={key}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label style={{ fontSize: "12px", fontWeight: 500 }}>
                  {label}{" "}
                  {required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <span
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}
                >
                  {description}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="color"
                  disabled={disabled}
                  value={currentColor || "#000000"}
                  onChange={(e) => updateField(key, e.target.value)}
                  style={{
                    width: "28px",
                    height: "28px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: 0,
                    background: "transparent",
                  }}
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={currentColor}
                  placeholder={required ? "#3b82f6" : "(Opcional)"}
                  onChange={(e) => updateField(key, e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    color: "inherit",
                    padding: "4px 8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 500 }}>
            Colores Adicionales / Personalizados
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={addCustomColor}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              padding: "3px 8px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "4px",
              color: "inherit",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={12} />
            <span>Agregar color</span>
          </button>
        </div>

        {!value.custom || value.custom.length === 0 ? (
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
            }}
          >
            Sin colores secundarios adicionales definidos.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {value.custom.map((c, idx) => (
              <div
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                }}
              >
                <input
                  type="color"
                  disabled={disabled}
                  value={c}
                  onChange={(e) => handleCustomChange(idx, e.target.value)}
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "none",
                    borderRadius: "3px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: 0,
                    background: "transparent",
                  }}
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={c}
                  onChange={(e) => handleCustomChange(idx, e.target.value)}
                  style={{
                    width: "72px",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeCustomColor(idx)}
                  title="Eliminar color"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
