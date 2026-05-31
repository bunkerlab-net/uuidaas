import { Elysia } from "elysia";
import { validate, version } from "uuid";
import {
	ErrorResponse,
	UuidBody,
	ValidateResponse,
	VersionResponse,
} from "../schemas";

export const inspect = new Elysia({ name: "inspect" })
	.post(
		"/validate",
		({ body, status }) => {
			const result = { uuid: body.uuid, valid: validate(body.uuid) };
			return result.valid ? result : status(400, result);
		},
		{
			body: UuidBody,
			response: { 200: ValidateResponse, 400: ValidateResponse },
			detail: { summary: "Validate a UUID", tags: ["Inspect"] },
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
			detail: { summary: "Get the version of a UUID", tags: ["Inspect"] },
		},
	);
