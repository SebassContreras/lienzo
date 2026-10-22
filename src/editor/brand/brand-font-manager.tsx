import { Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchFonts } from "../../engine/fonts.ts";
import { parseFontFile, type ResolvedFont } from "../../model/font-files.ts";
import { installFromGoogle, uploadFont } from "./font-api.ts";

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export type BrandFontManagerProps = {
  /** The project being edited; without one, fonts can only be global. */
  slug?: string;
  /** Called after a font is added, so the editor loads it (045/D3). */
  onFontsChanged?: () => void;
};

/** The "Fuentes" tab of the brand manager (045/D5, D6). */
export function BrandFontManager({
  slug,
  onFontsChanged,
}: BrandFontManagerProps) {
  const [fonts, setFonts] = useState<ResolvedFont[]>([]);
  const [scope, setScope] = useState<"project" | "global">(
    slug ? "project" : "global",
  );
  const [file, setFile] = useState<File>();
  const [family, setFamily] = useState("");
  const [weight, setWeight] = useState(400);
  const [busy, setBusy] = useState(false);
  const [googleFamily, setGoogleFamily] = useState("");
  const [googleWeights, setGoogleWeights] = useState<number[]>([400, 700]);
  const [message, setMessage] = useState("");

  const project = scope === "project" ? slug : undefined;

  const refresh = useCallback(
    () =>
      fetchFonts(slug)
        .then((all) => setFonts(all.filter((f) => f.origin !== "bundled")))
        .catch(() => setFonts([])),
    [slug],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const added = (text: string) => {
    setMessage(text);
    refresh();
    onFontsChanged?.();
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const saved = await uploadFont(file, { family, weight, project });
      added(`Fuente «${saved.family}» ${saved.weight} añadida`);
      setFile(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const saved = await installFromGoogle({
        family: googleFamily.trim(),
        weights: googleWeights,
        project,
      });
      added(
        `«${googleFamily.trim()}» descargada (${saved.map((f) => f.weight).join(", ")})`,
      );
      setGoogleFamily("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="brand-fonts">
      <fieldset className="brand-fonts-scope">
        <legend>Dónde guardar</legend>
        <label>
          <input
            type="radio"
            checked={scope === "project"}
            disabled={!slug}
            onChange={() => setScope("project")}
          />
          Solo este proyecto
        </label>
        <label>
          <input
            type="radio"
            checked={scope === "global"}
            onChange={() => setScope("global")}
          />
          Global (todos los proyectos)
        </label>
      </fieldset>

      <section>
        <h4 className="brand-fonts-title">
          Subir archivo (ttf, otf, woff, woff2)
        </h4>
        <div className="brand-fonts-row">
          <label className="file-button">
            <Upload size={14} /> {file ? file.name : "Elegir archivo"}
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              hidden
              onChange={(e) => {
                const chosen = e.target.files?.[0];
                e.target.value = "";
                if (!chosen) return;
                setFile(chosen);
                const parsed = parseFontFile(chosen.name);
                if (parsed) {
                  setFamily(parsed.family);
                  setWeight(parsed.weight);
                }
              }}
            />
          </label>
          <input
            aria-label="Familia"
            placeholder="Familia"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          />
          <select
            aria-label="Peso"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          >
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!file || !family.trim() || busy}
            onClick={upload}
          >
            {busy ? <Loader2 size={14} className="spin" /> : "Subir"}
          </button>
        </div>
      </section>

      <section>
        <h4 className="brand-fonts-title">Descargar de Google Fonts</h4>
        <div className="brand-fonts-row">
          <input
            aria-label="Familia de Google Fonts"
            placeholder="p. ej. Montserrat"
            value={googleFamily}
            onChange={(e) => setGoogleFamily(e.target.value)}
          />
          <button
            type="button"
            disabled={
              !googleFamily.trim() || googleWeights.length === 0 || busy
            }
            onClick={download}
          >
            {busy ? <Loader2 size={14} className="spin" /> : "Descargar"}
          </button>
        </div>
        <div className="brand-fonts-row">
          {WEIGHTS.map((w) => (
            <label key={w} className="brand-fonts-weight">
              <input
                type="checkbox"
                checked={googleWeights.includes(w)}
                onChange={(e) =>
                  setGoogleWeights((ws) =>
                    e.target.checked
                      ? [...ws, w].sort((a, b) => a - b)
                      : ws.filter((x) => x !== w),
                  )
                }
              />
              {w}
            </label>
          ))}
        </div>
        <p className="hint">
          Se guarda en disco y funciona sin conexión. Busca nombres en
          fonts.google.com.
        </p>
      </section>

      {message && <p className="hint">{message}</p>}

      <section>
        <h4 className="brand-fonts-title">Fuentes disponibles</h4>
        {fonts.length === 0 ? (
          <p className="hint">Aún no hay fuentes propias.</p>
        ) : (
          <ul className="brand-fonts-list">
            {fonts.map((f) => (
              <li key={`${f.origin}-${f.family}-${f.weight}`}>
                <span
                  style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}
                >
                  {f.family} {f.weight}
                </span>
                <small>{f.origin === "project" ? "Proyecto" : "Global"}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
