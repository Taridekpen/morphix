import type { RelaySignalMessage } from "@/types/desktop";

const RELAY_STORAGE_PREFIX = "morphix-relay:";
const OUTPUT_WINDOW_NAME = "morphix-output";

let outputPopup: Window | null = null;

export function createRelayToken(): string {
  const token = crypto.randomUUID();
  sessionStorage.setItem(`${RELAY_STORAGE_PREFIX}${token}`, String(Date.now()));
  return token;
}

export function validateRelayToken(token: string): boolean {
  return sessionStorage.getItem(`${RELAY_STORAGE_PREFIX}${token}`) !== null;
}

export function clearRelayToken(token: string): void {
  sessionStorage.removeItem(`${RELAY_STORAGE_PREFIX}${token}`);
}

export function getObsOutputUrl(token: string): string {
  return `${window.location.origin}/obs-output?token=${encodeURIComponent(token)}`;
}

export function openBrowserOutputWindow(token: string): Window {
  const url = getObsOutputUrl(token);
  outputPopup = window.open(url, OUTPUT_WINDOW_NAME, "width=1280,height=720,menubar=no,toolbar=no");
  if (!outputPopup) {
    throw new Error("Popup blocked. Allow popups for 127.0.0.1:5173 and try again.");
  }
  return outputPopup;
}

export function closeBrowserOutputWindow(): void {
  outputPopup?.close();
  outputPopup = null;
}

export interface RelayTransport {
  send: (message: RelaySignalMessage) => void;
  onMessage: (callback: (message: RelaySignalMessage) => void) => () => void;
  dispose: () => void;
}

export function createBrowserRelayTransport(token: string): RelayTransport {
  const channel = new BroadcastChannel(`morphix-relay-${token}`);
  const listeners = new Set<(message: RelaySignalMessage) => void>();

  channel.onmessage = (event: MessageEvent<RelaySignalMessage>) => {
    listeners.forEach((listener) => listener(event.data));
  };

  return {
    send: (message) => channel.postMessage(message),
    onMessage: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose: () => channel.close(),
  };
}
