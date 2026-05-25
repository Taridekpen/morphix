import React, { useRef, useState } from "react";

export default function UploadZone({ thumbUrl, imageFile, onFile, onClear }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        padding: "14px 18px", borderRadius: "12px", cursor: "pointer",
        border: `2px dashed ${dragging ? "var(--face-accent)" : "var(--border-strong)"}`,
        background: dragging ? "var(--face-accent-light)" : "var(--bg-card-2)",
        transition: "all 0.2s ease",
      }}
    >
      {thumbUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={thumbUrl} alt="reference"
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--face-accent)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {imageFile?.name}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--live)", marginTop: 2 }}>
              ✓ Reference face loaded
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              padding: "5px 12px", borderRadius: "8px", fontSize: "0.75rem",
              background: "transparent", border: "1px solid var(--border-strong)",
              color: "var(--text-muted)", fontFamily: "var(--font-body)",
              transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.color = "var(--text-muted)"; }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 0" }}>
          <div style={{ fontSize: "1.6rem", color: "var(--face-accent)", opacity: 0.6 }}>⊕</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Drop a face photo or click to browse
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            JPEG · PNG · WebP · under 5MB
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={(e) => onFile(e.target.files[0])} />
    </div>
  );
}
