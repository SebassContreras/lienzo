import {
  AlertCircle,
  CheckCircle,
  FileType,
  Image,
  Loader2,
  Upload,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

export type BrandAssetManagerProps = {
  slug?: string;
  assets: string[];
  onAssetUploaded?: (filename: string, path: string) => void;
  disabled?: boolean;
};

export function BrandAssetManager({
  slug,
  assets,
  onAssetUploaded,
  disabled = false,
}: BrandAssetManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const uploadFile = async (file: File) => {
    if (!slug) {
      setErrorMsg(
        "Debe seleccionar o guardar un proyecto antes de subir recursos.",
      );
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ext) {
      setErrorMsg("El archivo no tiene extensión.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const buffer = await file.arrayBuffer();
      const res = await fetch(`/api/projects/${slug}/assets?ext=${ext}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: buffer,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Error al subir el archivo: ${res.status}`,
        );
      }

      const result = await res.json();
      setSuccessMsg(`Subido con éxito: ${file.name}`);
      onAssetUploaded?.(result.filename, result.path);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return;
    uploadFile(files[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImageFile = (name: string) =>
    /\.(png|jpg|jpeg|webp|svg)$/i.test(name);

  return (
    <div
      className="brand-asset-manager"
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 600,
          fontSize: "13px",
        }}
      >
        <Image size={16} />
        <span>Recursos Gráficos del Proyecto ({assets.length})</span>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() =>
          !disabled && !isUploading && fileInputRef.current?.click()
        }
        style={{
          border: `2px dashed ${isDragging ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          background: isDragging
            ? "rgba(59, 130, 246, 0.08)"
            : "rgba(255,255,255,0.02)",
          cursor: disabled || isUploading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,.glb,.mp3,.wav,.ttf,.otf,.woff,.woff2"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#3b82f6",
            }}
          >
            <Loader2 size={24} className="spin" />
            <span style={{ fontSize: "12px" }}>
              Subiendo archivo al proyecto...
            </span>
          </div>
        ) : (
          <>
            <div style={{ color: "rgba(255,255,255,0.6)" }}>
              <Upload size={24} />
            </div>
            <div style={{ fontSize: "12px", fontWeight: 500 }}>
              Arrastra un archivo aquí o haz clic para subirlo
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
              Imágenes (PNG, JPG, SVG, WebP), Modelos 3D (GLB), Audio o Fuentes
              (máx 20MB)
            </div>
          </>
        )}
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#ef4444",
            fontSize: "11px",
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#10b981",
            fontSize: "11px",
          }}
        >
          <CheckCircle size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Asset Grid / Gallery */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 500,
          }}
        >
          Archivos en projects/{slug || "<slug>"}/assets/
        </span>

        {assets.length === 0 ? (
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              fontStyle: "italic",
              padding: "10px 0",
            }}
          >
            No hay recursos subidos aún en este proyecto.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px",
              maxHeight: "180px",
              overflowY: "auto",
              padding: "4px 2px",
            }}
          >
            {assets.map((asset) => {
              const assetUrl = slug
                ? `/api/projects/${slug}/assets/${asset}`
                : "";
              const isImg = isImageFile(asset);

              return (
                <div
                  key={asset}
                  title={asset}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    padding: "6px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "64px",
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
                        }}
                      />
                    ) : (
                      <FileType size={24} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "monospace",
                      width: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
    </div>
  );
}
