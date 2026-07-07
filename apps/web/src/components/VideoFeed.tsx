import type { SessionStatus } from "@morphix/shared";
import type { SelectedReferenceFace } from "@/lib/faceSwap";
import { referenceThumbnail } from "@/lib/faceSwap";
import { StatusBadge } from "./ui/Badge";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  beforeVideoRef: React.RefObject<HTMLVideoElement | null>;
  status: SessionStatus;
  isCameraOn?: boolean;
  isSwapActive?: boolean;
  isRecording?: boolean;
  referenceFace?: SelectedReferenceFace | null;
  variant?: "default" | "compact";
}

export function VideoFeed({
  videoRef,
  beforeVideoRef,
  status,
  isCameraOn,
  isSwapActive,
  isRecording,
  referenceFace,
  variant = "default",
}: VideoFeedProps) {
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "relative w-full max-w-xl mx-auto aspect-video max-h-[220px] bg-black rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] desktop-glow desktop-panel"
          : "relative w-full aspect-video bg-slate-950 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-md)]"
      }
    >
      <div className={`grid grid-cols-1 sm:grid-cols-2 h-full ${compact ? "max-h-[220px]" : ""}`}>
        <div
          className={`relative border-b sm:border-b-0 sm:border-r border-[var(--border)] ${
            compact ? "min-h-[100px] max-h-[220px]" : "min-h-[140px]"
          }`}
        >
          <video
            ref={beforeVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOn ? "" : "hidden"}`}
          />
          {!isCameraOn && (
            <FeedPlaceholder label="Camera off" hint="Open the camera to see your feed" compact={compact} />
          )}
          <span
            className={`absolute bottom-2 left-2 font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-[var(--primary)] ${
              compact ? "text-[9px] font-display" : "text-[10px]"
            }`}
          >
            Camera
          </span>
        </div>

        <div className={`relative ${compact ? "min-h-[100px] max-h-[220px]" : "min-h-[140px]"}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isSwapActive ? "" : "hidden"}`}
          />
          {!isSwapActive && (
            <FeedPlaceholder
              label="Swap off"
              hint={
                referenceFace
                  ? "Start swap to apply the selected reference face"
                  : isCameraOn
                    ? "Select a reference face, then start swap"
                    : "Open the camera and select a reference face"
              }
              referenceFace={referenceFace}
              compact={compact}
            />
          )}
          <span
            className={`absolute bottom-2 left-2 font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--border)] ${
              compact ? "text-[9px] font-display" : "text-[10px]"
            }`}
          >
            Face swap
          </span>
          {referenceFace && !isSwapActive && (
            <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 rounded border border-[var(--primary)] bg-black/80 backdrop-blur-sm">
              <img
                src={referenceThumbnail(referenceFace)}
                alt=""
                className={`rounded-full object-cover ring-2 ring-[var(--primary)] ${compact ? "w-6 h-6" : "w-8 h-8"}`}
              />
              <span className={`font-medium text-[var(--primary)] max-w-[80px] truncate font-display ${compact ? "text-[9px]" : "text-[10px]"}`}>
                {referenceFace.name}
              </span>
            </div>
          )}
          {isSwapActive && <StatusBadge status={status} overlay />}
        </div>
      </div>

      {isRecording && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-semibold shadow-sm font-display">
          <span className="w-2 h-2 rounded-full bg-white animate-[pulse-dot_1s_ease-in-out_infinite]" />
          REC
        </div>
      )}
    </div>
  );
}

function FeedPlaceholder({
  label,
  hint,
  referenceFace,
  compact,
}: {
  label: string;
  hint: string;
  referenceFace?: SelectedReferenceFace | null;
  compact?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center bg-[var(--bg-muted)]">
      {referenceFace && (
        <img
          src={referenceThumbnail(referenceFace)}
          alt=""
          className={`rounded-full object-cover ring-4 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-muted)] mb-2 ${
            compact ? "w-10 h-10" : "w-16 h-16"
          }`}
        />
      )}
      <p className={`font-medium text-[var(--text-secondary)] font-display ${compact ? "text-xs" : "text-sm"}`}>{label}</p>
      <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[10px]" : "text-xs"}`}>{hint}</p>
    </div>
  );
}
