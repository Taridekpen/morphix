import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth.js";
import { sessionRoutes } from "./routes/sessions.js";
import { billingRoutes } from "./routes/billing.js";
import { presetRoutes } from "./routes/presets.js";
import { settingsRoutes } from "./routes/settings.js";
import { connectDb } from "./lib/db.js";
import { isDecartApiKeyConfigured } from "./lib/decart.js";
import type { JwtPayload } from "./lib/auth.js";

config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

const PORT = Number(process.env.PORT ?? 3001);
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  credentials: true,
});

await app.register(cookie);
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
});
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
await app.register(fastifyStatic, {
  root: join(process.cwd(), UPLOAD_DIR),
  prefix: "/uploads/",
  decorateReply: false,
});

app.decorate("authenticate", async (request, reply) => {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: "Unauthorized" });
  }
});

app.get("/health", async () => ({ ok: true }));

await connectDb();

await authRoutes(app);
await sessionRoutes(app);
await billingRoutes(app);
await presetRoutes(app);
await settingsRoutes(app);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`API running on http://localhost:${PORT}`);
  if (!isDecartApiKeyConfigured()) {
    app.log.warn(
      "DECART_API_KEY is missing or still a placeholder — face swap will not work until you set a valid key in apps/api/.env"
    );
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
