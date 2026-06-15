import mongoose, { Schema, Types } from "mongoose";

const refreshTokenSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
