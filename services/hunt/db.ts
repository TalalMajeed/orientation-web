import "server-only";

import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongo";
import type { HuntCodeDoc, HuntDeviceDoc, HuntScanDoc } from "./types";

export interface HuntCounterDoc {
  _id: string;
  seq: number;
}

export const HUNT_CODES_COLLECTION = "hunt_codes";
export const HUNT_SCANS_COLLECTION = "hunt_scans";
export const HUNT_DEVICES_COLLECTION = "hunt_devices";
export const HUNT_COUNTERS_COLLECTION = "hunt_counters";

export async function huntCodesCollection(): Promise<Collection<HuntCodeDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntCodeDoc>(HUNT_CODES_COLLECTION);
}

export async function huntScansCollection(): Promise<Collection<HuntScanDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntScanDoc>(HUNT_SCANS_COLLECTION);
}

export async function huntDevicesCollection(): Promise<Collection<HuntDeviceDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntDeviceDoc>(HUNT_DEVICES_COLLECTION);
}

/** { _id: "hunt_device", seq: number } — classic Mongo auto-increment. */
export async function huntCountersCollection(): Promise<Collection<HuntCounterDoc>> {
  const db = await getMongoDb();

  return db.collection<HuntCounterDoc>(HUNT_COUNTERS_COLLECTION);
}

async function createIndexes(): Promise<void> {
  const [codes, scans, devices] = await Promise.all([
    huntCodesCollection(),
    huntScansCollection(),
    huntDevicesCollection(),
  ]);

  await Promise.all([
    codes.createIndex({ code: 1 }, { unique: true }),
    codes.createIndex({ createdAt: -1 }),

    scans.createIndex({ houseId: 1 }),
    scans.createIndex({ scannedAt: -1 }),
    scans.createIndex({ codeId: 1, scannedAt: -1 }),
    scans.createIndex({ deviceNumber: 1, scannedAt: -1 }),
    // Enforces "one device cannot scan the same code twice" at the DB level,
    // not just in application logic.
    scans.createIndex({ code: 1, deviceId: 1 }, { unique: true }),

    devices.createIndex({ deviceNumber: 1 }, { unique: true }),
  ]);
}

let indexPromise: Promise<void> | undefined;

/** Idempotent and memoised, same pattern as the tickets feature. */
export async function ensureHuntIndexes(): Promise<void> {
  if (!indexPromise) {
    indexPromise = createIndexes().catch((error) => {
      indexPromise = undefined;
      throw error;
    });
  }

  return indexPromise;
}
