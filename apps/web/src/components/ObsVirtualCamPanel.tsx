import { useCallback, useEffect, useState } from "react";
import type { ObsStatus } from "@/types/desktop";
import {
  clearRelayToken,
  closeBrowserOutputWindow,
  createRelayToken,
  getObsOutputUrl,
  openBrowserOutputWindow,
} from "@/lib/browserRelay";
import { browserObsClient } from "@/lib/obsClient";
import { isBrowserObsSupported, isDesktopApp } from "@/lib/runtimeEnv";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface ObsVirtualCamPanelProps {
  swapLive: boolean;
  remoteStream: MediaStream | null;
  relayEnabled: boolean;
  relayToken: string | null;
  onRelayEnabledChange: (enabled: boolean) => void;
  onRelayTokenChange: (token: string | null) => void;
}

export function ObsVirtualCamPanel({
  swapLive,
  remoteStream,
  relayEnabled,
  relayToken,
  onRelayEnabledChange,
  onRelayTokenChange,
}: ObsVirtualCamPanelProps) {
  const [status, setStatus] = useState<ObsStatus | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const desktopMode = isDesktopApp();
  const browserMode = isBrowserObsSupported();

  const refreshStatus = useCallback(async () => {
    if (desktopMode && window.morphixDesktop) {
      const next = await window.morphixDesktop.obs.getStatus();
      setStatus(next);
      setActive(next.virtualCamActive);
      return;
    }

    if (browserMode) {
      const next = await browserObsClient.getStatus();
      setStatus(next);
      setActive(next.virtualCamActive);
    }
  }, [browserMode, desktopMode]);

  useEffect(() => {
    if (!desktopMode && !browserMode) return;
    void refreshStatus();
  }, [browserMode, desktopMode, refreshStatus]);

  const handleStartDesktop = async () => {
    if (!window.morphixDesktop || !remoteStream) return;

    if (password.trim()) {
      await window.morphixDesktop.obs.setPassword(password.trim());
    }

    await window.morphixDesktop.openOutputWindow();
    onRelayEnabledChange(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await window.morphixDesktop.obs.startVirtualCam();
    await refreshStatus();
    setActive(true);
  };

  const handleStart = async () => {
    if (!remoteStream) return;
    setBusy(true);
    setError(null);
    let startedToken: string | null = null;

    try {
      if (desktopMode) {
        await handleStartDesktop();
      } else if (browserMode) {
        startedToken = createRelayToken();
        onRelayTokenChange(startedToken);
        openBrowserOutputWindow(startedToken);
        onRelayEnabledChange(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (password.trim()) {
          browserObsClient.setPassword(password.trim());
        }

        await browserObsClient.startVirtualCam(getObsOutputUrl(startedToken));
        await refreshStatus();
        setActive(true);
      }
    } catch (err) {
      onRelayEnabledChange(false);
      onRelayTokenChange(null);
      closeBrowserOutputWindow();
      if (startedToken) {
        clearRelayToken(startedToken);
      }
      setError(err instanceof Error ? err.message : "Failed to start OBS Virtual Camera");
    } finally {
      setBusy(false);
    }
  };

  const handleStopDesktop = async () => {
    if (!window.morphixDesktop) return;
    await window.morphixDesktop.obs.stopVirtualCam();
    onRelayEnabledChange(false);
    await window.morphixDesktop.closeOutputWindow();
    await refreshStatus();
    setActive(false);
  };

  const handleStopBrowser = async () => {
    await browserObsClient.stopVirtualCam();
    onRelayEnabledChange(false);
    closeBrowserOutputWindow();
    if (relayToken) {
      clearRelayToken(relayToken);
    }
    onRelayTokenChange(null);
    await refreshStatus();
    setActive(false);
  };

  const handleStop = async () => {
    setBusy(true);
    setError(null);

    try {
      if (desktopMode) {
        await handleStopDesktop();
      } else if (browserMode) {
        await handleStopBrowser();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop OBS Virtual Camera");
    } finally {
      setBusy(false);
    }
  };

  if (!desktopMode && !browserMode) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">OBS Virtual Camera</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {browserMode
            ? "Localhost only — sends the swapped face to OBS via a browser source, then exposes OBS Virtual Camera to Zoom and Discord."
            : "Sends the swapped face to OBS, then exposes OBS Virtual Camera to Zoom and Discord."}
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
        {browserMode && (
          <Alert variant="info" title="Localhost mode">
            OBS control works when Morphix runs at http://127.0.0.1:5173 with OBS Studio on the same PC. Allow popups
            for this site when starting.
          </Alert>
        )}

        <Input
          label="OBS WebSocket password (if enabled in OBS)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional — OBS → Tools → WebSocket Server Settings"
        />

        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
          <StatusPill label="OBS" ok={status?.connected} />
          <StatusPill label="Scene" ok={status?.sceneReady} />
          <StatusPill label="Virtual cam" ok={status?.virtualCamActive} />
        </div>

        {error && (
          <Alert variant="error" title="OBS error">
            {error}
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {!active ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              disabled={!swapLive || !remoteStream || busy}
            >
              {busy ? "Starting…" : "Start OBS Virtual Camera"}
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={handleStop} disabled={busy}>
              {busy ? "Stopping…" : "Stop OBS Virtual Camera"}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => void refreshStatus()} disabled={busy}>
            Refresh status
          </Button>
        </div>

        {!swapLive && (
          <p className="text-xs text-[var(--text-muted)]">Start face swap first, then enable OBS Virtual Camera.</p>
        )}
      </CardBody>
    </Card>
  );
}

function StatusPill({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${
        ok
          ? "border-[var(--accent-success)]/30 bg-[var(--accent-success)]/10 text-[var(--accent-success)]"
          : "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[var(--accent-success)]" : "bg-[var(--text-muted)]"}`} />
      {label}
    </span>
  );
}
