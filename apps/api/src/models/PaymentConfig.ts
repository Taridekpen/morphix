import mongoose, { Schema, Types } from "mongoose";

const paymentConfigSchema = new Schema(
  {
    walletAddress: { type: String, required: true },
    network: { type: String, required: true },
    currency: { type: String, required: true },
    instructions: { type: String, required: true },
    updatedBy: { type: Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const PaymentConfig = mongoose.model("PaymentConfig", paymentConfigSchema);
