import mongoose, { Schema, Types } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Types.ObjectId, ref: "Plan", required: true },
    status: {
      type: String,
      enum: ["pending_review", "active", "rejected", "expired"],
      default: "pending_review",
    },
    expiresAt: { type: Date, default: null },
    txHash: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
