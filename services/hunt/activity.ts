import "server-only";

import { huntDevicesCollection, huntScansCollection } from "./db";

export interface HuntScanDto {
  id: string;
  code: string;
  houseId: string;
  houseName: string;
  deviceId: string;
  deviceNumber: number | null;
  ip: string | null;
  name: string;
  group: number;
  scannedAt: string;
}

export interface HuntDeviceDto {
  deviceId: string;
  deviceNumber: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastIp: string | null;
  scanCount: number;
}

/** Most recent first — this is the raw capture log, one row per scan. */
export async function listScans(): Promise<HuntScanDto[]> {
  const scans = await huntScansCollection();
  const docs = await scans.find().sort({ scannedAt: -1 }).toArray();

  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    code: doc.code,
    houseId: doc.houseId,
    houseName: doc.houseName,
    deviceId: doc.deviceId,
    // Scans recorded before device tracking shipped won't have these.
    deviceNumber: doc.deviceNumber ?? null,
    ip: doc.ip ?? null,
    name: doc.name,
    group: doc.group,
    scannedAt: doc.scannedAt.toISOString(),
  }));
}

/** Busiest devices first — the view for "who's farming codes." */
export async function listDevices(): Promise<HuntDeviceDto[]> {
  const devices = await huntDevicesCollection();
  const docs = await devices.find().sort({ scanCount: -1, deviceNumber: 1 }).toArray();

  return docs.map((doc) => ({
    deviceId: doc._id,
    deviceNumber: doc.deviceNumber,
    firstSeenAt: doc.firstSeenAt.toISOString(),
    lastSeenAt: doc.lastSeenAt.toISOString(),
    lastIp: doc.lastIp,
    scanCount: doc.scanCount,
  }));
}
