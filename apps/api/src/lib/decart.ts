const PLACEHOLDER_KEYS = new Set([
  "",
  "your_decart_api_key_here",
  "changeme",
  "change-me",
]);

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
