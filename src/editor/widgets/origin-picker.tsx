/** The pivot of rotation and scale: a 3×3 anchor grid plus numeric `x`, `y` (062/D6). */
import { AnchorNameSchema } from "../../model/compact.ts";
import { resolveOrigin } from "../../service/compact/layout.ts";
import { Num, Section } from "../controls.tsx";

type Origin = { x: number; y: number };

export function OriginPicker({
  value,
  onChange,
}: {
  value: Origin | undefined;
  onChange: (origin: Origin) => void;
}) {
  const origin = value ?? { x: 0.5, y: 0.5 };
  return (
    <Section title="Pivote" open={false}>
      <div className="origin-grid">
        {AnchorNameSchema.options.map((name) => {
          const at = resolveOrigin(name);
          const active = at.x === origin.x && at.y === origin.y;
          return (
            <button
              type="button"
              key={name}
              title={name}
              aria-label={`Pivote ${name}`}
              aria-pressed={active}
              className={active ? "active" : ""}
              onClick={() => onChange(at)}
            />
          );
        })}
      </div>
      <Num
        label="X"
        value={origin.x}
        max={1}
        step={0.01}
        onChange={(x) => onChange({ ...origin, x })}
      />
      <Num
        label="Y"
        value={origin.y}
        max={1}
        step={0.01}
        onChange={(y) => onChange({ ...origin, y })}
      />
    </Section>
  );
}
