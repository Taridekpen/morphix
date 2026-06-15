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
}

export function VideoFeed({
  videoRef,
  beforeVideoRef,
  status,
  isCameraOn,
  isSwapActive,
  isRecording,
  referenceFace,
}: VideoFeedProps) {
  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-md)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
        <div className="relative border-b sm:border-b-0 sm:border-r border-[var(--border)] min-h-[140px]">
          <video
            ref={beforeVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOn ? "" : "hidden"}`}
          />
          {!isCameraOn && (
            <FeedPlaceholder label="Camera off" hint="Open the camera to see your feed" />
          )}
          <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white">
            Camera
          </span>
        </div>

        <div className="relative min-h-[140px]">
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
            />
          )}
          <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--primary)] text-white">
            Face swap
          </span>
          {referenceFace && !isSwapActive && (
            <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-[var(--primary)]">
              <img
                src={referenceThumbnail(referenceFace)}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--primary)]"
              />
              <span className="text-[10px] font-medium text-white max-w-[100px] truncate">
                {referenceFace.name}
              </span>
            </div>
          )}
          {isSwapActive && <StatusBadge status={status} overlay />}
        </div>
      </div>

      {isRecording && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-semibold shadow-sm">
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
}: {
  label: string;
  hint: string;
  referenceFace?: SelectedReferenceFace | null;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center bg-[var(--bg-muted)]">
      {referenceFace && (
        <img
          src={referenceThumbnail(referenceFace)}
          alt=""
          className="w-16 h-16 rounded-full object-cover ring-4 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-muted)] mb-3"
        />
      )}
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}
