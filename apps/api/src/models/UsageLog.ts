import mongoose, { Schema, Types } from "mongoose";

const usageLogSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["face"], required: true },
    seconds: { type: Number, required: true },
  },
  { timestamps: true }
);

export const UsageLog = mongoose.model("UsageLog", usageLogSchema);
