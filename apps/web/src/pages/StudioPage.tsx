import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useRecording } from "@/hooks/useRecording";
import { useStreamRelaySender } from "@/hooks/useStreamRelay";
import { VideoFeed } from "@/components/VideoFeed";
import { FacePanel } from "@/components/FacePanel";
import { ObsVirtualCamPanel } from "@/components/ObsVirtualCamPanel";
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

  const canStartSwap = billing?.subscription?.status === "active";
  const remoteStream = session.getRemoteStream();
  const hasReference = selectedReference !== null;

  useStreamRelaySender(remoteStream, relayEnabled && session.isSwapActive, relayToken);

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
      } catch (err) {
        setSwapError(err instanceof Error ? err.message : "Failed to start face swap");
      }
    }
  };

  return (
    <div className="animate-fade-up pb-24 lg:pb-0">
      <PageHeader
        title="Studio"
        description="Select a reference face, open your camera, then start the swap."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <LiveIndicator label="Camera" active={session.isCameraOn} />
            <LiveIndicator label="Face swap" active={session.faceStatus === "live"} />
          </div>
        }
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start">
        <div className="space-y-4 min-w-0">
          <VideoFeed
            videoRef={videoRef}
            beforeVideoRef={beforeVideoRef}
            status={session.faceStatus}
            isCameraOn={session.isCameraOn}
            isSwapActive={session.isSwapActive}
            isRecording={recording.isRecording}
            referenceFace={selectedReference}
          />

          <StreamControls
            isCameraOn={session.isCameraOn}
            isSwapActive={session.isSwapActive}
            canStartSwap={canStartSwap}
            hasReference={hasReference}
            swapBusy={session.faceStatus === "connecting" || session.faceStatus === "applying"}
            onToggleCamera={handleToggleCamera}
            onToggleSwap={handleToggleSwap}
          />

          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => recording.downloadRecording(remoteStream)}
              disabled={!session.isSwapActive || session.faceStatus !== "live"}
            >
              {recording.isRecording ? "Stop & export" : "Record swap output"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Metric label="Engine" value="Decart Lucy" />
            <Metric label="Mode" value="Real-time" />
            <Metric label="Output" value={session.faceOptions.resolution} />
          </div>

          <ObsVirtualCamPanel
            swapLive={session.isSwapActive && session.faceStatus === "live"}
            remoteStream={remoteStream}
            relayEnabled={relayEnabled}
            relayToken={relayToken}
            onRelayEnabledChange={setRelayEnabled}
            onRelayTokenChange={setRelayToken}
          />
        </div>

        <div className="min-w-0">
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
        </div>
      </div>

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
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
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
}: {
  isCameraOn: boolean;
  isSwapActive: boolean;
  canStartSwap: boolean;
  hasReference: boolean;
  swapBusy: boolean;
  onToggleCamera: () => void;
  onToggleSwap: () => void;
}) {
  const swapDisabled =
    !isCameraOn || swapBusy || (!canStartSwap && !isSwapActive) || (!isSwapActive && !hasReference);

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button
        variant={isCameraOn ? "danger" : "secondary"}
        size="md"
        className="flex-1"
        onClick={onToggleCamera}
      >
        {isCameraOn ? "Close camera" : "Open camera"}
      </Button>
      <Button
        variant={isSwapActive ? "danger" : "primary"}
        size="md"
        className="flex-1"
        onClick={onToggleSwap}
        disabled={swapDisabled}
        title={!hasReference && !isSwapActive ? "Select a reference face first" : undefined}
      >
        {swapBusy ? "Connecting…" : isSwapActive ? "Stop swap" : "Start swap"}
      </Button>
    </div>
  );
}
