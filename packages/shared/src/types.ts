export type SessionStatus =
  | "connecting"
  | "live"
  | "applying"
  | "error"
  | "camera denied"
  | "idle";

export type DecartModelId = "lucy-latest" | "lucy-2.1" | "lucy-restyle-2";

export type DecartResolution = "720p" | "1080p";

export type UserRole = "user" | "admin";

export type SubscriptionStatus =
  | "pending_review"
  | "active"
  | "rejected"
  | "expired";

export type UsageType = "face";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  durationDays: number;
  faceMinutesLimit: number;
  maxPresets: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  expiresAt: string | null;
  txHash: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  plan?: Plan;
}

export interface PaymentConfig {
  id: string;
  walletAddress: string;
  network: string;
  currency: string;
  instructions: string;
}

export interface FacePreset {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  isDefault: boolean;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  defaultFacePresetId: string | null;
}

export interface DecartTokenResponse {
  token: string;
  expiresAt: string;
}

export interface UsageSummary {
  faceSecondsUsed: number;
  faceMinutesLimit: number;
}
