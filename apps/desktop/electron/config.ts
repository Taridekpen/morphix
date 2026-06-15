import { join } from "path";
import { app } from "electron";

export const OUTPUT_WINDOW_TITLE = "Morphix Output";
export const MORPHIX_SCENE_NAME = "Morphix";
export const MORPHIX_INPUT_NAME = "Morphix Swap";
export const OBS_WS_URL = "ws://127.0.0.1:4455";

export function getWebBaseUrl(): string {
  return process.env.MORPHIX_WEB_URL ?? "http://127.0.0.1:5173";
}

export function getSettingsPath(): string {
  return join(app.getPath("userData"), "desktop-settings.json");
}
