import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { ulid } from "ulid";
import {
  MAX,
  NIL,
  parse,
  stringify,
  v1,
  v3,
  v4,
  v5,
  v6,
  v7,
  validate,
} from "uuid";
import {
  DceSecurityQuery,
  ErrorResponse,
  IdResponse,
  NameBasedQuery,
  NanoidQuery,
  UlidQuery,
  UuidResponse,
} from "../schemas";

// Default namespace for name-based UUIDs (v3/v5): the RFC 9562 URL namespace.
const URL_NAMESPACE = v5.URL;

export const generate = new Elysia({ name: "generate" })
  .get("/v0", () => ({ uuid: NIL }), {
    response: UuidResponse,
    detail: { summary: "Nil UUID (all zeroes)", tags: ["Generate"] },
  })
  .get("/v1", () => ({ uuid: v1() }), {
    response: UuidResponse,
    detail: { summary: "UUIDv1 (timestamp + node)", tags: ["Generate"] },
  })
  .get(
    "/v2",
    ({ query }) => {
      // DCE Security UUID: a v1 with time_low replaced by a local identifier
      // and clock_seq_low replaced by a local domain, then versioned to 2.
      const id = query.id ?? crypto.getRandomValues(new Uint32Array(1))[0];
      const domain = query.domain ?? 0;
      const bytes = parse(v1());
      bytes[0] = (id >>> 24) & 0xff;
      bytes[1] = (id >>> 16) & 0xff;
      bytes[2] = (id >>> 8) & 0xff;
      bytes[3] = id & 0xff;
      bytes[9] = domain & 0xff;
      bytes[6] = (bytes[6] & 0x0f) | 0x20;
      return { uuid: stringify(bytes) };
    },
    {
      query: DceSecurityQuery,
      response: UuidResponse,
      detail: { summary: "UUIDv2 (DCE Security)", tags: ["Generate"] },
    },
  )
  .get(
    "/v3",
    ({ query, status }) => {
      const namespace = query.namespace ?? URL_NAMESPACE;
      if (!validate(namespace)) {
        return status(400, { error: `Invalid namespace UUID: ${namespace}` });
      }
      return { uuid: v3(query.name ?? v4(), namespace) };
    },
    {
      query: NameBasedQuery,
      response: { 200: UuidResponse, 400: ErrorResponse },
      detail: { summary: "UUIDv3 (MD5 name-based)", tags: ["Generate"] },
    },
  )
  .get("/v4", () => ({ uuid: v4() }), {
    response: UuidResponse,
    detail: { summary: "UUIDv4 (random)", tags: ["Generate"] },
  })
  .get(
    "/v5",
    ({ query, status }) => {
      const namespace = query.namespace ?? URL_NAMESPACE;
      if (!validate(namespace)) {
        return status(400, { error: `Invalid namespace UUID: ${namespace}` });
      }
      return { uuid: v5(query.name ?? v4(), namespace) };
    },
    {
      query: NameBasedQuery,
      response: { 200: UuidResponse, 400: ErrorResponse },
      detail: { summary: "UUIDv5 (SHA-1 name-based)", tags: ["Generate"] },
    },
  )
  .get("/v6", () => ({ uuid: v6() }), {
    response: UuidResponse,
    detail: { summary: "UUIDv6 (reordered timestamp)", tags: ["Generate"] },
  })
  .get("/v7", () => ({ uuid: v7() }), {
    response: UuidResponse,
    detail: { summary: "UUIDv7 (Unix-epoch sortable)", tags: ["Generate"] },
  })
  .get("/max", () => ({ uuid: MAX }), {
    response: UuidResponse,
    detail: { summary: "Max UUID (all ones)", tags: ["Generate"] },
  })
  .get("/nanoid", ({ query }) => ({ id: nanoid(query.size ?? 21) }), {
    query: NanoidQuery,
    response: IdResponse,
    detail: {
      summary: "Nano ID (URL-friendly, configurable length)",
      tags: ["Generate"],
    },
  })
  .get(
    "/ulid",
    ({ query }) => ({
      id: query.seed === undefined ? ulid() : ulid(query.seed),
    }),
    {
      query: UlidQuery,
      response: IdResponse,
      detail: {
        summary: "ULID (Crockford Base32, lexicographically sortable)",
        tags: ["Generate"],
      },
    },
  );
