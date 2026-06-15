import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { getSettingsPath } from "./config.js";

interface DesktopSettings {
  obsWebSocketPassword?: string;
}

let cache: DesktopSettings | null = null;

async function loadSettings(): Promise<DesktopSettings> {
  if (cache) return cache;
  try {
    const raw = await readFile(getSettingsPath(), "utf8");
    cache = JSON.parse(raw) as DesktopSettings;
  } catch {
    cache = {};
  }
  return cache;
}

export async function getObsPassword(): Promise<string | undefined> {
  const settings = await loadSettings();
  return settings.obsWebSocketPassword;
}

export async function setObsPassword(password: string): Promise<void> {
  const settings = await loadSettings();
  settings.obsWebSocketPassword = password;
  cache = settings;
  const path = getSettingsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(settings, null, 2), "utf8");
}

export async function isObsPasswordSet(): Promise<boolean> {
  const password = await getObsPassword();
  return !!password;
}
