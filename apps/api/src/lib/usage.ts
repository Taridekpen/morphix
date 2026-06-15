import type { UsageType } from "@morphix/shared";
import { Types } from "mongoose";
import { Subscription, Plan, UsageLog } from "../models/index.js";
import { serialize } from "./serialize.js";

export async function getUsageSummary(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const subscription = await Subscription.findOne({
    userId: userObjectId,
    status: "active",
    expiresAt: { $gt: new Date() },
  })
    .sort({ approvedAt: -1 })
    .lean();

  let plan = null;
  if (subscription?.planId) {
    plan = await Plan.findById(subscription.planId).lean();
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const logs = await UsageLog.aggregate<{ _id: UsageType; total: number }>([
    {
      $match: {
        userId: userObjectId,
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$seconds" },
      },
    },
  ]);

  const faceSeconds = logs.find((l) => l._id === "face")?.total ?? 0;

  return {
    faceSecondsUsed: faceSeconds,
    faceMinutesLimit: (plan?.faceMinutesLimit ?? 0) * 60,
    hasActiveSubscription: !!subscription,
  };
}

export async function checkUsageAllowed(userId: string, type: UsageType): Promise<boolean> {
  const summary = await getUsageSummary(userId);
  if (!summary.hasActiveSubscription) return false;
  return summary.faceSecondsUsed < summary.faceMinutesLimit;
}

export async function logUsage(userId: string, type: UsageType, seconds: number): Promise<void> {
  if (seconds <= 0) return;
  await UsageLog.create({
    userId: new Types.ObjectId(userId),
    type,
    seconds,
  });
}

export async function formatSubscription(sub: Record<string, unknown> | null) {
  if (!sub) return null;
  const base = serialize(sub);
  const plan = sub.planId
    ? serialize(await Plan.findById(sub.planId as Types.ObjectId).lean())
    : null;
  return { ...base, planId: String(sub.planId), plan };
}
