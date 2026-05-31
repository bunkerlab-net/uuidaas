import { Elysia } from "elysia";
import { isValid, ulidToUUID, uuidToULID } from "ulid";
import {
  ConversionResponse,
  ErrorResponse,
  UlidBody,
  UuidBody,
} from "../schemas";

// A UUID-shaped string: 8-4-4-4-12 hex. Conversions validate by *format*, not
// uuid's validate(), which enforces RFC version/variant bits and would reject
// the UUID encoding of a ULID — breaking round-trips (a ULID's UUID form has a
// version nibble of 0). uuidToULID/ulidToUUID are pure 128-bit reinterpretations.
const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const convert = new Elysia({ name: "convert" })
  .post(
    "/ulid/to-uuid",
    ({ body, status }) => {
      const { ulid } = body;
      if (!isValid(ulid)) {
        return status(400, { error: `Invalid ULID: ${ulid}` });
      }
      return { ulid, uuid: ulidToUUID(ulid).toLowerCase() };
    },
    {
      body: UlidBody,
      response: { 200: ConversionResponse, 400: ErrorResponse },
      detail: {
        summary: "Convert a ULID to its UUID form",
        tags: ["Convert"],
      },
    },
  )
  .post(
    "/uuid/to-ulid",
    ({ body, status }) => {
      const { uuid } = body;
      if (!UUID_FORMAT.test(uuid)) {
        return status(400, { error: `Invalid UUID: ${uuid}` });
      }
      return { uuid, ulid: uuidToULID(uuid) };
    },
    {
      body: UuidBody,
      response: { 200: ConversionResponse, 400: ErrorResponse },
      detail: {
        summary: "Convert a UUID to its ULID form",
        tags: ["Convert"],
      },
    },
  );
