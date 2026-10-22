import { FileType, Loader2, Upload } from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ASSET_MIME } from "../stage.tsx";

export type ProjectAssetsTabProps = {
  projectSlug?: string;
  setStatus: (s: string) => void;
};

const isImageFile = (name: string) => /\.(png|jpg|jpeg|webp|svg)$/i.test(name);

export function ProjectAssetsTab({
  projectSlug = "mi-proyecto",
  setStatus,
}: ProjectAssetsTabProps) {
  const [assets, setAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    if (!projectSlug) {
      setAssets([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}`,
      );
      if (res.ok) {
        const details = await res.json();
        setAssets(details.assets ?? []);
      }
    } catch {
      // offline / mock fallback
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ext) return;

    try {
      setUploading(true);
      const buffer = await file.arrayBuffer();
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/assets?ext=${encodeURIComponent(ext)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: buffer,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      setStatus(`Recurso «${file.name}» subido a ${projectSlug}/assets/`);
      fetchAssets();
    } catch (e: unknown) {
      setStatus(`Error al subir: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  return (
    <div
      className="project-assets-tab"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Recursos de «{projectSlug}»
        </span>
        <button
          type="button"
          className="file-button"
          title="Subir archivo al proyecto"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {uploading ? (
            <Loader2 size={12} className="spin" />
          ) : (
            <Upload size={12} />
          )}
          <span>Subir</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
        />
      </div>

      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
        Arrastra una imagen directamente al lienzo para insertarla.
      </div>

      {loading ? (
        <div
          style={{
            padding: "20px 0",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
          }}
        >
          Cargando recursos…
        </div>
      ) : assets.length === 0 ? (
        <div
          style={{
            padding: "20px 0",
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          No hay recursos subidos aún en este proyecto.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: "8px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 220px)",
          }}
        >
          {assets.map((asset) => {
            const assetUrl = `/api/projects/${encodeURIComponent(projectSlug)}/assets/${encodeURIComponent(asset)}`;
            const isImg = isImageFile(asset);

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: a drag source for the canvas; dragging has no keyboard equivalent here (known gap, out of this lint fix)
              <div
                key={asset}
                draggable={isImg}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    ASSET_MIME,
                    JSON.stringify({ path: assetUrl, filename: asset }),
                  );
                  e.dataTransfer.effectAllowed = "copy";
                }}
                title={isImg ? `Arrastra ${asset} al lienzo` : asset}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: isImg ? "grab" : "default",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "56px",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {isImg ? (
                    <img
                      src={assetUrl}
                      alt={asset}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <FileType size={20} style={{ opacity: 0.5 }} />
                  )}
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontFamily: "monospace",
                    width: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {asset}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
