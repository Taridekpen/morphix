import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useDecartCredits } from "@/hooks/useDecartCredits";
import { useRecording } from "@/hooks/useRecording";
import { useStreamRelaySender } from "@/hooks/useStreamRelay";
import { VideoFeed } from "@/components/VideoFeed";
import { FacePanel } from "@/components/FacePanel";
import { ObsVirtualCamPanel } from "@/components/ObsVirtualCamPanel";
import { DecartCreditsBadge } from "@/components/DecartCreditsBadge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { LiveIndicator } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { clearRelayToken, closeBrowserOutputWindow } from "@/lib/browserRelay";
import { browserObsClient } from "@/lib/obsClient";
import { isBrowserObsSupported, isDesktopApp } from "@/lib/runtimeEnv";
import type { FacePreset } from "@morphix/shared";
import {
  type SelectedReferenceFace,
  presetToReference,
  uploadToReference,
} from "@/lib/faceSwap";

export function StudioPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedReference, setSelectedReference] = useState<SelectedReferenceFace | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [relayEnabled, setRelayEnabled] = useState(false);
  const [relayToken, setRelayToken] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const session = useLiveSession(videoRef, beforeVideoRef);
  const recording = useRecording();

  const { data: facePresets = [] } = useQuery({ queryKey: ["facePresets"], queryFn: api.getFacePresets });
  const { data: billing } = useQuery({ queryKey: ["subscription"], queryFn: api.getSubscription });
  const decartCredits = useDecartCredits({ live: session.isSwapActive });
  const { refetch: refetchDecartCredits } = decartCredits;

  const canStartSwap = billing?.subscription?.status === "active";
  const remoteStream = session.getRemoteStream();
  const hasReference = selectedReference !== null;
  const desktopMode = isDesktopApp();

  useStreamRelaySender(remoteStream, relayEnabled && session.isSwapActive, relayToken);

  useEffect(() => {
    if (session.faceStatus === "connecting" || session.faceStatus === "live") {
      void refetchDecartCredits();
    }
  }, [session.faceStatus, refetchDecartCredits]);

  const stopObsPipeline = async () => {
    if (isDesktopApp()) {
      await window.morphixDesktop?.obs.stopVirtualCam().catch(() => undefined);
      await window.morphixDesktop?.closeOutputWindow().catch(() => undefined);
      return;
    }

    if (isBrowserObsSupported()) {
      await browserObsClient.stopVirtualCam().catch(() => undefined);
      closeBrowserOutputWindow();
      if (relayToken) {
        clearRelayToken(relayToken);
      }
      setRelayToken(null);
    }
  };

  useEffect(() => {
    if (!session.isSwapActive && relayEnabled) {
      setRelayEnabled(false);
      void stopObsPipeline();
    }
  }, [session.isSwapActive, relayEnabled, relayToken]);

  const createFacePreset = useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name);
      fd.append("prompt", "");
      return api.createFacePreset(fd);
    },
    onSuccess: (preset) => {
      queryClient.invalidateQueries({ queryKey: ["facePresets"] });
      setSelectedReference(presetToReference(preset));
    },
  });

  const deleteFacePreset = useMutation({
    mutationFn: api.deleteFacePreset,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["facePresets"] });
      setSelectedReference((current) =>
        current?.source === "preset" && current.presetId === deletedId ? null : current
      );
    },
  });

  const selectPreset = async (preset: FacePreset) => {
    setSwapError(null);
    const reference = presetToReference(preset);
    setSelectedReference(reference);
    if (session.isSwapActive) {
      try {
        await session.applyReference(reference);
      } catch (err) {
        setSwapError(err instanceof Error ? err.message : "Failed to apply reference face");
      }
    }
  };

  const selectUpload = async (file: File) => {
    setSwapError(null);
    const reference = uploadToReference(file);
    setSelectedReference(reference);
    if (session.isSwapActive) {
      try {
        await session.applyReference(reference);
      } catch (err) {
        setSwapError(err instanceof Error ? err.message : "Failed to apply reference face");
      }
    }
  };

  const handleToggleCamera = async () => {
    if (session.isCameraOn) {
      if (recording.isRecording) {
        await recording.stopRecording();
      }
      if (relayEnabled) {
        setRelayEnabled(false);
        await stopObsPipeline();
      }
      await session.stopCamera();
    } else {
      await session.startCamera();
    }
  };

  const handleToggleSwap = async () => {
    setSwapError(null);
    if (session.isSwapActive) {
      if (recording.isRecording) {
        await recording.stopRecording();
      }
      await session.stopSwap();
    } else {
      if (!selectedReference) {
        setSwapError("Select a reference face before starting swap.");
        return;
      }
      try {
        await session.startSwap(selectedReference);
        void queryClient.invalidateQueries({ queryKey: ["decartCredits"] });
      } catch (err) {
        setSwapError(err instanceof Error ? err.message : "Failed to start face swap");
      }
    }
  };

  return (
    <div className={`animate-fade-up ${desktopMode ? "pb-4" : "pb-24 lg:pb-0"}`}>
      <PageHeader
        title={desktopMode ? "> STUDIO" : "Studio"}
        description={desktopMode ? undefined : "Select a reference face, open your camera, then start the swap."}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DecartCreditsBadge
              balance={decartCredits.data?.balance}
              available={decartCredits.data?.available}
              isLoading={decartCredits.isLoading}
              isFetching={decartCredits.isFetching}
              desktop={desktopMode}
            />
            <LiveIndicator label="Camera" active={session.isCameraOn} />
            <LiveIndicator label="Face swap" active={session.faceStatus === "live"} />
          </div>
        }
        className={desktopMode ? "mb-4" : undefined}
      />

      {!canStartSwap && (
        <Alert variant="warning" title="Subscription required" className="mb-6">
          An active plan is required to start face swap.{" "}
          <Link to="/settings" className="font-medium underline">Manage billing in Settings</Link>.
        </Alert>
      )}

      {swapError && (
        <Alert variant="error" title="Face swap failed" className="mb-6">
          {swapError}
        </Alert>
      )}

      <div
        className={
          desktopMode
            ? "flex flex-col lg:flex-row gap-4 items-stretch min-h-0"
            : "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start"
        }
      >
        <div className={`min-w-0 flex-1 space-y-4 ${desktopMode ? "flex flex-col items-center lg:items-stretch" : ""}`}>
          <VideoFeed
            videoRef={videoRef}
            beforeVideoRef={beforeVideoRef}
            status={session.faceStatus}
            isCameraOn={session.isCameraOn}
            isSwapActive={session.isSwapActive}
            isRecording={recording.isRecording}
            referenceFace={selectedReference}
            variant={desktopMode ? "compact" : "default"}
          />

          <StreamControls
            isCameraOn={session.isCameraOn}
            isSwapActive={session.isSwapActive}
            canStartSwap={canStartSwap}
            hasReference={hasReference}
            swapBusy={session.faceStatus === "connecting" || session.faceStatus === "applying"}
            onToggleCamera={handleToggleCamera}
            onToggleSwap={handleToggleSwap}
            compact={desktopMode}
          />

          <div
            className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] ${
              desktopMode ? "w-full max-w-xl mx-auto desktop-panel lg:mx-0" : ""
            }`}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => recording.downloadRecording(remoteStream)}
              disabled={!session.isSwapActive || session.faceStatus !== "live"}
            >
              {recording.isRecording ? "Stop & export" : "Record swap output"}
            </Button>
          </div>
        </div>

        <aside
          className={
            desktopMode
              ? "w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[calc(3rem+1px)] lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto space-y-4 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-4"
              : "min-w-0 space-y-4"
          }
        >
          <ErrorBoundary label="Face swap">
            <FacePanel
              status={session.faceStatus}
              selectedReference={selectedReference}
              presets={facePresets}
              onSelectPreset={selectPreset}
              onSelectUpload={selectUpload}
              onUploadPreset={(file, name) => createFacePreset.mutate({ file, name })}
              onDeletePreset={(id) => deleteFacePreset.mutate(id)}
              model={session.faceOptions.model}
              setModel={(m) => session.setFaceOptions({ ...session.faceOptions, model: m })}
              resolution={session.faceOptions.resolution}
              setResolution={(r) => session.setFaceOptions({ ...session.faceOptions, resolution: r })}
              enhance={session.faceOptions.enhance}
              setEnhance={(e) => session.setFaceOptions({ ...session.faceOptions, enhance: e })}
              onReconnect={async () => {
                setSwapError(null);
                try {
                  await session.reconnectFace();
                } catch (err) {
                  setSwapError(err instanceof Error ? err.message : "Failed to reconnect face swap");
                }
              }}
              isSwapActive={session.isSwapActive}
            />
          </ErrorBoundary>

          {desktopMode ? (
            <ObsVirtualCamPanel
              swapLive={session.isSwapActive && session.faceStatus === "live"}
              remoteStream={remoteStream}
              relayEnabled={relayEnabled}
              relayToken={relayToken}
              onRelayEnabledChange={setRelayEnabled}
              onRelayTokenChange={setRelayToken}
            />
          ) : null}
        </aside>

        {!desktopMode && (
          <div className="min-w-0 xl:col-span-2">
            <ObsVirtualCamPanel
              swapLive={session.isSwapActive && session.faceStatus === "live"}
              remoteStream={remoteStream}
              relayEnabled={relayEnabled}
              relayToken={relayToken}
              onRelayEnabledChange={setRelayEnabled}
              onRelayTokenChange={setRelayToken}
            />
          </div>
        )}
      </div>

      {!desktopMode && (
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-md px-4 py-3">
        <StreamControls
          isCameraOn={session.isCameraOn}
          isSwapActive={session.isSwapActive}
          canStartSwap={canStartSwap}
          hasReference={hasReference}
          swapBusy={session.faceStatus === "connecting" || session.faceStatus === "applying"}
          onToggleCamera={handleToggleCamera}
          onToggleSwap={handleToggleSwap}
        />
      </div>
      )}
    </div>
  );
}

function StreamControls({
  isCameraOn,
  isSwapActive,
  canStartSwap,
  hasReference,
  swapBusy,
  onToggleCamera,
  onToggleSwap,
  compact,
}: {
  isCameraOn: boolean;
  isSwapActive: boolean;
  canStartSwap: boolean;
  hasReference: boolean;
  swapBusy: boolean;
  onToggleCamera: () => void;
  onToggleSwap: () => void;
  compact?: boolean;
}) {
  const swapDisabled =
    !isCameraOn || swapBusy || (!canStartSwap && !isSwapActive) || (!isSwapActive && !hasReference);

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full ${compact ? "max-w-xl mx-auto lg:mx-0" : ""}`}>
      <Button
        variant={isCameraOn ? "danger" : "secondary"}
        size={compact ? "sm" : "md"}
        className={`flex-1 ${compact ? "font-display tracking-wide" : ""}`}
        onClick={onToggleCamera}
      >
        {isCameraOn ? "Close camera" : "Open camera"}
      </Button>
      <Button
        variant={isSwapActive ? "danger" : "primary"}
        size={compact ? "sm" : "md"}
        className={`flex-1 ${compact ? "font-display tracking-wide" : ""}`}
        onClick={onToggleSwap}
        disabled={swapDisabled}
        title={!hasReference && !isSwapActive ? "Select a reference face first" : undefined}
      >
        {swapBusy ? "Connecting…" : isSwapActive ? "Stop swap" : "Start swap"}
      </Button>
    </div>
  );
}
