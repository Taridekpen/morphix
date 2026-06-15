export type RelaySignalMessage =
  | { type: "ready" }
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit | null };

export interface ObsStatus {
  connected: boolean;
  virtualCamActive: boolean;
  sceneReady: boolean;
  error?: string;
}

export interface MorphixDesktopAPI {
  isDesktop: boolean;
  windowRole: "control" | "output";
  openOutputWindow: () => Promise<void>;
  closeOutputWindow: () => Promise<void>;
  validateRelayToken: (token: string) => Promise<boolean>;
  getWindowRole: () => Promise<"control" | "output">;
  sendRelaySignal: (message: RelaySignalMessage) => void;
  onRelaySignal: (callback: (message: RelaySignalMessage) => void) => void;
  obs: {
    getStatus: () => Promise<ObsStatus>;
    startVirtualCam: () => Promise<void>;
    stopVirtualCam: () => Promise<void>;
    isPasswordSet: () => Promise<boolean>;
    setPassword: (password: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    morphixDesktop?: MorphixDesktopAPI;
  }
}

export {};
