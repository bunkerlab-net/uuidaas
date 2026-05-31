import { Elysia } from "elysia";
import { validate, version } from "uuid";
import { decode } from "../decode";
import {
  ErrorResponse,
  InvalidResponse,
  UuidBody,
  ValidateResponse,
  VersionResponse,
} from "../schemas";

export const inspect = new Elysia({ name: "inspect" })
  .post(
    "/validate",
    ({ body, status }) => {
      const { uuid } = body;
      if (!validate(uuid)) {
        return status(400, { uuid, valid: false });
      }
      return { uuid, valid: true, ...decode(uuid) };
    },
    {
      body: UuidBody,
      response: { 200: ValidateResponse, 400: InvalidResponse },
      detail: { summary: "Validate and decode a UUID", tags: ["Inspect"] },
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
