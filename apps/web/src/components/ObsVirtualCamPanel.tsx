import { useCallback, useEffect, useState } from "react";
import type { ObsStatus } from "@/types/desktop";
import { isDesktopApp } from "@/lib/streamRelay";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface ObsVirtualCamPanelProps {
  swapLive: boolean;
  remoteStream: MediaStream | null;
  relayEnabled: boolean;
  onRelayEnabledChange: (enabled: boolean) => void;
}

export function ObsVirtualCamPanel({
  swapLive,
  remoteStream,
  relayEnabled,
  onRelayEnabledChange,
}: ObsVirtualCamPanelProps) {
  const [status, setStatus] = useState<ObsStatus | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!window.morphixDesktop) return;
    const next = await window.morphixDesktop.obs.getStatus();
    setStatus(next);
    setActive(next.virtualCamActive);
  }, []);

  useEffect(() => {
    if (!isDesktopApp()) return;
    void refreshStatus();
  }, [refreshStatus]);

  const handleStart = async () => {
    if (!window.morphixDesktop || !remoteStream) return;
    setBusy(true);
    setError(null);
    try {
      if (password.trim()) {
        await window.morphixDesktop.obs.setPassword(password.trim());
      }

      await window.morphixDesktop.openOutputWindow();
      onRelayEnabledChange(true);

      await new Promise((resolve) => setTimeout(resolve, 800));
      await window.morphixDesktop.obs.startVirtualCam();
      await refreshStatus();
      setActive(true);
    } catch (err) {
      onRelayEnabledChange(false);
      setError(err instanceof Error ? err.message : "Failed to start OBS Virtual Camera");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!window.morphixDesktop) return;
    setBusy(true);
    setError(null);
    try {
      await window.morphixDesktop.obs.stopVirtualCam();
      onRelayEnabledChange(false);
      await window.morphixDesktop.closeOutputWindow();
      await refreshStatus();
      setActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop OBS Virtual Camera");
    } finally {
      setBusy(false);
    }
  };

  if (!isDesktopApp()) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">OBS Virtual Camera</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Sends the swapped face to OBS, then exposes &quot;OBS Virtual Camera&quot; to Zoom and Discord.
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
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
