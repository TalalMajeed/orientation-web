import type { ObjectId } from "mongodb";

export interface HuntCodeDoc {
  _id: ObjectId;
  code: string;
  label: string | null;
  createdAt: Date;
  captureCount: number;
  cooldownUntil: Date | null;
  lastHouseId: string | null;
  lastHouseName: string | null;
  lastCapturedAt: Date | null;
}

export interface HuntScanDoc {
  _id: ObjectId;
  codeId: ObjectId;
  code: string;
  houseId: string;
  houseName: string;
  deviceId: string;
  deviceNumber: number;
  ip: string | null;
  name: string;
  group: number;
  scannedAt: Date;
}

/** One row per distinct device (browser), keyed by its localStorage-generated
 * id — deviceNumber is the human-friendly sequential id ("Device #42") for
 * cross-referencing against hunt_scans without reading raw UUIDs. */
export interface HuntDeviceDoc {
  _id: string;
  deviceNumber: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastIp: string | null;
  scanCount: number;
}

export type CodeStatus = "available" | "cooldown";

export interface HuntCodeDto {
  id: string;
  code: string;
  label: string | null;
  url: string;
  qrDataUrl: string;
  status: CodeStatus;
  cooldownUntil: string | null;
  captureCount: number;
  lastHouseName: string | null;
  lastCapturedAt: string | null;
  createdAt: string;
}

export type RedeemResult =
  | "captured"
  | "cooldown"
  | "not_found"
  | "invalid_house"
  | "already_scanned"
  | "not_started"
  | "ended";

export interface RedeemStatusDto {
  status: "available" | "cooldown" | "not_found" | "already_scanned" | "not_started" | "ended";
  label: string | null;
  availableAt: string | null;
}

export interface RedeemResponseDto {
  result: RedeemResult;
  houseName: string | null;
  availableAt: string | null;
}

export interface LeaderboardEntryDto {
  houseId: string;
  houseName: string;
  color: string;
  points: number;
}

export interface LeaderboardActivityDto {
  houseName: string;
  color: string;
  scannedAt: string;
}

export interface LeaderboardDto {
  board: LeaderboardEntryDto[];
  totalCaptures: number;
  recent: LeaderboardActivityDto[];
}
