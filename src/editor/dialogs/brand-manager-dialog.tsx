import { AlertTriangle, Briefcase, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  ColorPalette,
  ProjectCanvasDefaults,
} from "../../model/project.ts";
import { PROJECT_SLUG_REGEX } from "../../model/project.ts";
import type { ProjectDetails } from "../../service/project-store.ts";
import { BrandAssetManager } from "../brand/brand-asset-manager.tsx";
import { BrandFontManager } from "../brand/brand-font-manager.tsx";
import { BrandPaletteEditor } from "../brand/brand-palette-editor.tsx";

export type BrandManagerMode = "create" | "edit";

export type BrandManagerDialogProps = {
  isOpen: boolean;
  mode: BrandManagerMode;
  initialSlug?: string;
  onClose: () => void;
  onProjectSaved: (
    slug: string,
    palette?: ColorPalette,
    canvasDefaults?: ProjectCanvasDefaults,
  ) => void;
  onProjectDeleted?: (slug: string) => void;
  /** After a font is added in the Fuentes tab (045/D5). */
  onFontsChanged?: () => void;
  setStatus: (msg: string) => void;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BrandManagerDialog({
  isOpen,
  mode,
  initialSlug,
  onClose,
  onProjectSaved,
  onProjectDeleted,
  onFontsChanged,
  setStatus,
}: BrandManagerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAuto, setSlugAuto] = useState(true);
  const [description, setDescription] = useState("");
  const [palette, setPalette] = useState<ColorPalette>({
    primary: "#3b82f6",
    custom: [],
  });
  const [canvas, setCanvas] = useState<ProjectCanvasDefaults>({
    width: 1080,
    height: 1080,
    fps: 30,
    duration: 5,
  });
  const [assets, setAssets] = useState<string[]>([]);

  // Dialog & Async UI State
  const [activeTab, setActiveTab] = useState<
    "identity" | "palette" | "canvas" | "assets" | "fonts"
  >("identity");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setShowDeleteConfirm(false);
    setErrorMsg("");
    setActiveTab("identity");

    if (mode === "create") {
      setName("");
      setSlug("");
      setSlugAuto(true);
      setDescription("");
      setPalette({ primary: "#3b82f6", custom: [] });
      setCanvas({ width: 1080, height: 1080, fps: 30, duration: 5 });
      setAssets([]);
    } else if (mode === "edit" && initialSlug) {
      setLoading(true);
      setSlug(initialSlug);
      setSlugAuto(false);
      fetch(`/api/projects/${initialSlug}`)
        .then((res) => {
          if (!res.ok)
            throw new Error("No se pudo cargar la información del proyecto");
          return res.json();
        })
        .then((data: ProjectDetails) => {
          setName(data.manifest.name);
          setDescription(data.manifest.description ?? "");
          setPalette(data.manifest.palette);
          if (data.manifest.canvas) {
            setCanvas(data.manifest.canvas);
          }
          setAssets(data.assets ?? []);
        })
        .catch((err) => {
          setErrorMsg(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, mode, initialSlug]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (mode === "create" && slugAuto) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugAuto(false);
    setSlug(val.toLowerCase());
  };

  const handleAssetUploaded = (filename: string) => {
    setAssets((prev) => [...prev, filename]);
    setStatus(`Recurso añadido a la marca: ${filename}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("El nombre del proyecto es obligatorio");
      setActiveTab("identity");
      return;
    }

    const cleanSlug = slug.trim();
    if (!PROJECT_SLUG_REGEX.test(cleanSlug)) {
      setErrorMsg(
        "El identificador (slug) debe contener solo letras minúsculas, números y guiones",
      );
      setActiveTab("identity");
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "create") {
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          palette,
          canvas,
          fonts: [],
        };

        const res = await fetch(
          `/api/projects?slug=${encodeURIComponent(cleanSlug)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `Error al crear proyecto (${res.status})`,
          );
        }

        setStatus(`Proyecto «${name}» creado exitosamente`);
        onProjectSaved(cleanSlug, palette, canvas);
        onClose();
      } else {
        // Edit Mode (PATCH)
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          palette,
          canvas,
        };

        const res = await fetch(
          `/api/projects/${encodeURIComponent(cleanSlug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `Error al actualizar proyecto (${res.status})`,
          );
        }

        setStatus(`Proyecto «${name}» actualizado`);
        onProjectSaved(cleanSlug, palette, canvas);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialSlug) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/projects/${encodeURIComponent(initialSlug)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Error al eliminar proyecto (${res.status})`,
        );
      }
      setStatus(`Proyecto «${initialSlug}» eliminado`);
      onProjectDeleted?.(initialSlug);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="brand-manager-dialog"
      style={{
        background: "#18181b",
        color: "#f4f4f5",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "12px",
        padding: "0",
        maxWidth: "680px",
        width: "90vw",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Briefcase size={20} color="#3b82f6" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              {mode === "create"
                ? "Nuevo Proyecto de Marca"
                : `Configurar Marca: ${name || slug}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "8px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {[
            { id: "identity", label: "Identidad" },
            { id: "palette", label: "Colores" },
            { id: "canvas", label: "Lienzo" },
            { id: "assets", label: `Recursos (${assets.length})` },
            { id: "fonts", label: "Fuentes" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                background:
                  activeTab === tab.id
                    ? "rgba(59, 130, 246, 0.15)"
                    : "transparent",
                color:
                  activeTab === tab.id ? "#60a5fa" : "rgba(255,255,255,0.6)",
                border:
                  activeTab === tab.id
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid transparent",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {errorMsg && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "rgba(255,255,255,0.5)",
                fontSize: "13px",
              }}
            >
              Cargando información del proyecto...
            </div>
          ) : (
            <>
              {activeTab === "identity" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      htmlFor="brand-field-0"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Nombre del Proyecto / Marca{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      id="brand-field-0"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej. Acme Studios"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px",
                        color: "inherit",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="brand-field-1"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Identificador / Carpeta (Slug){" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      id="brand-field-1"
                      type="text"
                      required
                      disabled={mode === "edit"}
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="acme-studios"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background:
                          mode === "edit"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px",
                        color:
                          mode === "edit" ? "rgba(255,255,255,0.5)" : "inherit",
                        fontSize: "13px",
                        fontFamily: "monospace",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      Ubicación: projects/{slug || "<slug>"}/
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="brand-field-2"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Descripción (Opcional)
                    </label>
                    <textarea
                      id="brand-field-2"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles de la marca, notas o pautas de estilo..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px",
                        color: "inherit",
                        fontSize: "13px",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "palette" && (
                <BrandPaletteEditor
                  value={palette}
                  onChange={setPalette}
                  disabled={submitting}
                />
              )}

              {activeTab === "canvas" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}
                  >
                    Dimensiones y tasa de refresco predeterminadas para nuevos
                    lienzos de esta marca.
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        htmlFor="brand-field-3"
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        Ancho (px)
                      </label>
                      <input
                        id="brand-field-3"
                        type="number"
                        min={100}
                        max={4096}
                        value={canvas.width}
                        onChange={(e) =>
                          setCanvas({
                            ...canvas,
                            width: Number(e.target.value) || 1080,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          color: "inherit",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="brand-field-4"
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        Alto (px)
                      </label>
                      <input
                        id="brand-field-4"
                        type="number"
                        min={100}
                        max={4096}
                        value={canvas.height}
                        onChange={(e) =>
                          setCanvas({
                            ...canvas,
                            height: Number(e.target.value) || 1080,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          color: "inherit",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="brand-field-5"
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        Fotogramas por Segundo (FPS)
                      </label>
                      <input
                        id="brand-field-5"
                        type="number"
                        min={10}
                        max={60}
                        value={canvas.fps}
                        onChange={(e) =>
                          setCanvas({
                            ...canvas,
                            fps: Number(e.target.value) || 30,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          color: "inherit",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="brand-field-6"
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        Duración Inicial (segundos)
                      </label>
                      <input
                        id="brand-field-6"
                        type="number"
                        min={1}
                        max={300}
                        step={0.5}
                        value={canvas.duration}
                        onChange={(e) =>
                          setCanvas({
                            ...canvas,
                            duration: Number(e.target.value) || 5,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          color: "inherit",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "fonts" && (
                <BrandFontManager
                  slug={mode === "edit" ? initialSlug : undefined}
                  onFontsChanged={onFontsChanged}
                />
              )}

              {activeTab === "assets" && (
                <BrandAssetManager
                  slug={mode === "edit" ? initialSlug : slug}
                  assets={assets}
                  onAssetUploaded={handleAssetUploaded}
                  disabled={mode === "create" && !slug}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div>
            {mode === "edit" && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#ef4444",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
                <span>Eliminar proyecto</span>
              </button>
            )}

            {showDeleteConfirm && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "11px", color: "#fca5a5" }}>
                  ¿Confirmas eliminar este proyecto?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "inherit",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: submitting || loading ? "not-allowed" : "pointer",
              }}
            >
              {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
              <span>
                {mode === "create" ? "Crear Proyecto" : "Guardar Cambios"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
