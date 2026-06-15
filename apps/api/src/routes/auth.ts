import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { loginSchema, registerSchema } from "@morphix/shared";
import { User, RefreshToken, UserSettings } from "../models/index.js";
import { serialize } from "../lib/serialize.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email: body.email,
      passwordHash,
      role: "user",
    });
    await UserSettings.create({ userId: user._id });

    const accessToken = app.jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      { expiresIn: "15m" }
    );

    const refreshToken = randomBytes(48).toString("hex");
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    reply.setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      accessToken,
      user: { id: user._id.toString(), email: user.email, role: user.role },
    };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await User.findOne({ email: body.email });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const accessToken = app.jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      { expiresIn: "15m" }
    );

    const refreshToken = randomBytes(48).toString("hex");
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    reply.setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      accessToken,
      user: { id: user._id.toString(), email: user.email, role: user.role },
    };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: "No refresh token" });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }

    const accessToken = app.jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      { expiresIn: "15m" }
    );

    return { accessToken };
  });

  app.post("/auth/logout", { preHandler: [app.authenticate] }, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteMany({ token: refreshToken });
    }
    reply.clearCookie("refreshToken", { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    const user = request.user as { sub: string };
    const dbUser = await User.findById(user.sub).lean();
    if (!dbUser) return null;
    return serialize(dbUser);
  });
}
