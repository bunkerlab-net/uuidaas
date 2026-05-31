import { Elysia, t } from "elysia";
import { isValid } from "ulid";
import { validate, version } from "uuid";
import { decode, decodeUlid } from "../decode";
import {
  ErrorResponse,
  IdInvalidResponse,
  InvalidResponse,
  UlidValidateResponse,
  UuidBody,
  ValidateBody,
  ValidateResponse,
  VersionResponse,
} from "../schemas";

export const inspect = new Elysia({ name: "inspect" })
  .post(
    "/validate",
    ({ body, status }) => {
      // UUID and ULID formats are mutually exclusive, so detection is just a
      // matter of trying each validator. The response echoes the input under a
      // type-specific key (`uuid` vs `ulid`) so callers can tell them apart.
      const value = "id" in body ? body.id : body.uuid;
      if (validate(value)) {
        return { uuid: value, valid: true, ...decode(value) };
      }
      if (isValid(value)) {
        return { ulid: value, valid: true, fields: decodeUlid(value) };
      }
      return "id" in body
        ? status(400, { id: value, valid: false })
        : status(400, { uuid: value, valid: false });
    },
    {
      body: ValidateBody,
      response: {
        200: t.Union([ValidateResponse, UlidValidateResponse]),
        400: t.Union([InvalidResponse, IdInvalidResponse]),
      },
      detail: {
        summary: "Validate and decode a UUID or ULID",
        description:
          "Auto-detects the input type. A UUID returns its version, variant, and fields; a ULID returns its decoded fields. Tell them apart by which key the response echoes (`uuid` vs `ulid`).",
        tags: ["Inspect"],
      },
    },
  )
  .post(
    "/version",
    ({ body, status }) => {
      if (!validate(body.uuid)) {
        return status(400, { error: `Invalid UUID: ${body.uuid}` });
      }
      return { uuid: body.uuid, version: version(body.uuid) };
    },
    {
      body: UuidBody,
      response: { 200: VersionResponse, 400: ErrorResponse },
      detail: {
        summary: "Get the version of a UUID",
        description:
          "Deprecated: use POST /api/validate, which returns the version plus a full field breakdown.",
        tags: ["Inspect"],
        deprecated: true,
      },
    },
  );
