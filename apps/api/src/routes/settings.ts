import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { userSettingsSchema } from "@morphix/shared";
import { getUserId } from "../lib/auth.js";
import { serialize } from "../lib/serialize.js";
import { UserSettings } from "../models/index.js";

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/settings", { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const userObjectId = new Types.ObjectId(userId);

    let settings = await UserSettings.findOne({ userId: userObjectId }).lean();
    if (!settings) {
      settings = await UserSettings.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { upsert: true, new: true }
      ).lean();
    }

    return serialize(settings);
  });

  app.put("/settings", { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const body = userSettingsSchema.parse(request.body);
    const userObjectId = new Types.ObjectId(userId);

    const settings = await UserSettings.findOneAndUpdate(
      { userId: userObjectId },
      { $set: body },
      { new: true, upsert: true }
    ).lean();

    return serialize(settings);
  });
}
