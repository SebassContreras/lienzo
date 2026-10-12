export type Palette = "ocean" | "neon" | "sunset" | "mono";

/** Series colours, used in turn for bars and slices. */
export const PALETTES: Record<Palette, { label: string; colors: string[] }> = {
  ocean: {
    label: "Océano",
    colors: ["#3b82f6", "#22d3ee", "#6366f1", "#14b8a6", "#0ea5e9", "#818cf8"],
  },
  neon: {
    label: "Neón",
    colors: ["#f472b6", "#a78bfa", "#22d3ee", "#4ade80", "#facc15", "#fb923c"],
  },
  sunset: {
    label: "Atardecer",
    colors: ["#f97316", "#ef4444", "#ec4899", "#f59e0b", "#e11d48", "#fb7185"],
  },
  mono: {
    label: "Monocromo",
    colors: ["#f8fafc", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155"],
  },
};
