import React from "react";
import StatusBadge from "./StatusBadge.jsx";

const corners = [
  { top: 0, left: 0, borderTop: true, borderLeft: true },
  { top: 0, right: 0, borderTop: true, borderRight: true },
  { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
  { bottom: 0, right: 0, borderBottom: true, borderRight: true },
];

export default function VideoFeed({ videoRef, status }) {
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "16/9",
      background: "#0d0f1a", borderRadius: "16px", overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "0 4px 32px rgba(79,70,229,0.08), 0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
      }} />

      {/* Corner accents */}
      {corners.map((c, i) => (
        <div key={i} style={{
          position: "absolute", width: 20, height: 20,
          top: c.top !== undefined ? 14 : undefined,
          bottom: c.bottom !== undefined ? 14 : undefined,
          left: c.left !== undefined ? 14 : undefined,
          right: c.right !== undefined ? 14 : undefined,
          borderTop: c.borderTop ? "2px solid var(--face-accent)" : undefined,
          borderBottom: c.borderBottom ? "2px solid var(--face-accent)" : undefined,
          borderLeft: c.borderLeft ? "2px solid var(--face-accent)" : undefined,
          borderRight: c.borderRight ? "2px solid var(--face-accent)" : undefined,
          borderRadius: c.top !== undefined && c.left !== undefined ? "2px 0 0 0"
            : c.top !== undefined && c.right !== undefined ? "0 2px 0 0"
            : c.bottom !== undefined && c.left !== undefined ? "0 0 0 2px" : "0 0 2px 0",
        }} />
      ))}

      <StatusBadge status={status} position="overlay" />
    </div>
  );
}
