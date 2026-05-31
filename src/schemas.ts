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

/** Result of validating a UUID. */
export const ValidateResponse = t.Object({
	uuid: t.String(),
	valid: t.Boolean({ description: "Whether the string is a valid UUID" }),
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

/** Optional inputs for Nano IDs. Out-of-range sizes fail schema validation (422). */
export const NanoidQuery = t.Object({
	size: t.Optional(
		t.Numeric({
			minimum: 1,
			maximum: 1024,
			description: "ID length in characters (1–1024). Defaults to 21.",
		}),
	),
});
