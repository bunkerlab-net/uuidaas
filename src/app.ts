import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import pkg from "../package.json";
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
          version: pkg.version,
          description: pkg.description,
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
