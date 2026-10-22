import { Briefcase, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ColorPalette, ProjectCanvasDefaults } from "../model/project.ts";
import type { ProjectSummary } from "../service/project-store.ts";
import { BrandManagerDialog } from "./dialogs/brand-manager-dialog.tsx";

export type ProjectSelectorProps = {
  activeSlug?: string;
  onSelectProject: (
    slug: string | undefined,
    palette?: ColorPalette,
    canvasDefaults?: ProjectCanvasDefaults,
  ) => void;
  setStatus: (status: string) => void;
};

export function ProjectSelector({
  activeSlug,
  onSelectProject,
  setStatus,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      // Ignore fetch error in offline/unit test mode
    } finally {
      setLoading(false);
    }
  }, []);

  // Latest callback without re-running the effect when the parent passes a new one.
  const onSelectRef = useRef(onSelectProject);
  onSelectRef.current = onSelectProject;

  useEffect(() => {
    fetchProjects();
    if (activeSlug) {
      fetch(`/api/projects/${activeSlug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((details) => {
          if (details?.manifest) {
            onSelectRef.current(
              activeSlug,
              details.manifest.palette,
              details.manifest.canvas,
            );
          }
        })
        .catch(() => {});
    }
  }, [fetchProjects, activeSlug]);

  const handleChange = async (slug: string) => {
    if (!slug) {
      onSelectProject(undefined, undefined, undefined);
      setStatus("Proyecto activo: ninguno (global)");
      return;
    }

    try {
      const res = await fetch(`/api/projects/${slug}`);
      if (res.ok) {
        const details = await res.json();
        onSelectProject(
          slug,
          details.manifest.palette,
          details.manifest.canvas,
        );
        setStatus(`Proyecto activo: «${details.manifest.name}»`);
      } else {
        onSelectProject(slug, undefined, undefined);
      }
    } catch {
      onSelectProject(slug, undefined, undefined);
    }
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleOpenEdit = () => {
    if (!activeSlug) return;
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleProjectSaved = (
    savedSlug: string,
    palette?: ColorPalette,
    canvasDefaults?: ProjectCanvasDefaults,
  ) => {
    fetchProjects();
    onSelectProject(savedSlug, palette, canvasDefaults);
  };

  const handleProjectDeleted = (deletedSlug: string) => {
    fetchProjects();
    if (activeSlug === deletedSlug) {
      onSelectProject(undefined, undefined, undefined);
      setStatus("Proyecto eliminado. Espacio global activo.");
    }
  };

  return (
    <>
      <div
        className="project-selector"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <span
          title="Espacio de trabajo del proyecto"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <Briefcase size={16} />
        </span>
        <select
          value={activeSlug ?? "mi-proyecto"}
          disabled={loading}
          title="Seleccionar espacio de trabajo de proyecto"
          onChange={(e) => handleChange(e.target.value)}
          style={{
            background: "transparent",
            color: "inherit",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "12px",
          }}
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug} style={{ background: "#222" }}>
              {p.name}
            </option>
          ))}
          {projects.length === 0 && (
            <option value="mi-proyecto" style={{ background: "#222" }}>
              Mi Proyecto
            </option>
          )}
        </select>

        {/* Brand Manager Triggers (R1, D1, D6) */}
        <button
          type="button"
          title="Crear nuevo proyecto de marca"
          onClick={handleOpenCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "inherit",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          <Plus size={13} />
          <span>Nuevo Proyecto</span>
        </button>

        {activeSlug && (
          <button
            type="button"
            title={`Configurar marca (${activeSlug})`}
            onClick={handleOpenEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#93c5fd",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            <Settings size={13} />
            <span>Configurar Marca</span>
          </button>
        )}
      </div>

      <BrandManagerDialog
        isOpen={dialogOpen}
        mode={dialogMode}
        initialSlug={dialogMode === "edit" ? activeSlug : undefined}
        onClose={() => setDialogOpen(false)}
        onProjectSaved={handleProjectSaved}
        onProjectDeleted={handleProjectDeleted}
        setStatus={setStatus}
      />
    </>
  );
}
