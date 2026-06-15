import mongoose, { Schema } from "mongoose";

const planSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    priceUsd: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    faceMinutesLimit: { type: Number, required: true },
    maxPresets: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model("Plan", planSchema);
