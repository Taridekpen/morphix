import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const decartTokenSchema = z.object({
  model: z.enum(["lucy-latest", "lucy-2.1", "lucy-restyle-2"]).default("lucy-latest"),
});

export const facePresetSchema = z.object({
  name: z.string().min(1).max(64),
  prompt: z.string().max(500).default(""),
  isDefault: z.boolean().optional(),
});

export const submitPaymentSchema = z.object({
  planId: z.string().min(1),
  txHash: z.string().min(10).max(128),
});

export const paymentConfigSchema = z.object({
  walletAddress: z.string().min(10),
  network: z.string().min(1),
  currency: z.string().min(1),
  instructions: z.string().max(2000),
});

export const userSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  defaultFacePresetId: z.string().nullable().optional(),
});
