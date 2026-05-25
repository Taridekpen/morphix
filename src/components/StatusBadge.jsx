import React from "react";

const configs = {
  live:          { color: "#10b981", bg: "#ecfdf5", label: "LIVE" },
  connecting:    { color: "#f59e0b", bg: "#fffbeb", label: "CONNECTING" },
  applying:      { color: "#f59e0b", bg: "#fffbeb", label: "APPLYING" },
  converting:    { color: "#f97316", bg: "#fff7ed", label: "CONVERTING" },
  error:         { color: "#ef4444", bg: "#fef2f2", label: "ERROR" },
  "camera denied":{ color: "#ef4444", bg: "#fef2f2", label: "CAM DENIED" },
  idle:          { color: "#8b93b0", bg: "#f0f2f8", label: "IDLE" },
};

export default function StatusBadge({ status, position = "overlay" }) {
  const cfg = configs[status] ?? configs.idle;
  const isLive = status === "live";

  const base = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "4px 10px", borderRadius: "999px",
    background: cfg.bg,
    border: `1px solid ${cfg.color}30`,
    color: cfg.color,
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    whiteSpace: "nowrap",
  };

  const overlayStyle = position === "overlay" ? {
    position: "absolute", top: 12, left: 12,
    backdropFilter: "blur(8px)",
    background: `${cfg.bg}dd`,
  } : {};

  return (
    <div style={{ ...base, ...overlayStyle }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: cfg.color,
        animation: isLive ? "pulse-dot 1.5s ease-in-out infinite" : "none",
        flexShrink: 0,
      }} />
      {cfg.label}
    </div>
  );
}
