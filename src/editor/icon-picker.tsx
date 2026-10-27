import { createElement, useEffect, useMemo, useState } from "react";
import { iconSet } from "../engine/icon-shapes.ts";

/** The lucide icon set, or undefined until it has downloaded (066/D5); re-renders then. */
function useIconSet() {
  const [set, setSet] = useState(iconSet.get);
  useEffect(() => {
    if (set) return;
    let live = true;
    iconSet.load().then(
      (loaded) => {
        if (live) setSet(loaded);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [set]);
  return set;
}

/** Most icons shown at once; typing narrows the list. */
const MAX_SHOWN = 60;

/** Lucide's node data rendered as an inline SVG. */
export function IconSvg({ name, size = 20 }: { name: string; size?: number }) {
  const node = useIconSet()?.iconNode(name) ?? [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {node.map(([tag, attrs], i) =>
        createElement(tag, { key: `${tag}-${i}`, ...attrs }),
      )}
    </svg>
  );
}

/** Words of a PascalCase name, lower case: "ArrowUpRight" → "arrow up right". */
const words = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();

/** Filters icon names by every word typed, in any order. */
function filterIcons(query: string, names: string[]): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return names;
  return names.filter((name) => {
    const hay = `${words(name)} ${name.toLowerCase()}`;
    return terms.every((t) => hay.includes(t));
  });
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const names = useIconSet()?.ICON_NAMES;
  const matches = useMemo(
    () => (names ? filterIcons(query, names) : []),
    [query, names],
  );
  return (
    <div className="icon-picker">
      <div className="icon-current">
        <IconSvg name={value} size={22} />
        <span>{value}</span>
      </div>
      <input
        type="search"
        placeholder="Buscar icono (en inglés: user, cloud…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="icon-grid">
        {matches.slice(0, MAX_SHOWN).map((name) => (
          <button
            type="button"
            key={name}
            title={name}
            className={name === value ? "active" : undefined}
            onClick={() => onChange(name)}
          >
            <IconSvg name={name} />
          </button>
        ))}
      </div>
      <div className="hint">
        {matches.length === 0
          ? "Ningún icono coincide."
          : matches.length > MAX_SHOWN
            ? `${MAX_SHOWN} de ${matches.length}; escribe para filtrar.`
            : `${matches.length} iconos.`}
      </div>
    </div>
  );
}
