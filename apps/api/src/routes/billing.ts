import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { paymentConfigSchema, submitPaymentSchema } from "@morphix/shared";
import { getUserId, requireAdmin } from "../lib/auth.js";
import { getUsageSummary, formatSubscription } from "../lib/usage.js";
import { serialize, serializeMany } from "../lib/serialize.js";
import {
  Plan,
  Subscription,
  PaymentConfig,
  User,
} from "../models/index.js";

export async function billingRoutes(app: FastifyInstance) {
  app.get("/plans", async () => {
    const plans = await Plan.find().sort({ priceUsd: 1 }).lean();
    return serializeMany(plans);
  });

  app.get("/billing/payment-config", async () => {
    const config = await PaymentConfig.findOne().sort({ updatedAt: -1 }).lean();
    return config ? serialize(config) : null;
  });

  app.get("/billing/subscription", { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const subscription = await Subscription.findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
    const usage = await getUsageSummary(userId);
    return { subscription: await formatSubscription(subscription), usage };
  });

  app.post("/billing/submit-payment", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const body = submitPaymentSchema.parse(request.body);

    if (!Types.ObjectId.isValid(body.planId)) {
      return reply.status(400).send({ error: "Invalid plan ID" });
    }

    const plan = await Plan.findById(body.planId);
    if (!plan) return reply.status(404).send({ error: "Plan not found" });

    const subscription = await Subscription.create({
      userId: new Types.ObjectId(userId),
      planId: plan._id,
      status: "pending_review",
      txHash: body.txHash,
      submittedAt: new Date(),
    });

    return formatSubscription(subscription.toObject());
  });

  app.get("/admin/pending-payments", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      requireAdmin(request);
    } catch {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const pending = await Subscription.find({ status: "pending_review" })
      .sort({ submittedAt: -1 })
      .lean();

    const results = await Promise.all(
      pending.map(async (sub) => {
        const formatted = await formatSubscription(sub);
        const user = await User.findById(sub.userId).select("email").lean();
        return {
          ...formatted,
          user: user ? { id: String(user._id), email: user.email } : null,
        };
      })
    );

    return results;
  });

  app.post("/admin/payments/:id/approve", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      requireAdmin(request);
    } catch {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(404).send({ error: "Not found" });
    }

    const adminId = getUserId(request);
    const sub = await Subscription.findById(id).lean();
    if (!sub) return reply.status(404).send({ error: "Not found" });

    const plan = await Plan.findById(sub.planId);
    if (!plan) return reply.status(404).send({ error: "Plan not found" });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    const updated = await Subscription.findByIdAndUpdate(
      id,
      {
        status: "active",
        approvedAt: new Date(),
        approvedBy: new Types.ObjectId(adminId),
        expiresAt,
      },
      { new: true }
    ).lean();

    return formatSubscription(updated);
  });

  app.post("/admin/payments/:id/reject", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      requireAdmin(request);
    } catch {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(404).send({ error: "Not found" });
    }

    const updated = await Subscription.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    ).lean();

    return formatSubscription(updated);
  });

  app.put("/admin/payment-config", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      requireAdmin(request);
    } catch {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const body = paymentConfigSchema.parse(request.body);
    const adminId = getUserId(request);
    const existing = await PaymentConfig.findOne();

    if (existing) {
      const updated = await PaymentConfig.findByIdAndUpdate(
        existing._id,
        { ...body, updatedBy: new Types.ObjectId(adminId) },
        { new: true }
      ).lean();
      return serialize(updated);
    }

    const created = await PaymentConfig.create({
      ...body,
      updatedBy: new Types.ObjectId(adminId),
    });
    return serialize(created.toObject());
  });

  app.get("/admin/users", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      requireAdmin(request);
    } catch {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const users = await User.find()
      .select("email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return serializeMany(users);
  });
}
