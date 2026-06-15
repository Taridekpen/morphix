import type { FacePreset } from "@morphix/shared";

export type SelectedReferenceFace =
  | {
      source: "preset";
      presetId: string;
      name: string;
      imageUrl: string;
      thumbnailUrl: string;
    }
  | {
      source: "upload";
      name: string;
      file: File;
      previewUrl: string;
    };

export function presetToReference(preset: FacePreset): SelectedReferenceFace {
  return {
    source: "preset",
    presetId: preset.id,
    name: preset.name,
    imageUrl: preset.imageUrl,
    thumbnailUrl: preset.thumbnailUrl,
  };
}

export function uploadToReference(file: File): SelectedReferenceFace {
  return {
    source: "upload",
    name: file.name.replace(/\.[^.]+$/, "") || file.name,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function referenceThumbnail(ref: SelectedReferenceFace): string {
  return ref.source === "preset" ? ref.thumbnailUrl : ref.previewUrl;
}

export function referencesMatch(a: SelectedReferenceFace | null, b: SelectedReferenceFace | null): boolean {
  if (!a || !b || a.source !== b.source) return false;
  if (a.source === "preset" && b.source === "preset") return a.presetId === b.presetId;
  if (a.source === "upload" && b.source === "upload") return a.file === b.file;
  return false;
}
