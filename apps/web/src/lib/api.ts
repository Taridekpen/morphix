import type { User, Plan, Subscription, PaymentConfig, FacePreset, UserSettings, UsageSummary } from "@morphix/shared";

const API_BASE = "/api";

let accessToken: string | null = localStorage.getItem("accessToken");

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && path !== "/auth/login" && path !== "/auth/register") {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
      if (!retry.ok) throw new Error(await retry.text());
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = json.error ?? json.message ?? message;
    } catch {
      // response was not JSON
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json();
  return res.arrayBuffer() as unknown as T;
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  register: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  getDecartToken: (model: string) =>
    request<{ token: string; expiresAt: string }>("/sessions/decart-token", {
      method: "POST",
      body: JSON.stringify({ model }),
    }),

  getPlans: () => request<Plan[]>("/plans"),

  getPaymentConfig: () => request<PaymentConfig | null>("/billing/payment-config"),

  getSubscription: () =>
    request<{ subscription: Subscription | null; usage: UsageSummary }>("/billing/subscription"),

  submitPayment: (planId: string, txHash: string) =>
    request<Subscription>("/billing/submit-payment", {
      method: "POST",
      body: JSON.stringify({ planId, txHash }),
    }),

  getFacePresets: () => request<FacePreset[]>("/faces/presets"),

  createFacePreset: (formData: FormData) =>
    request<FacePreset>("/faces/presets", { method: "POST", body: formData }),

  deleteFacePreset: (id: string) =>
    request<{ ok: boolean }>(`/faces/presets/${id}`, { method: "DELETE" }),

  getSettings: () => request<UserSettings>("/settings"),

  updateSettings: (data: Partial<UserSettings>) =>
    request<UserSettings>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  getPendingPayments: () => request<Subscription[]>("/admin/pending-payments"),

  approvePayment: (id: string) =>
    request<Subscription>(`/admin/payments/${id}/approve`, { method: "POST" }),

  rejectPayment: (id: string) =>
    request<Subscription>(`/admin/payments/${id}/reject`, { method: "POST" }),

  updatePaymentConfig: (data: object) =>
    request<PaymentConfig>("/admin/payment-config", { method: "PUT", body: JSON.stringify(data) }),

  getUsers: () => request<User[]>("/admin/users"),
};
