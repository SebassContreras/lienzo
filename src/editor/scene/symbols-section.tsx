/** The scene inspector's "Símbolos" section: the scene's symbols and their instances (062/D3). */
import { Pencil } from "lucide-react";
import type { Scene } from "../../model/model.ts";
import { instanceCount } from "../../model/symbols.ts";
import { Section } from "../controls.tsx";

export function SymbolsSection({
  scene,
  onEdit,
}: {
  scene: Scene;
  /** Opens the symbol `name` for editing (062/D4). */
  onEdit: (name: string) => void;
}) {
  const names = Object.keys(scene.symbols ?? {});
  return (
    <Section title="Símbolos" open={names.length > 0}>
      {names.map((name) => (
        <div key={name} className="attached">
          <span>
            {name} · {instanceCount(scene, name)} instancia(s)
          </span>
          <button
            type="button"
            title="Editar símbolo"
            onClick={() => onEdit(name)}
          >
            <Pencil size={14} /> Editar
          </button>
        </div>
      ))}
      {names.length === 0 && (
        <div className="hint">
          Selecciona un grupo y usa «Crear símbolo desde el grupo».
        </div>
      )}
    </Section>
  );
}
