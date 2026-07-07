import { useRef } from "react";
import type { SessionStatus, DecartModelId, DecartResolution, FacePreset } from "@morphix/shared";
import type { SelectedReferenceFace } from "@/lib/faceSwap";
import { referenceThumbnail } from "@/lib/faceSwap";
import { Card, CardHeader, CardBody } from "./ui/Card";
import { Button } from "./ui/Button";
import { Select } from "./ui/Input";
import { StatusBadge } from "./ui/Badge";
import { FaceGallery } from "./FaceGallery";
import { isDesktopApp } from "@/lib/runtimeEnv";

interface FacePanelProps {
  status: SessionStatus;
  selectedReference: SelectedReferenceFace | null;
  onSelectPreset: (preset: FacePreset) => void;
  onSelectUpload: (file: File) => void;
  onUploadPreset: (file: File, name: string) => void;
  onDeletePreset: (id: string) => void;
  presets: FacePreset[];
  model: DecartModelId;
  setModel: (m: DecartModelId) => void;
  resolution: DecartResolution;
  setResolution: (r: DecartResolution) => void;
  enhance: boolean;
  setEnhance: (v: boolean) => void;
  onReconnect: () => void;
  isSwapActive: boolean;
}

export function FacePanel({
  status,
  selectedReference,
  onSelectPreset,
  onSelectUpload,
  onUploadPreset,
  onDeletePreset,
  presets,
  model,
  setModel,
  resolution,
  setResolution,
  enhance,
  setEnhance,
  onReconnect,
  isSwapActive,
}: FacePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isDisabled = status === "applying" || status === "connecting";
  const uploadSelected = selectedReference?.source === "upload";
  const desktopMode = isDesktopApp();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    onSelectUpload(file);
  };

  return (
    <Card className={desktopMode ? "desktop-panel desktop-glow lg:rounded-none lg:border-y-0 lg:border-r-0" : ""}>
      <CardHeader className={desktopMode ? "py-3" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`font-semibold text-[var(--primary)] font-display ${desktopMode ? "text-sm tracking-wider" : "text-base text-[var(--text-primary)]"}`}>
              {desktopMode ? "CONFIG" : "Face swap"}
            </h3>
            {!desktopMode && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Select a reference face, then start swap</p>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardBody className={desktopMode ? "space-y-3 py-3" : undefined}>
        {selectedReference ? (
          <div className="rounded-lg border-2 border-[var(--primary)] bg-[var(--primary-muted)]/40 p-3 shadow-[0_0_0_3px_var(--primary-muted)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)] mb-2">
              Reference face in use
            </p>
            <div className="flex items-center gap-3">
              <img
                src={referenceThumbnail(selectedReference)}
                alt=""
                className={`rounded-full object-cover ring-4 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-elevated)] ${
                  desktopMode ? "w-12 h-12" : "w-16 h-16"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {selectedReference.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {selectedReference.source === "preset" ? "Saved preset" : "Uploaded image"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-muted)]/50 px-4 py-3 text-sm text-[var(--text-secondary)]">
            Choose a saved face or upload a reference image before starting swap.
          </div>
        )}

        <FaceGallery
          presets={presets}
          selectedReference={selectedReference}
          onSelect={onSelectPreset}
          onUpload={onUploadPreset}
          onDelete={onDeletePreset}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          className={`p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
            uploadSelected
              ? "border-[var(--primary)] bg-[var(--primary-muted)]/40 shadow-[0_0_0_3px_var(--primary-muted)]"
              : "border-[var(--border-strong)] bg-[var(--bg-muted)]/50 hover:border-[var(--primary)] hover:bg-[var(--primary-muted)]/30"
          }`}
        >
          {uploadSelected ? (
            <div className="flex items-center gap-3">
              <img
                src={selectedReference.previewUrl}
                alt=""
                className="w-12 h-12 rounded-full object-cover ring-4 ring-[var(--primary)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedReference.name}</p>
                <p className="text-xs text-[var(--primary)] font-medium mt-0.5">Active upload</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--text-secondary)]">
              Click to upload a reference face
              <span className="block text-xs text-[var(--text-muted)] mt-1">JPEG, PNG, or WebP · max 5 MB</span>
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={desktopMode ? "Profile" : "Model"}
            value={model}
            onChange={(e) => setModel(e.target.value as DecartModelId)}
            disabled={isDisabled}
          >
            <option value="lucy-latest">Standard</option>
            <option value="lucy-2.1">Balanced</option>
            <option value="lucy-restyle-2">Restyle</option>
          </Select>
          <Select label="Quality" value={resolution} onChange={(e) => setResolution(e.target.value as DecartResolution)} disabled={isDisabled}>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </Select>
        </div>

        <label className={`flex items-center gap-2.5 text-sm text-[var(--text-secondary)] cursor-pointer ${desktopMode ? "font-display text-xs" : ""}`}>
          <input
            type="checkbox"
            checked={enhance}
            onChange={(e) => setEnhance(e.target.checked)}
            className="rounded border-[var(--border-strong)] text-[var(--primary)]"
          />
          {desktopMode ? "Auto-enhance" : "Enhance prompt automatically"}
        </label>

        {isSwapActive && (
          <Button variant="secondary" size="sm" onClick={onReconnect} disabled={isDisabled || !selectedReference}>
            Reconnect with new settings
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
