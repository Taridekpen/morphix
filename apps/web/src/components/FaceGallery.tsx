import { useRef, useState } from "react";
import type { FacePreset } from "@morphix/shared";
import type { SelectedReferenceFace } from "@/lib/faceSwap";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface FaceGalleryProps {
  presets: FacePreset[];
  selectedReference: SelectedReferenceFace | null;
  onSelect: (preset: FacePreset) => void;
  onUpload: (file: File, name: string) => void;
  onDelete: (id: string) => void;
}

export function FaceGallery({
  presets,
  selectedReference,
  onSelect,
  onUpload,
  onDelete,
}: FaceGalleryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");

  const activePresetId =
    selectedReference?.source === "preset" ? selectedReference.presetId : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--text-secondary)]">Saved faces</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {presets.map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                isActive
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)] scale-105 shadow-[0_0_0_3px_var(--primary-muted)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
              title={p.name}
              aria-pressed={isActive}
            >
              <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-center bg-[var(--primary)] text-white">
                  Active
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-[var(--border-strong)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          aria-label="Save new face preset"
        >
          <span className="text-xl leading-none">+</span>
        </button>
      </div>

      {activePresetId && presets.some((p) => p.id === activePresetId) && (
        <Button variant="ghost" size="sm" onClick={() => onDelete(activePresetId)}>
          Remove selected preset
        </Button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file, name || file.name.replace(/\.[^.]+$/, ""));
            setName("");
          }
        }}
      />

      <Input
        label="Preset name (when saving to gallery)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
      />
    </div>
  );
}
