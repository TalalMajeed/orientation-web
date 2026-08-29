import "server-only";

import { MongoServerError, type Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongo";

const COLLECTION_NAME = "waitlist";
const DUPLICATE_KEY = 11000;

export interface WaitlistEntry {
  email: string;
  // Omitted entirely (not stored as "unknown") when the request had no
  // resolvable client IP, so the partial unique index below never sees it.
  ip?: string;
  joinedAt: Date;
}

const UNRESOLVED_IP = "unknown";

export type WaitlistJoinResult =
  | { status: "joined"; count: number }
  | { status: "duplicate-email"; count: number }
  | { status: "duplicate-ip"; count: number };

let indexReady: Promise<unknown> | undefined;

async function collection(): Promise<Collection<WaitlistEntry>> {
  const db = await getMongoDb();
  const entries = db.collection<WaitlistEntry>(COLLECTION_NAME);

  indexReady ??= Promise.all([
    entries.createIndex({ email: 1 }, { unique: true, name: "email_unique" }),
    // One join per network. Partial (rather than sparse) so it's keyed off
    // "the field is present", matching addWaitlistEntry only ever setting
    // `ip` when a real client IP was resolved.
    entries.createIndex(
      { ip: 1 },
      { unique: true, partialFilterExpression: { ip: { $exists: true } }, name: "ip_unique" }
    ),
  ]).catch((error) => {
    console.error("Could not ensure the waitlist indexes:", error);
  });

  await indexReady;

  return entries;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function addWaitlistEntry(email: string, ip: string): Promise<WaitlistJoinResult> {
  const entries = await collection();
  const doc: WaitlistEntry = { email: normalizeEmail(email), joinedAt: new Date() };

  if (ip && ip !== UNRESOLVED_IP) {
    doc.ip = ip;
  }

  try {
    await entries.insertOne(doc);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
      const duplicateField = error.keyPattern && "ip" in error.keyPattern ? "ip" : "email";
      const count = await entries.countDocuments();

      return duplicateField === "ip"
        ? { status: "duplicate-ip", count }
        : { status: "duplicate-email", count };
    }

    throw error;
  }

  return { status: "joined", count: await entries.countDocuments() };
}

export async function countWaitlistEntries(): Promise<number> {
  const entries = await collection();

  return entries.countDocuments();
}
