import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../src/lib/db.js";
import {
  User,
  UserSettings,
  Plan,
  Subscription,
  PaymentConfig,
} from "../src/models/index.js";

async function main() {
  await connectDb();

  const adminHash = await bcrypt.hash("admin123456", 12);
  let admin = await User.findOne({ email: "admin@morphix.local" });

  if (!admin) {
    admin = await User.create({
      email: "admin@morphix.local",
      passwordHash: adminHash,
      role: "admin",
    });
    await UserSettings.create({ userId: admin._id });
  }

  const plans = [
    {
      name: "Starter",
      priceUsd: 9.99,
      durationDays: 30,
      faceMinutesLimit: 120,
      maxPresets: 5,
    },
    {
      name: "Pro",
      priceUsd: 29.99,
      durationDays: 30,
      faceMinutesLimit: 600,
      maxPresets: 20,
    },
  ];

  for (const plan of plans) {
    const existing = await Plan.findOne({ name: plan.name });
    if (!existing) {
      await Plan.create(plan);
    }
  }

  const proPlan = await Plan.findOne({ name: "Pro" });
  if (proPlan) {
    const existingSub = await Subscription.findOne({
      userId: admin._id,
      status: "active",
    });
    if (!existingSub) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await Subscription.create({
        userId: admin._id,
        planId: proPlan._id,
        status: "active",
        approvedAt: new Date(),
        approvedBy: admin._id,
        expiresAt,
        txHash: "seed-admin-active",
      });
    }
  }

  const config = await PaymentConfig.findOne();
  if (!config) {
    await PaymentConfig.create({
      walletAddress: "0x0000000000000000000000000000000000000000",
      network: "Ethereum",
      currency: "ETH",
      instructions: "Send the exact plan amount to this address, then submit your transaction hash.",
      updatedBy: admin._id,
    });
  }

  console.log("Seed complete. Admin: admin@morphix.local / admin123456");
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
