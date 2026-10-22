/** The inspector's basic controls: a collapsible section and one row per value. */
import type { ReactNode, Ref } from "react";
import { useProject } from "./project-context.ts";

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
  const { palette } = useProject();
  const swatches = palette
    ? [
        palette.primary,
        palette.secondary,
        palette.accent,
        palette.background,
        palette.surface,
        palette.text,
        ...(palette.custom ?? []),
      ].filter(
        (c): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c),
      )
    : [];

  return (
    <div className="color-field-container">
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
            if (/^#[0-9a-f]{6}$/i.test(e.target.value))
              onChange(e.target.value);
          }}
        />
      </label>
      {swatches.length > 0 && (
        <div
          className="color-swatches"
          style={{
            display: "flex",
            gap: "4px",
            padding: "2px 0 6px 0",
            flexWrap: "wrap",
          }}
        >
          {swatches.map((color, idx) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: swatches may repeat a colour; colour plus position is unique
              key={`${color}-${idx}`}
              type="button"
              title={`Color de marca: ${color}`}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "3px",
                backgroundColor: color,
                border:
                  color.toLowerCase() === value.toLowerCase()
                    ? "2px solid #fff"
                    : "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      )}
    </div>
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

export function TextArea({
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
