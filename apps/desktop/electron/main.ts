import { randomUUID } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  type WebContents,
} from "electron";
import { getWebBaseUrl, OUTPUT_WINDOW_TITLE } from "./config.js";
import { obsVirtualCamService } from "./obs/ObsVirtualCamService.js";
import { isObsPasswordSet, setObsPassword } from "./settings.js";
import type { RelaySignalMessage } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let controlWindow: BrowserWindow | null = null;
let outputWindow: BrowserWindow | null = null;
let relayToken: string | null = null;

function getPreloadPath(): string {
  return join(__dirname, "preload.js");
}

function createControlWindow(): void {
  controlWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Morphix Studio",
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const baseUrl = getWebBaseUrl();
  void controlWindow.loadURL(`${baseUrl}/studio`).catch((err) => {
    console.error("Failed to load Morphix Studio:", err);
  });

  controlWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`Window failed to load ${url}: ${description} (${code})`);
  });

  controlWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  controlWindow.on("closed", () => {
    controlWindow = null;
    void closeOutputWindow();
    void obsVirtualCamService.stopVirtualCam().catch(() => undefined);
  });
}

async function openOutputWindow(): Promise<void> {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.focus();
    return;
  }

  relayToken = randomUUID();

  outputWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: OUTPUT_WINDOW_TITLE,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const baseUrl = getWebBaseUrl();
  await outputWindow.loadURL(`${baseUrl}/obs-output?token=${encodeURIComponent(relayToken)}`);

  outputWindow.on("closed", () => {
    outputWindow = null;
    relayToken = null;
    controlWindow?.webContents.send("morphix:output-closed");
  });
}

async function closeOutputWindow(): Promise<void> {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.close();
  }
  outputWindow = null;
  relayToken = null;
}

function relaySignalToOtherWindow(source: WebContents, message: RelaySignalMessage): void {
  const target =
    controlWindow && source === controlWindow.webContents
      ? outputWindow
      : outputWindow && source === outputWindow.webContents
        ? controlWindow
        : null;

  if (target && !target.isDestroyed()) {
    target.webContents.send("morphix:relay-signal", message);
  }
}

function registerIpc(): void {
  ipcMain.handle("morphix:open-output-window", async () => {
    await openOutputWindow();
  });

  ipcMain.handle("morphix:close-output-window", async () => {
    await closeOutputWindow();
  });

  ipcMain.handle("morphix:validate-relay-token", (_event, token: string) => {
    return relayToken !== null && token === relayToken;
  });

  ipcMain.handle("morphix:get-window-role", (event) => {
    if (controlWindow && event.sender === controlWindow.webContents) return "control";
    if (outputWindow && event.sender === outputWindow.webContents) return "output";
    return "control";
  });

  ipcMain.on("morphix:relay-signal", (event, message: RelaySignalMessage) => {
    relaySignalToOtherWindow(event.sender, message);
  });

  ipcMain.handle("morphix:obs-get-status", () => obsVirtualCamService.getStatus());
  ipcMain.handle("morphix:obs-start-virtual-cam", () => {
    const windowTitle = outputWindow?.getTitle() ?? OUTPUT_WINDOW_TITLE;
    return obsVirtualCamService.startVirtualCam(windowTitle);
  });
  ipcMain.handle("morphix:obs-stop-virtual-cam", () => obsVirtualCamService.stopVirtualCam());
  ipcMain.handle("morphix:obs-password-set", () => isObsPasswordSet());
  ipcMain.handle("morphix:obs-set-password", (_event, password: string) => setObsPassword(password));
}

app.whenReady().then(() => {
  console.log("Morphix Desktop starting…");
  console.log(`Web URL: ${getWebBaseUrl()}`);
  registerIpc();
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void obsVirtualCamService.stopVirtualCam().catch(() => undefined);
  void obsVirtualCamService.disconnect().catch(() => undefined);
});

if (isDev) {
  app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
}
