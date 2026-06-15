import mongoose, { Schema, Types } from "mongoose";

const facePresetSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    prompt: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const FacePreset = mongoose.model("FacePreset", facePresetSchema);
