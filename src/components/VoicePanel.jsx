import React from "react";
import { VOICE_STATUS } from "../hooks/useVoiceChanger.jsx";
import StatusBadge from "./StatusBadge.jsx";

const BARS = 24;

export default function VoicePanel({
  voiceStatus, isVoiceLive, volume, latency, chunkCount,
  fishApiKey, setFishApiKey, fishVoiceId, setFishVoiceId,
  voiceError, startVoice, stopVoice,
}) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "16px",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 16px rgba(249,115,22,0.06)",
      overflow: "hidden",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--voice-accent-light)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "10px", background: "var(--voice-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", color: "#fff",
          }}>🎙</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
              VOICE CHANGER
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 1 }}>
              Powered by Fish Audio
            </div>
          </div>
        </div>
        <StatusBadge status={voiceStatus} position="inline" />
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* API Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 5 }}>
                Fish API Key
              </label>
              <input type="password" value={fishApiKey} onChange={(e) => setFishApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                disabled={isVoiceLive}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "10px",
                  border: "1.5px solid var(--border-strong)",
                  background: isVoiceLive ? "var(--bg-card-2)" : "#fff",
                  fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-primary)",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--voice-accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 5 }}>
                Voice ID
              </label>
              <input type="text" value={fishVoiceId} onChange={(e) => setFishVoiceId(e.target.value)}
                placeholder="your-voice-id"
                disabled={isVoiceLive}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "10px",
                  border: "1.5px solid var(--border-strong)",
                  background: isVoiceLive ? "var(--bg-card-2)" : "#fff",
                  fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-primary)",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--voice-accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"}
              />
            </div>
          </div>
        </div>

        {/* Waveform visualizer */}
        {isVoiceLive && (
          <div style={{
            background: "var(--bg-card-2)", borderRadius: "12px", padding: "16px",
            border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            {/* Bars */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 48 }}>
              {Array.from({ length: BARS }).map((_, i) => {
                const center = BARS / 2;
                const dist = Math.abs(i - center) / center;
                const wave = Math.sin(Date.now() / 180 + i * 0.6) * 0.25 + 0.75;
                const barVol = volume * (1 - dist * 0.4) * wave;
                const height = 4 + barVol * 44;
                return (
                  <div key={i} style={{
                    width: 3, height: `${height}px`, borderRadius: 2,
                    background: `rgba(249,115,22,${0.3 + barVol * 0.7})`,
                    transition: "height 0.07s ease",
                  }} />
                );
              })}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 20 }}>
              {latency && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600, color: "var(--voice-accent)" }}>{latency}ms</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" }}>latency</div>
                </div>
              )}
              {chunkCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600, color: "var(--face-accent)" }}>{chunkCount}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" }}>chunks sent</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {voiceError && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px",
            background: "var(--error-bg)", border: "1px solid #fca5a530",
            fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--error)",
          }}>
            ⚠ {voiceError}
          </div>
        )}

        {/* Start/Stop button */}
        <button
          onClick={isVoiceLive ? stopVoice : startVoice}
          style={{
            width: "100%", padding: "12px", borderRadius: "12px", border: "none",
            background: isVoiceLive
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff", fontFamily: "var(--font-display)",
            fontSize: "1rem", letterSpacing: "0.1em",
            boxShadow: isVoiceLive ? "0 4px 20px rgba(239,68,68,0.3)" : "0 4px 20px rgba(249,115,22,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-1px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          {isVoiceLive ? "⏹  STOP VOICE CHANGER" : "🎙  START VOICE CHANGER"}
        </button>

        {/* Routing hint */}
        {isVoiceLive && (
          <div style={{
            padding: "12px 14px", borderRadius: "10px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#166534", lineHeight: 1.7,
          }}>
            <strong>Route to Zoom/Discord:</strong> set your mic to{" "}
            <strong>VB-Cable</strong> (Windows) or <strong>BlackHole</strong> (Mac)
          </div>
        )}
      </div>
    </div>
  );
}
