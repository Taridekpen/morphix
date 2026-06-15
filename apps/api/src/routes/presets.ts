import type { FastifyInstance } from "fastify";
import { createWriteStream } from "fs";
import { mkdir, unlink } from "fs/promises";
import { join, extname } from "path";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { facePresetSchema } from "@morphix/shared";
import { getUserId } from "../lib/auth.js";
import { serialize, serializeMany } from "../lib/serialize.js";
import { FacePreset } from "../models/index.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function presetRoutes(app: FastifyInstance) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  app.get("/faces/presets", { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const presets = await FacePreset.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
    return serializeMany(presets);
  });

  app.post("/faces/presets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: "Image required" });

    const fields = data.fields as Record<string, { value?: string }>;
    const meta = facePresetSchema.parse({
      name: fields.name?.value ?? "Untitled",
      prompt: fields.prompt?.value ?? "",
      isDefault: fields.isDefault?.value === "true",
    });

    const ext = extname(data.filename ?? ".jpg") || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    await pipeline(data.file, createWriteStream(filepath));

    const imageUrl = `/uploads/${filename}`;
    const userObjectId = new Types.ObjectId(userId);

    if (meta.isDefault) {
      await FacePreset.updateMany({ userId: userObjectId }, { isDefault: false });
    }

    const preset = await FacePreset.create({
      userId: userObjectId,
      name: meta.name,
      prompt: meta.prompt,
      imageUrl,
      thumbnailUrl: imageUrl,
      isDefault: meta.isDefault ?? false,
    });

    return serialize(preset.toObject());
  });

  app.delete("/faces/presets/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const { id } = request.params as { id: string };

    if (!Types.ObjectId.isValid(id)) {
      return reply.status(404).send({ error: "Not found" });
    }

    const preset = await FacePreset.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!preset) return reply.status(404).send({ error: "Not found" });

    const filename = preset.imageUrl.replace("/uploads/", "");
    try {
      await unlink(join(UPLOAD_DIR, filename));
    } catch {
      /* ignore */
    }

    await FacePreset.deleteOne({ _id: preset._id });
    return { ok: true };
  });
}
