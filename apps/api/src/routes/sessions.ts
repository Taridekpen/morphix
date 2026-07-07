import type { FastifyInstance } from "fastify";
import { decartTokenSchema, DECART_TOKEN_EXPIRES_IN } from "@morphix/shared";
import { getUserId } from "../lib/auth.js";
import { checkUsageAllowed } from "../lib/usage.js";
import {
  createDecartClientToken,
  fetchDecartCredits,
  invalidateDecartCreditsCache,
  requireDecartApiKey,
} from "../lib/decart.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.get(
    "/sessions/decart-credits",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      let apiKey: string;
      try {
        apiKey = requireDecartApiKey();
      } catch (err) {
        return reply.status(503).send({
          error: err instanceof Error ? err.message : "Decart API key is not configured",
        });
      }

      try {
        const credits = await fetchDecartCredits(apiKey);
        return credits;
      } catch (err) {
        request.log.error({ err }, "Failed to fetch Decart credits");
        return reply.status(502).send({
          error: "Failed to fetch Decart credit balance",
        });
      }
    }
  );

  app.post(
    "/sessions/decart-token",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = getUserId(request);
      const allowed = await checkUsageAllowed(userId, "face");
      if (!allowed) {
        return reply.status(402).send({ error: "Face usage limit reached or no active subscription" });
      }

      let apiKey: string;
      try {
        apiKey = requireDecartApiKey();
      } catch (err) {
        return reply.status(503).send({
          error: err instanceof Error ? err.message : "Decart API key is not configured",
        });
      }

      const body = decartTokenSchema.parse(request.body ?? {});

      try {
        invalidateDecartCreditsCache();
        const tokenResult = await createDecartClientToken(apiKey, {
          expiresIn: DECART_TOKEN_EXPIRES_IN,
          allowedModels: [body.model],
        });

        return {
          token: tokenResult.token,
          expiresAt: tokenResult.expiresAt,
          creditBalance: tokenResult.creditBalance,
        };
      } catch (err) {
        request.log.error({ err }, "Failed to create Decart token");
        const detail = err instanceof Error ? err.message : String(err);
        const invalidKey =
          detail.includes("401") ||
          detail.toLowerCase().includes("invalid") ||
          detail.toLowerCase().includes("expired");

        return reply.status(invalidKey ? 503 : 502).send({
          error: invalidKey
            ? "Decart rejected the API key. Update DECART_API_KEY in apps/api/.env with a valid key from https://platform.decart.ai, then restart the API server."
            : "Failed to create a Decart session token. Try again in a moment.",
        });
      }
    }
  );
}
