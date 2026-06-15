import type { Document } from "mongoose";
import { Types } from "mongoose";

type DocLike = Document | Record<string, unknown> | null | undefined;

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return value.toString();
  return value;
}

export function serialize<T extends DocLike>(doc: T): T extends null | undefined ? null : Record<string, unknown> {
  if (!doc) return null as never;
  const raw = typeof (doc as Document).toObject === "function"
    ? (doc as Document).toObject()
    : { ...(doc as Record<string, unknown>) };

  const { _id, __v, ...rest } = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { id: String(_id) };

  for (const [key, value] of Object.entries(rest)) {
    out[key] = normalizeValue(value);
  }

  return out as never;
}

export function serializeMany(docs: DocLike[]): Record<string, unknown>[] {
  return docs.map((d) => serialize(d) as Record<string, unknown>);
}
