import "server-only";

import { MongoServerError, ObjectId } from "mongodb";

import { ensureHuntIndexes, huntCodesCollection, huntScansCollection } from "./db";
import { findHouse } from "./houses";
import { getWindowState } from "./window";
import type { RedeemResponseDto, RedeemStatusDto } from "./types";

// Cooldown scales with how many times a spot has already been found — a
// fresh code clears fast so early scanners aren't stuck waiting, but a
// heavily-farmed code cools down longer to spread captures around. Capped
// so a very popular code doesn't lock out for the rest of the window.
const COOLDOWN_PER_CAPTURE_MS = 2 * 60 * 1000;
const MAX_COOLDOWN_MS = 30 * 60 * 1000;

function cooldownDurationMs(totalCaptures: number): number {
  return Math.min(MAX_COOLDOWN_MS, COOLDOWN_PER_CAPTURE_MS * totalCaptures);
}

async function deviceAlreadyScanned(code: string, deviceId: string): Promise<boolean> {
  if (!deviceId) {
    return false;
  }

  const scans = await huntScansCollection();
  const existing = await scans.findOne({ code, deviceId });

  return existing !== null;
}

export async function getCodeStatus(code: string, deviceId: string): Promise<RedeemStatusDto> {
  await ensureHuntIndexes();

  const windowState = getWindowState();

  if (windowState !== "open") {
    return { status: windowState, label: null, availableAt: null };
  }

  const collection = await huntCodesCollection();
  const doc = await collection.findOne({ code });

  if (!doc) {
    return { status: "not_found", label: null, availableAt: null };
  }

  // Checked ahead of cooldown: a device that already captured this code
  // should never be told it's "on cooldown" and invited to wait it out.
  if (await deviceAlreadyScanned(code, deviceId)) {
    return { status: "already_scanned", label: doc.label, availableAt: null };
  }

  const now = new Date();
  const onCooldown = doc.cooldownUntil !== null && doc.cooldownUntil > now;

  return {
    status: onCooldown ? "cooldown" : "available",
    label: doc.label,
    availableAt: onCooldown ? doc.cooldownUntil!.toISOString() : null,
  };
}

/**
 * THE CORE RULE, same shape as ticket check-in: one conditional update, no
 * read-then-write. Of N concurrent scanners hitting the same code, exactly one
 * update matches "not currently on cooldown" and wins the capture.
 */
export async function redeemCode(
  code: string,
  deviceId: string,
  name: string,
  houseId: string,
  group: number
): Promise<RedeemResponseDto> {
  await ensureHuntIndexes();

  const windowState = getWindowState();

  if (windowState !== "open") {
    return { result: windowState, houseName: null, availableAt: null };
  }

  const house = findHouse(houseId);

  if (!house) {
    return { result: "invalid_house", houseName: null, availableAt: null };
  }

  const codes = await huntCodesCollection();
  const existingCode = await codes.findOne({ code });

  if (!existingCode) {
    return { result: "not_found", houseName: null, availableAt: null };
  }

  if (await deviceAlreadyScanned(code, deviceId)) {
    return { result: "already_scanned", houseName: null, availableAt: null };
  }

  const now = new Date();
  const cooldownUntil = new Date(
    now.getTime() + cooldownDurationMs(existingCode.captureCount + 1)
  );

  const captured = await codes.findOneAndUpdate(
    {
      code,
      $or: [{ cooldownUntil: null }, { cooldownUntil: { $lte: now } }],
    },
    {
      $set: {
        cooldownUntil,
        lastHouseId: house.id,
        lastHouseName: house.name,
        lastCapturedAt: now,
      },
      $inc: { captureCount: 1 },
    },
    { returnDocument: "after" }
  );

  if (!captured) {
    const existing = await codes.findOne({ code });

    if (!existing) {
      return { result: "not_found", houseName: null, availableAt: null };
    }

    return {
      result: "cooldown",
      houseName: null,
      availableAt: existing.cooldownUntil ? existing.cooldownUntil.toISOString() : null,
    };
  }

  const scans = await huntScansCollection();

  try {
    await scans.insertOne({
      _id: new ObjectId(),
      codeId: captured._id,
      code: captured.code,
      houseId: house.id,
      houseName: house.name,
      deviceId,
      name,
      group,
      scannedAt: now,
    });
  } catch (error) {
    // Belt-and-suspenders: the unique (code, deviceId) index is the last line
    // of defense against a genuine race (the same device submitting twice
    // within milliseconds). The cooldown update above already went through,
    // so report what actually happened rather than a raw 500.
    if (error instanceof MongoServerError && error.code === 11000) {
      return { result: "already_scanned", houseName: null, availableAt: null };
    }

    throw error;
  }

  return { result: "captured", houseName: house.name, availableAt: cooldownUntil.toISOString() };
}
