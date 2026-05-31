import type { Writable } from "node:stream";
import { ecsFormat } from "@elastic/ecs-pino-format";
import { Elysia } from "elysia";
import pino from "pino";
import pretty from "pino-pretty";

export type LogFormat = "json" | "plain";

/** Resolve the output format from LOG_FORMAT (default "json"); fail loud on bad values. */
export function resolveFormat(): LogFormat {
  const raw = process.env.LOG_FORMAT;
  if (raw === undefined || raw === "json") return "json";
  if (raw === "plain") return "plain";
  throw new Error(`Invalid LOG_FORMAT "${raw}". Expected "json" or "plain".`);
}

/**
 * Build a pino logger. `json` emits Elastic Common Schema (ECS) JSON (one
 * record per line, ideal for log shippers); `plain` pretty-prints human-readable
 * lines via pino-pretty. `destination` is an injection seam for tests —
 * production writes to stdout.
 */
export function buildLogger(
  format: LogFormat,
  level: string,
  destination?: Writable,
): pino.Logger {
  if (format === "plain") {
    return pino(
      { level },
      pretty({
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        ...(destination ? { destination, colorize: false } : {}),
      }),
    );
  }
  const options = { ...ecsFormat(), level };
  return destination ? pino(options, destination) : pino(options);
}

/**
 * Central application logger. Silent under `bun test` (NODE_ENV=test) to keep
 * test output clean; override level with LOG_LEVEL and format with LOG_FORMAT.
 */
export const log = buildLogger(
  resolveFormat(),
  process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "test" ? "silent" : "info"),
);

/** Health probes are frequent and low-value, so they're excluded from request logging. */
export function shouldLog(path: string): boolean {
  return !path.startsWith("/health/");
}

/**
 * Elysia plugin that logs one structured line per request after the response is
 * sent. `.as("global")` propagates the hooks to every route in the app it is
 * used by. Request fields are captured in `derive` (while the request object is
 * still intact) because by `onAfterResponse` the live server has cleared it.
 */
export const logger = new Elysia({ name: "logger" })
  .derive(({ request, path }) => ({
    start: performance.now(),
    method: request.method,
    path,
  }))
  .onAfterResponse(({ method, path, set, start }) => {
    if (!shouldLog(path)) return;
    log.info(
      {
        method,
        path,
        status: set.status ?? 200,
        durationMs: Number((performance.now() - start).toFixed(2)),
      },
      "request",
    );
  })
  .as("global");
