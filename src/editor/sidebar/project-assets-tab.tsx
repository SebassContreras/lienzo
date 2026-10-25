import {
  FileType,
  Folder,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { deleteProjectAsset, renameProjectAsset } from "../../presets/store.ts";
import { projectAssetUrl, safeAssetPath } from "../../service/asset-path.ts";
import { ASSET_MIME } from "../stage.tsx";
import { assetFileName, assetFolderView } from "./asset-folders.ts";

export type ProjectAssetsTabProps = {
  projectSlug?: string;
  setStatus: (s: string) => void;
};

const isImageFile = (name: string) => /\.(png|jpg|jpeg|webp|svg)$/i.test(name);

const tileStyle: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "6px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  userSelect: "none",
};

const previewStyle: CSSProperties = {
  width: "100%",
  height: "56px",
  background: "rgba(0,0,0,0.3)",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const labelStyle: CSSProperties = {
  fontSize: "9px",
  fontFamily: "monospace",
  width: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const crumbStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "inherit",
  font: "inherit",
  cursor: "pointer",
};

export function ProjectAssetsTab({
  projectSlug = "mi-proyecto",
  setStatus,
}: ProjectAssetsTabProps) {
  const [assets, setAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("");
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

  // A new project opens at the root of its assets/.
  // biome-ignore lint/correctness/useExhaustiveDependencies: projectSlug is the trigger, not a value read
  useEffect(() => {
    setFolder("");
  }, [projectSlug]);

  const view = assetFolderView(assets, folder);
  const crumbs = folder ? folder.split("/") : [];

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

  /** Renames or moves an asset; scenes using it follow (063/D6). */
  const handleRename = async (asset: string) => {
    const to = window.prompt("Nueva ruta dentro de assets/", asset)?.trim();
    if (!to || to === asset) return;
    try {
      await renameProjectAsset(asset, to, projectSlug);
      setStatus(`Recurso renombrado a «${to}»`);
      fetchAssets();
    } catch (e: unknown) {
      setStatus(`Error al renombrar: ${e instanceof Error ? e.message : e}`);
    }
  };

  /** Deletes an asset, asking again when a scene still uses it (063/D6). */
  const handleDelete = async (asset: string) => {
    if (!window.confirm(`¿Borrar el recurso «${asset}»?`)) return;
    try {
      const { inUse } = await deleteProjectAsset(asset, projectSlug);
      if (inUse) {
        if (!window.confirm(`${inUse}. ¿Borrarlo igual?`)) return;
        await deleteProjectAsset(asset, projectSlug, true);
      }
      setStatus(`Recurso «${asset}» borrado`);
      fetchAssets();
    } catch (e: unknown) {
      setStatus(`Error al borrar: ${e instanceof Error ? e.message : e}`);
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

      {crumbs.length > 0 && (
        <nav
          aria-label="Carpeta actual"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <button
            type="button"
            style={crumbStyle}
            onClick={() => setFolder("")}
          >
            assets
          </button>
          {crumbs.map((name, i) => (
            <span key={crumbs.slice(0, i + 1).join("/")}>
              {" / "}
              <button
                type="button"
                style={crumbStyle}
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
                onClick={() => setFolder(crumbs.slice(0, i + 1).join("/"))}
              >
                {name}
              </button>
            </span>
          ))}
        </nav>
      )}

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
          {view.folders.map((sub) => (
            <button
              key={sub.path}
              type="button"
              title={`Abrir ${sub.path} (${sub.count} archivos)`}
              onClick={() => setFolder(sub.path)}
              style={{ ...tileStyle, color: "inherit", cursor: "pointer" }}
            >
              <div style={previewStyle}>
                <Folder size={22} style={{ opacity: 0.7 }} />
              </div>
              <span style={labelStyle}>
                {sub.name} ({sub.count})
              </span>
            </button>
          ))}
          {view.files.map((asset) => {
            const assetUrl = projectAssetUrl(projectSlug, asset);
            // Names the asset route will not serve (spaces, accents) show, but cannot be dragged (044/D2).
            const servable = safeAssetPath(asset.split("/")) !== undefined;
            const isImg = isImageFile(asset) && servable;

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
                title={
                  isImg
                    ? `Arrastra ${asset} al lienzo`
                    : servable
                      ? asset
                      : `${asset}: renómbralo sin caracteres especiales (/  : * ? " < > |) para usarlo`
                }
                style={{ ...tileStyle, cursor: isImg ? "grab" : "default" }}
              >
                <div style={previewStyle}>
                  {isImg ? (
                    <img
                      src={assetUrl}
                      alt={asset}
                      draggable={false}
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
                <span style={labelStyle}>{assetFileName(asset)}</span>
                <div className="item-actions">
                  <button
                    type="button"
                    title="Renombrar o mover"
                    onClick={() => handleRename(asset)}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    title="Borrar"
                    onClick={() => handleDelete(asset)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
