import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { MAX, NIL, v1, v3, v4, v5, v6, v7, validate } from "uuid";
import {
  ErrorResponse,
  IdResponse,
  NameBasedQuery,
  NanoidQuery,
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
  });
