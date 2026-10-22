import type { FontOrigin, ResolvedFont } from "../../model/font-files.ts";
import { FONTS } from "../../model/fonts.ts";

const GROUP_LABELS: Record<FontOrigin, string> = {
  bundled: "Incluidas",
  global: "Globales",
  project: "Proyecto",
};

export type FontGroup = { label: string; families: string[] };

/**
 * The font picker's groups (045/D4): one family per entry, by origin; a current value no
 * font provides is kept as its own group so the select still shows it.
 */
export function fontGroups(
  fonts: readonly ResolvedFont[],
  current: string,
): FontGroup[] {
  const groups = (["bundled", "global", "project"] as const)
    .map((origin) => ({
      label: GROUP_LABELS[origin],
      families: [
        ...new Set(
          fonts.filter((f) => f.origin === origin).map((f) => f.family),
        ),
      ],
    }))
    .filter((g) => g.families.length > 0);
  const known = groups.some((g) => g.families.includes(current));
  return known || !current
    ? groups
    : [...groups, { label: "No disponible", families: [current] }];
}

export function FontSelect({
  label,
  value,
  fonts,
  onChange,
}: {
  label: string;
  value: string;
  /** The project's fonts; before they load, the bundled ones. */
  fonts?: readonly ResolvedFont[];
  onChange: (family: string) => void;
}) {
  const available =
    fonts && fonts.length > 0
      ? fonts
      : FONTS.map((family) => ({
          family,
          weight: 400,
          origin: "bundled" as const,
        }));
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {fontGroups(available, value).map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.families.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
