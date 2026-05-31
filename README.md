# UUIDaaS

UUID generation and inspection as a service, built with [ElysiaJS](https://elysiajs.com) on the [Bun](https://bun.sh)
runtime. Generates every UUID version from v0 to v7, a hand-rolled v2 (DCE Security), and
[Nano IDs](https://www.npmjs.com/package/nanoid). Validates and decodes UUIDs into their fields via the
[`uuid`](https://www.npmjs.com/package/uuid) library, with structured request logging and auto-generated OpenAPI docs.

## Requirements

- [mise](https://mise.jdx.dev) - provisions the entire toolchain (Bun, Node, Biome, and more) declared in `mise.toml`.

## Getting started

```bash
mise install   # provision the toolchain (Bun, Node, Biome, ...) from mise.toml
bun install    # install project dependencies
bun dev        # watch mode, restarts on change
```

The server listens on <http://0.0.0.0:3000>. Interactive API docs are at <http://0.0.0.0:3000/docs>.

For a non-watch run:

```bash
bun start
```

## API

All generation and inspection routes are served under the `/api` prefix. The OpenAPI UI (`/docs`) and the health probes
(`/health/live`, `/health/ready`) live at the root.

| Method | Path            | Description                                 |
| ------ | --------------- | ------------------------------------------- |
| `GET`  | `/api/v0`       | Nil UUID (all zeroes)                       |
| `GET`  | `/api/v1`       | UUIDv1 (timestamp + node)                   |
| `GET`  | `/api/v2`       | UUIDv2 (DCE Security)                       |
| `GET`  | `/api/v3`       | UUIDv3 (MD5, name-based)                    |
| `GET`  | `/api/v4`       | UUIDv4 (random)                             |
| `GET`  | `/api/v5`       | UUIDv5 (SHA-1, name-based)                  |
| `GET`  | `/api/v6`       | UUIDv6 (reordered timestamp)                |
| `GET`  | `/api/v7`       | UUIDv7 (Unix-epoch, sortable)               |
| `GET`  | `/api/max`      | Max UUID (all ones)                         |
| `GET`  | `/api/nanoid`   | Nano ID (URL-friendly, configurable length) |
| `POST` | `/api/validate` | Validate and decode a UUID                  |
| `POST` | `/api/version`  | Report a UUID's version (deprecated)        |
| `GET`  | `/health/live`  | Liveness probe                              |
| `GET`  | `/health/ready` | Readiness probe                             |
| `GET`  | `/docs`         | OpenAPI documentation                       |

> **Note:** UUIDv8 is intentionally not offered - RFC 9562 reserves it for custom/vendor-specific data, and the `uuid`
> library provides no generator for it.

### Generating UUIDs

Each generator returns `{ "uuid": "<value>" }`:

```bash
curl http://localhost:3000/api/v4
# {"uuid":"37089aaf-7d77-431e-9379-b5d0b16eb271"}
```

#### Name-based UUIDs (`/api/v3`, `/api/v5`)

Name-based UUIDs hash a `name` within a `namespace`. Both are optional query parameters:

- `namespace` - a UUID. Defaults to the RFC 9562 **URL** namespace (`6ba7b811-9dad-11d1-80b4-00c04fd430c8`). An invalid
  namespace returns `400`.
- `name` - the string to hash. Defaults to a random value, so a bare request still returns a valid (but non-deterministic)
  UUID.

```bash
# Deterministic: same name + namespace always yields the same UUID
curl "http://localhost:3000/api/v5?name=hello&namespace=6ba7b810-9dad-11d1-80b4-00c04fd430c8"
# {"uuid":"9342d47a-1bab-5709-9869-c840b2eac501"}
```

#### DCE Security UUIDs (`/api/v2`)

UUIDv2 is hand-rolled (the `uuid` library has no v2 generator): it takes a v1 and replaces `time_low` with a 32-bit
local identifier and the `clock_seq_low` byte with a local domain. Both are optional query parameters:

- `domain` - local domain: `0`=person (UID), `1`=group (GID), `2`=org (`0`-`255`, default `0`).
- `id` - the 32-bit local identifier (`0`-`4294967295`, default random).

An out-of-range or non-integer value returns `422`.

```bash
curl "http://localhost:3000/api/v2?domain=1&id=1000"
# {"uuid":"000003e8-5cd1-21f1-b801-5b0b43a16b0e"}
```

#### Nano IDs (`/api/nanoid`)

Returns `{ "id": "<value>" }` - a URL-friendly random ID (alphabet `A-Za-z0-9_-`).
The length is set by an optional `size` query parameter (1–1024, default 21); an out-of-range or non-numeric size returns
`422`.

```bash
curl http://localhost:3000/api/nanoid
# {"id":"V1StGXR8_Z5jdHi6B-myT"}

curl "http://localhost:3000/api/nanoid?size=8"
# {"id":"IRFa-VaY"}
```

### Inspecting UUIDs

#### `POST /api/validate`

For a valid UUID, returns `200` with `valid: true`, the decoded `version` and `variant`, and a `fields` breakdown.
`fields` always carries the raw `bytes` (hex) and the structural pieces (`timeLow`, `timeMid`, `timeHiAndVersion`,
`clockSeqHi`, `clockSeqLow`, `node`), plus version-specific values where meaningful: `timestamp` (v1, v6, v7),
`clockSequence` and `macAddress` (v1, v6), and `domain` and `identifier` (v2). An invalid UUID returns
`400 { "uuid": "...", "valid": false }`.

```bash
curl -X POST http://localhost:3000/api/validate \
  -H 'content-type: application/json' \
  -d '{"uuid":"6ba7b810-9dad-11d1-80b4-00c04fd430c8"}'
# 200 {
#   "uuid": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "valid": true,
#   "version": 1, "variant": "RFC",
#   "fields": {
#     "bytes": "6ba7b8109dad11d180b400c04fd430c8",
#     "timeLow": 1806153744, "timeMid": 40365, "timeHiAndVersion": 4561,
#     "clockSeqHi": 128, "clockSeqLow": 180, "node": "00c04fd430c8",
#     "timestamp": "1998-02-04T22:13:53.151Z", "clockSequence": 180,
#     "macAddress": "00:c0:4f:d4:30:c8"
#   }
# }

curl -X POST http://localhost:3000/api/validate \
  -H 'content-type: application/json' \
  -d '{"uuid":"not-a-uuid"}'
# 400 {"uuid":"not-a-uuid","valid":false}
```

#### `POST /api/version` (deprecated)

> **Deprecated:** use `POST /api/validate`, which returns the version plus a full field breakdown.

Returns `{ "uuid": "...", "version": <number> }` for a valid UUID (`0` for nil, `15` for max), or
`400 { "error": "..." }` for an invalid one.

```bash
curl -X POST http://localhost:3000/api/version \
  -H 'content-type: application/json' \
  -d '{"uuid":"019e7d13-e96b-70da-8376-2318ba78761c"}'
# {"uuid":"019e7d13-e96b-70da-8376-2318ba78761c","version":7}
```

### Health

Kubernetes-style probes live at the root (no `/api` prefix) and return `200 { "status": "ok" }`:

```bash
curl http://localhost:3000/health/live    # liveness
curl http://localhost:3000/health/ready   # readiness
```

## Logging

Requests are logged as structured JSON via [pino](https://getpino.io), one line per request after the response is sent.
The `json` format emits [Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/index.html) (ECS) records;
`plain` is human-readable for local dev. Configure via environment variables:

| Variable     | Values                                  | Default                            |
| ------------ | --------------------------------------- | ---------------------------------- |
| `LOG_FORMAT` | `json` \| `plain`                       | `json`                             |
| `LOG_LEVEL`  | pino levels (`trace`…`fatal`, `silent`) | `info` (`silent` under `bun test`) |

```bash
LOG_FORMAT=plain bun dev   # human-readable, colorized output for local dev
```

```jsonc
// LOG_FORMAT=json (Elastic Common Schema)
{
  "log.level": "info",
  "@timestamp": "2026-05-31T09:45:32.264Z",
  "ecs.version": "8.10.0",
  "method": "GET",
  "path": "/api/v4",
  "status": 200,
  "durationMs": 0.51,
  "message": "request"
}
```

```text
# LOG_FORMAT=plain
[2026-05-31 10:23:27.460 +0200] INFO: request
    method: "GET"
    path: "/api/v4"
    status: 200
    durationMs: 0.41
```

An invalid `LOG_FORMAT` fails loudly at startup rather than guessing. Health-probe requests (`/health/*`) are not
logged.

## Testing

```bash
bun test
```

## License

[MIT](./LICENSE) - do whatever you want with it.

## Project structure

```text
src/
  index.ts          Entry point - binds the port
  app.ts            Composes the Elysia app (importable by tests)
  logger.ts         pino logger + request-logging Elysia plugin
  decode.ts         UUID parsing + field decoding
  schemas.ts        Shared TypeBox request/response schemas
  routes/
    generate.ts     GET /v0 /v1 /v2 /v3 /v4 /v5 /v6 /v7 /max /nanoid
    health.ts       GET /health/live /health/ready
    inspect.ts      POST /validate /version
tests/
  app.test.ts       Docs endpoint + generate→inspect round-trip
  generate.test.ts  Generation routes
  health.test.ts    Liveness + readiness probes
  inspect.test.ts   Validation + version inspection
  logger.test.ts    Log format selection
```
