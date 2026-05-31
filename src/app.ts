import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import pkg from "../package.json";
import { logger } from "./logger";
import { convert } from "./routes/convert";
import { generate } from "./routes/generate";
import { health } from "./routes/health";
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
          {
            name: "Generate",
            description: "Generate UUIDs, ULIDs, and Nano IDs",
          },
          {
            name: "Inspect",
            description: "Validate and inspect UUIDs and ULIDs",
          },
          {
            name: "Convert",
            description: "Convert between UUIDs and ULIDs",
          },
          { name: "Health", description: "Liveness and readiness probes" },
        ],
      },
    }),
  )
  .get("/", ({ redirect }) => redirect("/docs", 301), {
    detail: { hide: true },
  })
  .use(health)
  .group("/api", (api) => api.use(generate).use(inspect).use(convert));

export type App = typeof app;
