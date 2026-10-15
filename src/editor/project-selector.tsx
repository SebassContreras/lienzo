import { Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import type { ColorPalette } from "../model/project.ts";
import type { ProjectSummary } from "../service/project-store.ts";

export type ProjectSelectorProps = {
  activeSlug?: string;
  onSelectProject: (slug: string | undefined, palette?: ColorPalette) => void;
  setStatus: (status: string) => void;
};

export function ProjectSelector({
  activeSlug,
  onSelectProject,
  setStatus,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = async (slug: string) => {
    if (!slug) {
      onSelectProject(undefined, undefined);
      setStatus("Proyecto activo: ninguno (global)");
      return;
    }

    try {
      const res = await fetch(`/api/projects/${slug}`);
      if (res.ok) {
        const details = await res.json();
        onSelectProject(slug, details.manifest.palette);
        setStatus(`Proyecto activo: «${details.manifest.name}»`);
      } else {
        onSelectProject(slug, undefined);
      }
    } catch {
      onSelectProject(slug, undefined);
    }
  };

  return (
    <div className="project-selector" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span title="Espacio de trabajo del proyecto" style={{ display: "inline-flex", alignItems: "center" }}>
        <Briefcase size={16} />
      </span>
      <select
        value={activeSlug ?? ""}
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
        <option value="" style={{ background: "#222" }}>
          (Sin proyecto - Global)
        </option>
        {projects.map((p) => (
          <option key={p.slug} value={p.slug} style={{ background: "#222" }}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
