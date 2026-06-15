import type { FastifyRequest } from "fastify";

export interface JwtPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
}

export function getUserId(request: FastifyRequest): string {
  const user = request.user as JwtPayload;
  return user.sub;
}

export function requireAdmin(request: FastifyRequest): void {
  const user = request.user as JwtPayload;
  if (user.role !== "admin") {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
}
