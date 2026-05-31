import { Elysia } from "elysia";
import { HealthResponse } from "../schemas";

/**
 * Kubernetes-style liveness and readiness probes, served at the root (outside
 * `/api`). The service has no external dependencies, so both simply confirm the
 * process is up and serving.
 */
export const health = new Elysia({ name: "health", prefix: "/health" })
  .get("/live", () => ({ status: "ok" }), {
    response: HealthResponse,
    detail: { summary: "Liveness probe", tags: ["Health"] },
  })
  .get("/ready", () => ({ status: "ok" }), {
    response: HealthResponse,
    detail: { summary: "Readiness probe", tags: ["Health"] },
  });
