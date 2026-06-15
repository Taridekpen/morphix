import { contextBridge, ipcRenderer } from "electron";
import type { MorphixDesktopAPI, RelaySignalMessage } from "./types.js";

const api: MorphixDesktopAPI = {
  isDesktop: true,
  windowRole: "control",

  openOutputWindow: () => ipcRenderer.invoke("morphix:open-output-window"),
  closeOutputWindow: () => ipcRenderer.invoke("morphix:close-output-window"),
  validateRelayToken: (token: string) => ipcRenderer.invoke("morphix:validate-relay-token", token),
  getWindowRole: () => ipcRenderer.invoke("morphix:get-window-role"),

  sendRelaySignal: (message: RelaySignalMessage) => {
    ipcRenderer.send("morphix:relay-signal", message);
  },
  onRelaySignal: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, message: RelaySignalMessage) => {
      callback(message);
    };
    ipcRenderer.on("morphix:relay-signal", handler);
    return () => ipcRenderer.removeListener("morphix:relay-signal", handler);
  },

  obs: {
    getStatus: () => ipcRenderer.invoke("morphix:obs-get-status"),
    startVirtualCam: () => ipcRenderer.invoke("morphix:obs-start-virtual-cam"),
    stopVirtualCam: () => ipcRenderer.invoke("morphix:obs-stop-virtual-cam"),
    isPasswordSet: () => ipcRenderer.invoke("morphix:obs-password-set"),
    setPassword: (password: string) => ipcRenderer.invoke("morphix:obs-set-password", password),
  },
};

contextBridge.exposeInMainWorld("morphixDesktop", api);
