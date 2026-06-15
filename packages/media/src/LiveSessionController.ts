import { MediaManager } from "./MediaManager.js";

export interface LiveSessionHandlers {
  onFaceStart?: () => Promise<void>;
  onFaceStop?: () => Promise<void>;
}

export class LiveSessionController {
  readonly media = new MediaManager();
  private cameraOn = false;
  private swapActive = false;
  private handlers: LiveSessionHandlers = {};

  setHandlers(handlers: LiveSessionHandlers): void {
    this.handlers = handlers;
  }

  getIsCameraOn(): boolean {
    return this.cameraOn;
  }

  getIsSwapActive(): boolean {
    return this.swapActive;
  }

  async startCamera(options?: { video?: boolean }): Promise<void> {
    if (this.cameraOn) return;

    await this.media.acquire({
      video: options?.video ?? true,
      audio: false,
    });

    this.cameraOn = true;
  }

  async stopCamera(): Promise<void> {
    if (!this.cameraOn) return;

    if (this.swapActive) {
      await this.stopSwap();
    }

    this.media.teardown();
    this.cameraOn = false;
  }

  async startSwap(): Promise<void> {
    if (!this.cameraOn) {
      throw new Error("Camera must be on before starting face swap");
    }
    if (this.swapActive) return;

    if (this.handlers.onFaceStart) {
      await this.handlers.onFaceStart();
    }

    this.swapActive = true;
  }

  async stopSwap(): Promise<void> {
    if (!this.swapActive) return;

    if (this.handlers.onFaceStop) {
      await this.handlers.onFaceStop();
    }

    this.swapActive = false;
  }

  async stopAll(): Promise<void> {
    await this.stopCamera();
  }
}
