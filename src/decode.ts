import { decodeTime, ulidToUUID } from "ulid";
import { parse, v6ToV1, version } from "uuid";

// 100-nanosecond intervals between the Gregorian epoch (1582-10-15) and the
// Unix epoch (1970-01-01), used to decode v1/v6 timestamps.
const GREGORIAN_OFFSET = 122192928000000000n;

/** Classify the UUID variant from clock_seq_hi_and_reserved (byte 8). */
function variantOf(byte: number): string {
  if ((byte & 0x80) === 0x00) return "NCS";
  if ((byte & 0xc0) === 0x80) return "RFC";
  if ((byte & 0xe0) === 0xc0) return "Microsoft";
  return "Future";
}

const toHex = (bytes: Uint8Array, sep = "") =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(sep);

/** ISO timestamp from a v1-layout byte array (Gregorian 100ns ticks since 1582). */
function gregorianTimestamp(b: Uint8Array): string {
  const timeLow = b[0] * 2 ** 24 + b[1] * 2 ** 16 + b[2] * 2 ** 8 + b[3];
  const timeMid = b[4] * 256 + b[5];
  const timeHi = ((b[6] & 0x0f) << 8) | b[7];
  const ticks =
    (BigInt(timeHi) << 48n) | (BigInt(timeMid) << 32n) | BigInt(timeLow);
  return new Date(Number((ticks - GREGORIAN_OFFSET) / 10000n)).toISOString();
}

export interface DecodedFields {
  bytes: string;
  timeLow: number;
  timeMid: number;
  timeHiAndVersion: number;
  clockSeqHi: number;
  clockSeqLow: number;
  node: string;
  timestamp?: string;
  clockSequence?: number;
  macAddress?: string;
  domain?: number;
  identifier?: number;
}

export interface DecodedUuid {
  version: number;
  variant: string;
  fields: DecodedFields;
}

/**
 * Decode a validated UUID into its version, variant, and fields. Beyond the raw
 * structural decomposition, version-specific data is added where meaningful:
 * timestamp/clockSequence/macAddress for v1 and v6, timestamp for v7, and
 * domain/identifier for v2 (DCE Security).
 */
export function decode(uuid: string): DecodedUuid {
  const bytes = parse(uuid);
  const v = version(uuid);
  const timeLow =
    bytes[0] * 2 ** 24 + bytes[1] * 2 ** 16 + bytes[2] * 2 ** 8 + bytes[3];

  const fields: DecodedFields = {
    bytes: toHex(bytes),
    timeLow,
    timeMid: (bytes[4] << 8) | bytes[5],
    timeHiAndVersion: (bytes[6] << 8) | bytes[7],
    clockSeqHi: bytes[8],
    clockSeqLow: bytes[9],
    node: toHex(bytes.slice(10, 16)),
  };

  if (v === 1 || v === 6) {
    fields.timestamp = gregorianTimestamp(
      v === 6 ? parse(v6ToV1(uuid)) : bytes,
    );
    fields.clockSequence = ((bytes[8] & 0x3f) << 8) | bytes[9];
    fields.macAddress = toHex(bytes.slice(10, 16), ":");
  } else if (v === 7) {
    fields.timestamp = new Date(
      bytes[0] * 2 ** 40 +
        bytes[1] * 2 ** 32 +
        bytes[2] * 2 ** 24 +
        bytes[3] * 2 ** 16 +
        bytes[4] * 2 ** 8 +
        bytes[5],
    ).toISOString();
  } else if (v === 2) {
    fields.domain = bytes[9];
    fields.identifier = timeLow;
  }

  return { version: v, variant: variantOf(bytes[8]), fields };
}

export interface DecodedUlid {
  time: number;
  timestamp: string;
  timeComponent: string;
  randomComponent: string;
  uuid: string;
}

/**
 * Decode a validated ULID into its time component (as Unix ms and ISO), its
 * raw time/random substrings, and the equivalent 128-bit UUID. A ULID is 26
 * Crockford Base32 characters: a 10-char time prefix and a 16-char random
 * suffix.
 */
export function decodeUlid(id: string): DecodedUlid {
  const time = decodeTime(id);
  return {
    time,
    timestamp: new Date(time).toISOString(),
    timeComponent: id.slice(0, 10),
    randomComponent: id.slice(10),
    uuid: ulidToUUID(id).toLowerCase(),
  };
}
