import React from "react";
import { useDecart } from "./hooks/useDecart.jsx";
import { useVoiceChanger } from "./hooks/useVoiceChanger.jsx";
import VideoFeed from "./components/VideoFeed.jsx";
import FacePanel from "./components/FacePanel.jsx";
import VoicePanel from "./components/VoicePanel.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

export default function App() {
  const {
    videoRef, status, prompt, setPrompt,
    imageFile, thumbUrl, apply, handleFile, clearImage,
  } = useDecart();

  const voice = useVoiceChanger();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>

      {/* Top nav */}
      <header style={{
        background: "#fff", borderBottom: "1px solid var(--border)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--face-accent), var(--voice-accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", letterSpacing: "0.1em", lineHeight: 1, color: "var(--text-primary)" }}>
              FACESWAP & VOICE CHANGER
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Real-time Face & Voice Studio
            </div>
          </div>
        </div>

        {/* Live indicators */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color="var(--face-accent)" bg="var(--face-accent-light)" label="Face" active={status === "live"} />
          <Pill color="var(--voice-accent)" bg="var(--voice-accent-light)" label="Voice" active={voice.isVoiceLive} />
        </div>
      </header>

      {/* Main layout */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Hero title */}
        <div className="animate-fade-up" style={{ textAlign: "center", paddingBottom: 4 }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)",
            letterSpacing: "0.08em", lineHeight: 1, margin: 0,
            background: "linear-gradient(135deg, var(--face-accent) 0%, #818cf8 40%, var(--voice-accent) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            FACESWAP & VOICE CHANGER
          </h1>
          <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Swap your face + change your voice simultaneously — live, in your browser
          </p>
        </div>

        {/* Video + controls grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

          {/* Left: video */}
          <div className="animate-fade-up-delay-1" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <VideoFeed videoRef={videoRef} status={status} />

            {/* Quick stats bar */}
            <div style={{
              background: "#fff", borderRadius: "12px", padding: "12px 18px",
              border: "1px solid var(--border)",
              display: "flex", gap: 24, alignItems: "center",
            }}>
              <Stat label="Face Engine" value="Decart Lucy" color="var(--face-accent)" />
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <Stat label="Voice Engine" value="Fish Audio" color="var(--voice-accent)" />
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <Stat label="Mode" value="Real-time" color="var(--live)" />
              {voice.latency && (
                <>
                  <div style={{ width: 1, height: 28, background: "var(--border)" }} />
                  <Stat label="Voice Latency" value={`${voice.latency}ms`} color="var(--voice-accent)" />
                </>
              )}
            </div>
          </div>

          {/* Right: control panels */}
          <div className="animate-fade-up-delay-2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ErrorBoundary label="FACE SWAP">
              <FacePanel
                status={status}
                prompt={prompt}
                setPrompt={setPrompt}
                imageFile={imageFile}
                thumbUrl={thumbUrl}
                onFile={handleFile}
                onClear={clearImage}
                onApply={apply}
              />
            </ErrorBoundary>

            <ErrorBoundary label="VOICE CHANGER">
              <VoicePanel
                voiceStatus={voice.voiceStatus}
                isVoiceLive={voice.isVoiceLive}
                volume={voice.volume}
                latency={voice.latency}
                chunkCount={voice.chunkCount}
                fishApiKey={voice.fishApiKey}
                setFishApiKey={voice.setFishApiKey}
                fishVoiceId={voice.fishVoiceId}
                setFishVoiceId={voice.setFishVoiceId}
                voiceError={voice.voiceError}
                startVoice={voice.startVoice}
                stopVoice={voice.stopVoice}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Footer */}
        <div className="animate-fade-up-delay-3" style={{ textAlign: "center", paddingTop: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Faceswap & Voice Changer · Face powered by Decart · Voice powered by Fish Audio
          </p>
        </div>
      </main>
    </div>
  );
}

function Pill({ color, bg, label, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: "999px",
      background: active ? bg : "var(--bg-card-2)",
      border: `1px solid ${active ? color + "40" : "var(--border)"}`,
      transition: "all 0.3s ease",
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? color : "var(--border-strong)",
        animation: active ? "pulse-dot 1.5s ease-in-out infinite" : "none",
      }} />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 600,
        color: active ? color : "var(--text-muted)",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}
