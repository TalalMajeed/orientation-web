import "server-only";

import { MongoServerError } from "mongodb";

import { huntCountersCollection, huntDevicesCollection } from "./db";

const DUPLICATE_KEY = 11000;

async function nextDeviceNumber(): Promise<number> {
  const counters = await huntCountersCollection();

  const result = await counters.findOneAndUpdate(
    { _id: "hunt_device" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return result!.seq;
}

/**
 * Registers a scan against a device, assigning it a stable sequential
 * number the first time it's seen. Called once per successful capture (not
 * every status check) so scanCount tracks "codes this device has found."
 * Returns the device's number for the caller to stamp onto the scan record.
 */
export async function touchDevice(
  deviceId: string,
  ip: string | null,
  houseName: string
): Promise<number> {
  const devices = await huntDevicesCollection();
  const now = new Date();

  const updated = await devices.findOneAndUpdate(
    { _id: deviceId },
    { $set: { lastSeenAt: now, lastIp: ip, lastHouseName: houseName }, $inc: { scanCount: 1 } },
    { returnDocument: "after" }
  );

  if (updated) {
    return updated.deviceNumber;
  }

  const deviceNumber = await nextDeviceNumber();

  try {
    await devices.insertOne({
      _id: deviceId,
      deviceNumber,
      firstSeenAt: now,
      lastSeenAt: now,
      lastIp: ip,
      lastHouseName: houseName,
      scanCount: 1,
    });
  } catch (error) {
    // Race: another request registered this device between our update-miss
    // and this insert. It already has a number — use that one.
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
      const existing = await devices.findOne({ _id: deviceId });

      if (existing) {
        return existing.deviceNumber;
      }
    }

    throw error;
  }

  return deviceNumber;
}
