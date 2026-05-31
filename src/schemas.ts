import { t } from "elysia";

/** A generated UUID. */
export const UuidResponse = t.Object({
  uuid: t.String({ description: "The generated UUID" }),
});

/** A rejected request. */
export const ErrorResponse = t.Object({
  error: t.String({ description: "Why the request was rejected" }),
});

/**
 * Optional inputs for name-based UUIDs (v3/v5). Both are optional so a bare GET
 * still works — namespace defaults to the RFC 9562 URL namespace and name
 * defaults to a random value, yielding a fresh-but-valid UUID each call.
 */
export const NameBasedQuery = t.Object({
  name: t.Optional(
    t.String({ description: "Name to hash. Defaults to a random value." }),
  ),
  namespace: t.Optional(
    t.String({
      description: "Namespace UUID. Defaults to the RFC 9562 URL namespace.",
    }),
  ),
});

/** Body carrying a single UUID to inspect. Plain string so invalid values reach the handler. */
export const UuidBody = t.Object({
  uuid: t.String({ description: "The UUID to inspect" }),
});

/**
 * Body for POST /validate: a single id under either `id` (preferred) or `uuid`
 * (back-compat alias). A union so a body missing both fields fails validation
 * (422); plain strings so invalid values reach the handler.
 */
export const ValidateBody = t.Union([
  t.Object({ id: t.String({ description: "The UUID or ULID to inspect" }) }),
  t.Object({
    uuid: t.String({
      description: "The UUID or ULID to inspect (alias of id)",
    }),
  }),
]);

/** Body carrying a single ULID. Plain string so invalid values reach the handler. */
export const UlidBody = t.Object({
  ulid: t.String({ description: "The ULID to convert" }),
});

/** The decoded fields of a UUID: raw structure plus version-specific semantics. */
export const UuidFields = t.Object({
  bytes: t.String({ description: "The 16 raw bytes as hex" }),
  timeLow: t.Number({ description: "time_low (bytes 0-3)" }),
  timeMid: t.Number({ description: "time_mid (bytes 4-5)" }),
  timeHiAndVersion: t.Number({
    description: "time_hi_and_version (bytes 6-7)",
  }),
  clockSeqHi: t.Number({ description: "clock_seq_hi_and_reserved (byte 8)" }),
  clockSeqLow: t.Number({ description: "clock_seq_low (byte 9)" }),
  node: t.String({ description: "node (bytes 10-15) as hex" }),
  timestamp: t.Optional(
    t.String({ description: "Decoded ISO timestamp (v1, v6, v7)" }),
  ),
  clockSequence: t.Optional(
    t.Number({ description: "14-bit clock sequence (v1, v6)" }),
  ),
  macAddress: t.Optional(
    t.String({ description: "Node as a MAC address (v1, v6)" }),
  ),
  domain: t.Optional(t.Number({ description: "DCE local domain (v2)" })),
  identifier: t.Optional(
    t.Number({ description: "DCE local identifier (v2)" }),
  ),
});

/** Result of validating a valid UUID, with its decoded version, variant, and fields. */
export const ValidateResponse = t.Object({
  uuid: t.String(),
  valid: t.Boolean({ description: "Whether the string is a valid UUID" }),
  version: t.Number({ description: "The UUID version field" }),
  variant: t.String({
    description: "The UUID variant: RFC, NCS, Microsoft, or Future",
  }),
  fields: UuidFields,
});

/** Result when a UUID fails validation; returned with a 400. */
export const InvalidResponse = t.Object({
  uuid: t.String(),
  valid: t.Boolean({ description: "Always false here" }),
});

/** Result when an id fails validation as both UUID and ULID; returned with a 400. */
export const IdInvalidResponse = t.Object({
  id: t.String(),
  valid: t.Boolean({ description: "Always false here" }),
});

/** Result of inspecting a UUID's version. */
export const VersionResponse = t.Object({
  uuid: t.String(),
  version: t.Number({ description: "The UUID version field" }),
});

/** A generated Nano ID. */
export const IdResponse = t.Object({
  id: t.String({ description: "The generated ID" }),
});

/**
 * Optional inputs for Nano IDs. Out-of-range sizes fail schema validation (422).
 * t.Number (not t.Numeric) so no spurious `default: 0` leaks into the OpenAPI
 * spec; Elysia still coerces the query string.
 */
export const NanoidQuery = t.Object({
  size: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 1024,
      description: "ID length in characters (1–1024). Defaults to 21.",
    }),
  ),
});

/**
 * Optional inputs for DCE Security UUIDs (v2). t.Number (not t.Numeric) keeps a
 * spurious `default: 0` out of the OpenAPI spec; Elysia still coerces the query.
 */
export const DceSecurityQuery = t.Object({
  domain: t.Optional(
    t.Number({
      minimum: 0,
      maximum: 255,
      multipleOf: 1,
      description:
        "Local domain: 0=person (UID), 1=group (GID), 2=org. Defaults to 0.",
    }),
  ),
  id: t.Optional(
    t.Number({
      minimum: 0,
      maximum: 4294967295,
      multipleOf: 1,
      description: "32-bit local identifier. Defaults to a random value.",
    }),
  ),
});

/**
 * Optional inputs for ULIDs. Out-of-range seeds fail schema validation (422).
 * Uses t.Number (Elysia still coerces the query string) rather than t.Numeric,
 * which would bake a misleading `default: 0` into the OpenAPI spec; an omitted
 * seed has no default — the handler calls bare `ulid()`.
 */
export const UlidQuery = t.Object({
  seed: t.Optional(
    t.Number({
      minimum: 0,
      maximum: 281474976710655,
      multipleOf: 1,
      description:
        "Unix epoch ms for the time component (0–281474976710655). The random component stays random. Defaults to now.",
    }),
  ),
});

/** The decoded parts of a ULID: its timestamp and component substrings. */
export const UlidFields = t.Object({
  time: t.Number({ description: "Time component as Unix epoch ms" }),
  timestamp: t.String({ description: "Time component as an ISO timestamp" }),
  timeComponent: t.String({ description: "The 10-char time prefix" }),
  randomComponent: t.String({ description: "The 16-char random suffix" }),
  uuid: t.String({ description: "The equivalent 128-bit UUID" }),
});

/** Result of validating a valid ULID, with its decoded fields. */
export const UlidValidateResponse = t.Object({
  ulid: t.String(),
  valid: t.Boolean({ description: "Whether the string is a valid ULID" }),
  fields: UlidFields,
});

/** A UUID and its equivalent ULID — the same 128 bits in both encodings. */
export const ConversionResponse = t.Object({
  uuid: t.String({ description: "The UUID form" }),
  ulid: t.String({ description: "The ULID form" }),
});

/** Health probe result. */
export const HealthResponse = t.Object({
  status: t.String({ description: "Probe status" }),
});
