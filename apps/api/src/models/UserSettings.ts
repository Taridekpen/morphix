import mongoose, { Schema, Types } from "mongoose";

const userSettingsSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    theme: { type: String, default: "system" },
    defaultFacePresetId: { type: String, default: null },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model("UserSettings", userSettingsSchema);
