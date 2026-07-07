const DECART_API_BASE = "https://api.decart.ai";

const CREDIT_GET_CANDIDATES = [
  `${DECART_API_BASE}/v1/account/credits`,
  `${DECART_API_BASE}/v1/credits/balance`,
  `${DECART_API_BASE}/v1/billing/credits`,
  `${DECART_API_BASE}/v1/account`,
  `${DECART_API_BASE}/v1/me`,
];

const PLACEHOLDER_KEYS = new Set([
  "",
  "your_decart_api_key_here",
  "changeme",
  "change-me",
]);

export interface DecartClientTokenResult {
  token: string;
  expiresAt: string;
  creditBalance: number | null;
}

export interface DecartCreditsResult {
  balance: number | null;
  available: boolean;
}

let cachedCredits: { result: DecartCreditsResult; at: number } | null = null;
const CREDITS_CACHE_MS = 10_000;

export function getDecartApiKey(): string | null {
  const key = process.env.DECART_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key.toLowerCase())) {
    return null;
  }
  return key;
}

export function requireDecartApiKey(): string {
  const key = getDecartApiKey();
  if (!key) {
    throw new Error(
      "DECART_API_KEY is missing or still set to the placeholder. Add a valid key from https://platform.decart.ai to apps/api/.env and restart the API server."
    );
  }
  return key;
}

export function isDecartApiKeyConfigured(): boolean {
  return getDecartApiKey() !== null;
}

export function extractDecartCreditBalance(data: unknown): number | null {
  if (data === null || data === undefined) return null;

  if (typeof data === "number" && Number.isFinite(data)) {
    return data;
  }

  if (typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const directKeys = [
    "creditBalance",
    "creditsBalance",
    "credits",
    "balance",
    "remainingCredits",
    "availableCredits",
    "credit_balance",
    "credits_balance",
    "remaining_credits",
    "available_credits",
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  for (const nestedKey of ["account", "billing", "usage", "data"]) {
    const nested = record[nestedKey];
    const nestedBalance = extractDecartCreditBalance(nested);
    if (nestedBalance !== null) return nestedBalance;
  }

  return null;
}

async function decartFetchJson(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: unknown } | { ok: false; status: number }> {
  const response = await fetch(`${DECART_API_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, data };
}

export async function createDecartClientToken(
  apiKey: string,
  options: { expiresIn: number; allowedModels: string[] }
): Promise<DecartClientTokenResult> {
  const result = await decartFetchJson(apiKey, "/v1/client/tokens", {
    method: "POST",
    body: JSON.stringify({
      expiresIn: options.expiresIn,
      allowedModels: options.allowedModels,
    }),
  });

  if (!result.ok) {
    throw new Error(`Decart token request failed (${result.status})`);
  }

  const payload = result.data as Record<string, unknown>;
  const token = String(payload.apiKey ?? "");
  const expiresAt = String(payload.expiresAt ?? "");

  if (!token || !expiresAt) {
    throw new Error("Decart token response was missing apiKey or expiresAt");
  }

  return {
    token,
    expiresAt,
    creditBalance: extractDecartCreditBalance(payload),
  };
}

export async function fetchDecartCredits(apiKey: string): Promise<DecartCreditsResult> {
  if (cachedCredits && Date.now() - cachedCredits.at < CREDITS_CACHE_MS) {
    return cachedCredits.result;
  }

  for (const url of CREDIT_GET_CANDIDATES) {
    const path = url.replace(DECART_API_BASE, "");
    const result = await decartFetchJson(apiKey, path, { method: "GET" });
    if (!result.ok) continue;

    const balance = extractDecartCreditBalance(result.data);
    if (balance !== null) {
      const response = { balance, available: true };
      cachedCredits = { result: response, at: Date.now() };
      return response;
    }
  }

  try {
    const tokenResult = await createDecartClientToken(apiKey, {
      expiresIn: 60,
      allowedModels: ["lucy-latest"],
    });
    const response: DecartCreditsResult = {
      balance: tokenResult.creditBalance,
      available: tokenResult.creditBalance !== null,
    };
    cachedCredits = { result: response, at: Date.now() };
    return response;
  } catch {
    const response: DecartCreditsResult = { balance: null, available: false };
    cachedCredits = { result: response, at: Date.now() };
    return response;
  }
}

export function invalidateDecartCreditsCache(): void {
  cachedCredits = null;
}
