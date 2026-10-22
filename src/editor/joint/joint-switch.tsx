import { Users } from "lucide-react";

/** The "Modo conjunto" switch at the top of the Escenas tab (050/D7). */
export function JointSwitch({
  on,
  available,
  onChange,
}: {
  on: boolean;
  /** False without a dev server, where the editor cannot see the agent's writes. */
  available: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label
      className="joint-switch"
      title={
        available
          ? "Ves en tiempo real lo que el agente edita en este proyecto y le corriges entre turnos"
          : "Solo disponible con pnpm dev"
      }
    >
      <input
        type="checkbox"
        checked={on}
        disabled={!available}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Users size={14} /> Modo conjunto
    </label>
  );
}
