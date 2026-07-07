import { createDecartClient, models } from "@decartai/sdk";
import { FACE_SWAP_PROMPT, type DecartModelId, type DecartResolution, type SessionStatus } from "@morphix/shared";
import type { MediaManager } from "@morphix/media";
import { api } from "@/lib/api";
import type { SelectedReferenceFace } from "@/lib/faceSwap";

export interface FaceSessionOptions {
  model?: DecartModelId;
  resolution?: DecartResolution;
  mirror?: boolean | "auto";
  enhance?: boolean;
}

type StatusListener = (status: SessionStatus) => void;

export class FaceSessionService {
  private client: { disconnect: () => void; set: (state: object) => Promise<void> } | null = null;
  private decartApiKey = "";
  private status: SessionStatus = "idle";
  private listeners = new Set<StatusListener>();
  private sessionStart = 0;

  constructor(
    private media: MediaManager,
    private videoRef: React.RefObject<HTMLVideoElement | null>,
    private beforeVideoRef?: React.RefObject<HTMLVideoElement | null>
  ) {}

  onStatus(listener: StatusListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SessionStatus) {
    this.status = status;
    this.listeners.forEach((l) => l(status));
  }

  getStatus() {
    return this.status;
  }

  getRemoteStream(): MediaStream | null {
    return this.videoRef.current?.srcObject as MediaStream | null;
  }

  async connect(options: FaceSessionOptions = {}): Promise<void> {
    this.setStatus("connecting");

    const modelId = options.model ?? "lucy-latest";
    const tokenRes = await api.getDecartToken(modelId);
    this.decartApiKey = tokenRes.token;

    if (tokenRes.creditBalance !== null && tokenRes.creditBalance !== undefined) {
      window.dispatchEvent(
        new CustomEvent("morphix:decart-credits", {
          detail: { balance: tokenRes.creditBalance, available: true },
        })
      );
    }

    const decartClient = createDecartClient({ apiKey: this.decartApiKey });
    const model = models.realtime(modelId);

    const videoStream = this.media.getVideoStream();
    if (!videoStream) {
      this.setStatus("camera denied");
      throw new Error("No video stream available");
    }

    if (this.beforeVideoRef?.current) {
      this.beforeVideoRef.current.srcObject = videoStream;
    }

    try {
      this.client = await decartClient.realtime.connect(videoStream, {
        model,
        resolution: options.resolution ?? "720p",
        mirror: options.mirror ?? "auto",
        onRemoteStream: (remote) => {
          if (this.videoRef.current) {
            this.videoRef.current.srcObject = remote;
          }
          this.setStatus("live");
        },
        initialState: {
          prompt: { text: FACE_SWAP_PROMPT, enhance: options.enhance ?? true },
        },
      } as Parameters<typeof decartClient.realtime.connect>[1]);
      this.sessionStart = Date.now();
    } catch (err) {
      this.setStatus("error");
      const message = err instanceof Error ? err.message : "Failed to connect to Decart";
      throw new Error(message);
    }
  }

  async apply(image: File | null, enhance = true): Promise<void> {
    if (!this.client) return;
    this.setStatus("applying");
    try {
      await this.client.set({
        prompt: FACE_SWAP_PROMPT,
        image: image ?? null,
        enhance,
      });
      this.setStatus("live");
    } catch (err) {
      this.setStatus("error");
      throw err instanceof Error ? err : new Error("Failed to apply reference face");
    }
  }

  async applyFromUrl(imageUrl: string, enhance = true): Promise<void> {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const file = new File([blob], "preset.jpg", { type: blob.type });
    await this.apply(file, enhance);
  }

  async applyReference(reference: SelectedReferenceFace, enhance = true): Promise<void> {
    if (reference.source === "upload") {
      await this.apply(reference.file, enhance);
    } else {
      await this.applyFromUrl(reference.imageUrl, enhance);
    }
  }

  stopSwap(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    if (this.videoRef.current) {
      this.videoRef.current.srcObject = null;
    }
    this.setStatus("idle");
    this.sessionStart = 0;
  }

  disconnect(): void {
    this.stopSwap();
    if (this.beforeVideoRef?.current) {
      this.beforeVideoRef.current.srcObject = null;
    }
  }

  getSessionSeconds(): number {
    if (!this.sessionStart) return 0;
    return Math.ceil((Date.now() - this.sessionStart) / 1000);
  }
}
