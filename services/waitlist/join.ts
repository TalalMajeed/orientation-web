import "server-only";

import { MongoServerError, type Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongo";

const COLLECTION_NAME = "waitlist";
const DUPLICATE_KEY = 11000;

export interface WaitlistEntry {
  email: string;
  joinedAt: Date;
}

export type WaitlistJoinResult =
  | { status: "joined"; count: number }
  | { status: "duplicate-email"; count: number };

let indexReady: Promise<unknown> | undefined;

async function collection(): Promise<Collection<WaitlistEntry>> {
  const db = await getMongoDb();
  const entries = db.collection<WaitlistEntry>(COLLECTION_NAME);

  indexReady ??= entries
    .createIndex({ email: 1 }, { unique: true, name: "email_unique" })
    .catch((error) => {
      console.error("Could not ensure the waitlist email index:", error);
    });

  await indexReady;

  return entries;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function addWaitlistEntry(email: string): Promise<WaitlistJoinResult> {
  const entries = await collection();

  try {
    await entries.insertOne({ email: normalizeEmail(email), joinedAt: new Date() });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
      return { status: "duplicate-email", count: await entries.countDocuments() };
    }

    throw error;
  }

  return { status: "joined", count: await entries.countDocuments() };
}

export async function countWaitlistEntries(): Promise<number> {
  const entries = await collection();

  return entries.countDocuments();
}
