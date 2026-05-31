import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import { logger } from "./logger";
import { generate } from "./routes/generate";
import { inspect } from "./routes/inspect";

/** The composed application, without binding a port — import this in tests. */
export const app = new Elysia()
	.use(logger)
	.use(
		openapi({
			path: "/docs",
			documentation: {
				info: {
					title: "UUIDaaS",
					version: "1.0.0",
					description:
						"UUID generation and inspection as a service, powered by Elysia + Bun.",
				},
				tags: [
					{ name: "Generate", description: "Generate UUIDs" },
					{ name: "Inspect", description: "Validate and inspect UUIDs" },
				],
			},
		}),
	)
	.group("/api", (api) => api.use(generate).use(inspect));

export type App = typeof app;
