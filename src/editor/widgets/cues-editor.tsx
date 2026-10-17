import { FileUp } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { parseSrt } from "../../engine/subtitles/parsers/srt.ts";
import { parseVtt } from "../../engine/subtitles/parsers/vtt.ts";
import {
  cuesToTextWithPauses,
  parseTextWithPauses,
} from "../../engine/subtitles/pauses.ts";
import {
  scaleSubtitleTimings,
  setSubtitleStartTime,
} from "../../engine/subtitles/sync.ts";
import type { SubtitleCue } from "../../engine/subtitles/types.ts";

export interface CuesEditorProps {
  cues: SubtitleCue[];
  onChange: (cues: SubtitleCue[]) => void;
  audioDuration?: number;
}

export function CuesEditor({ cues, onChange }: CuesEditorProps) {
  const [error, setError] = useState<string>("");
  const [speedFactor, setSpeedFactor] = useState<number>(1);

  const activeCue = cues[0];
  // Format current text displaying any inter-word pause tokens if present
  const currentText =
    cuesToTextWithPauses(cues) || (activeCue ? activeCue.text : "");
  const currentStartTime =
    cues.length > 0 ? Math.min(...cues.map((c) => c.start)) : 0;

  const handleTextChange = (newText: string) => {
    const updated = parseTextWithPauses(
      newText,
      currentStartTime,
      speedFactor,
      activeCue,
    );
    onChange(updated);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") return;

      try {
        let parsed: SubtitleCue[] = [];
        if (file.name.endsWith(".vtt") || content.includes("WEBVTT")) {
          parsed = parseVtt(content);
        } else {
          parsed = parseSrt(content);
        }

        if (parsed.length === 0) {
          setError("No se encontraron subtítulos válidos en el archivo.");
          return;
        }

        // Detect inter-word gaps from the imported file and convert to pause tokens
        const textWithGaps = cuesToTextWithPauses(parsed);
        const firstStart = parsed[0]?.start ?? 0;
        const single = parseTextWithPauses(
          textWithGaps,
          firstStart,
          speedFactor,
          activeCue,
        );
        onChange(single);
      } catch (err: unknown) {
        setError(`Error al leer archivo: ${String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  const applySpeed = (factor: number) => {
    if (factor <= 0 || cues.length === 0) return;
    try {
      const origin = cues[0]?.start ?? 0;
      const scaled = scaleSubtitleTimings(cues, factor, origin);
      onChange(scaled);
    } catch (err: unknown) {
      setError(String(err));
    }
  };

  const handleStartTimeChange = (newStart: number) => {
    if (cues.length === 0) {
      const single = parseTextWithPauses("", newStart, speedFactor);
      onChange(single);
      return;
    }
    try {
      const shifted = setSubtitleStartTime(cues, newStart);
      onChange(shifted);
    } catch (err: unknown) {
      setError(String(err));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
      }}
    >
      {/* Sincronización general */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "8px 10px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 6,
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          Sincronización
        </div>

        {/* Cuándo empieza el subtítulo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, flex: 1 }}>Inicio:</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={currentStartTime}
            onChange={(e) => handleStartTimeChange(Number(e.target.value))}
            style={{ width: 60, padding: "2px 4px", fontSize: 11 }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            s
          </span>
        </div>

        {/* Velocidad para comprimir o estirar el tempo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, flex: 1 }}>
            Velocidad ({speedFactor.toFixed(2)}x):
          </span>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={speedFactor}
            onChange={(e) => setSpeedFactor(Number(e.target.value))}
            style={{ flex: 2 }}
          />
          <button
            type="button"
            onClick={() => applySpeed(speedFactor)}
            title="Aplicar velocidad"
            style={{ padding: "2px 8px", fontSize: 11 }}
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Cuadro de texto único y directo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}
          >
            Texto del subtítulo:
          </span>
          <label
            className="file-pick"
            title="Importar texto desde un archivo .srt o .vtt"
            style={{
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              opacity: 0.8,
            }}
          >
            <FileUp size={12} />
            Importar .srt/.vtt
            <input
              type="file"
              accept=".srt,.vtt,text/vtt,application/x-subrip"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
        <textarea
          rows={3}
          value={currentText}
          placeholder="Escribe el subtítulo aquí… Ej: Hola [0.5s] amigos"
          onChange={(e) => handleTextChange(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            fontSize: 12,
            resize: "vertical",
            lineHeight: 1.4,
          }}
        />
        <span style={{ fontSize: 10, color: "var(--muted)" }}>
          Tip: Usa [0.5s] para insertar pausas exactas entre palabras (ej: Hola
          [0.8s] mundo).
        </span>
      </div>

      {error && <div className="hint error">{error}</div>}
    </div>
  );
}
