import React from "react";
import { STATUS } from "../hooks/useDecart.jsx";
import StatusBadge from "./StatusBadge.jsx";
import UploadZone from "./UploadZone.jsx";

export default function FacePanel({
  status, prompt, setPrompt, imageFile, thumbUrl,
  onFile, onClear, onApply,
}) {
  const isDisabled = status === STATUS.APPLYING || status === STATUS.CONNECTING;

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "16px",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 16px rgba(79,70,229,0.06)",
      overflow: "hidden",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--face-accent-light)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "10px", background: "var(--face-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", color: "#fff",
          }}>◈</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
              FACE SWAP
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 1 }}>
              Powered by Decart Lucy
            </div>
          </div>
        </div>
        <StatusBadge status={status} position="inline" />
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Upload */}
        <UploadZone thumbUrl={thumbUrl} imageFile={imageFile} onFile={onFile} onClear={onClear} />

        {/* Prompt + Apply */}
        <div style={{ display: "flex", gap: 10 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Extra details — e.g. 'cinematic lighting' or 'wearing a leather jacket'"
            rows={2}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px", resize: "none",
              border: "1.5px solid var(--border-strong)", background: "#fff",
              fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-primary)",
              lineHeight: 1.6, transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--face-accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"}
          />
          <button
            onClick={onApply}
            disabled={isDisabled}
            style={{
              padding: "0 22px", borderRadius: "12px", border: "none",
              background: isDisabled
                ? "var(--border-strong)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: isDisabled ? "var(--text-muted)" : "#fff",
              fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.1em",
              boxShadow: isDisabled ? "none" : "0 4px 20px rgba(79,70,229,0.3)",
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "all 0.2s ease", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { if (!isDisabled) e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            APPLY
          </button>
        </div>

        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)",
          textAlign: "center", letterSpacing: "0.05em",
        }}>
          Your camera drives motion · the photo provides face identity
        </p>
      </div>
    </div>
  );
}
