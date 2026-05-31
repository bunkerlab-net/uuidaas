# UUIDaaS

UUID generation and inspection as a service, built with [Elysia](https://elysiajs.com) on the [Bun](https://bun.sh)
runtime. Generates every UUID version the [`uuid`](https://www.npmjs.com/package/uuid) library supports — plus
[Nano IDs](https://www.npmjs.com/package/nanoid), validation, and version inspection — with structured request logging
and auto-generated OpenAPI docs.

## Requirements

- [Bun](https://bun.sh) `1.x`

## Getting started

```bash
bun install
bun dev      # watch mode, restarts on change
```

The server listens on <http://0.0.0.0:3000>. Interactive API docs are at <http://0.0.0.0:3000/docs>.

For a non-watch run:

```bash
bun start
```

## API

All generation and inspection routes are served under the `/api` prefix. The OpenAPI UI lives at the root (`/docs`).

| Method | Path            | Description                                 |
| ------ | --------------- | ------------------------------------------- |
| `GET`  | `/api/v0`       | Nil UUID (all zeroes)                       |
| `GET`  | `/api/v1`       | UUIDv1 (timestamp + node)                   |
| `GET`  | `/api/v3`       | UUIDv3 (MD5, name-based)                    |
| `GET`  | `/api/v4`       | UUIDv4 (random)                             |
| `GET`  | `/api/v5`       | UUIDv5 (SHA-1, name-based)                  |
| `GET`  | `/api/v6`       | UUIDv6 (reordered timestamp)                |
| `GET`  | `/api/v7`       | UUIDv7 (Unix-epoch, sortable)               |
| `GET`  | `/api/max`      | Max UUID (all ones)                         |
| `GET`  | `/api/nanoid`   | Nano ID (URL-friendly, configurable length) |
| `POST` | `/api/validate` | Validate a UUID                             |
| `POST` | `/api/version`  | Report a UUID's version                     |
| `GET`  | `/docs`         | OpenAPI documentation                       |

> **Note:** UUIDv8 is intentionally not offered — RFC 9562 reserves it for custom/vendor-specific data, and the `uuid`
> library provides no generator for it.

### Generating UUIDs

Each generator returns `{ "uuid": "<value>" }`:

```bash
curl http://localhost:3000/api/v4
# {"uuid":"37089aaf-7d77-431e-9379-b5d0b16eb271"}
```

#### Name-based UUIDs (`/api/v3`, `/api/v5`)

Name-based UUIDs hash a `name` within a `namespace`. Both are optional query parameters:

- `namespace` — a UUID. Defaults to the RFC 9562 **URL** namespace (`6ba7b811-9dad-11d1-80b4-00c04fd430c8`). An invalid
  namespace returns `400`.
- `name` — the string to hash. Defaults to a random value, so a bare request still returns a valid (but non-deterministic)
  UUID.

```bash
# Deterministic: same name + namespace always yields the same UUID
curl "http://localhost:3000/api/v5?name=hello&namespace=6ba7b810-9dad-11d1-80b4-00c04fd430c8"
# {"uuid":"9342d47a-1bab-5709-9869-c840b2eac501"}
```

#### Nano IDs (`/api/nanoid`)

Returns `{ "id": "<value>" }` — a URL-friendly random ID (alphabet `A-Za-z0-9_-`).
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

Returns `{ "uuid": "...", "valid": <bool> }`. The status code mirrors validity: `200` when valid, `400` when not.

```bash
curl -X POST http://localhost:3000/api/validate \
  -H 'content-type: application/json' \
  -d '{"uuid":"6ba7b810-9dad-11d1-80b4-00c04fd430c8"}'
# 200 {"uuid":"6ba7b810-9dad-11d1-80b4-00c04fd430c8","valid":true}

curl -X POST http://localhost:3000/api/validate \
  -H 'content-type: application/json' \
  -d '{"uuid":"not-a-uuid"}'
# 400 {"uuid":"not-a-uuid","valid":false}
```

#### `POST /api/version`

Returns `{ "uuid": "...", "version": <number> }` for a valid UUID (`0` for nil, `15` for max), or
`400 { "error": "..." }` for an invalid one.

```bash
curl -X POST http://localhost:3000/api/version \
  -H 'content-type: application/json' \
  -d '{"uuid":"019e7d13-e96b-70da-8376-2318ba78761c"}'
# {"uuid":"019e7d13-e96b-70da-8376-2318ba78761c","version":7}
```

## Logging

Requests are logged as structured records via [pino](https://getpino.io), one
line per request after the response is sent. Configure via environment variables:

| Variable     | Values                                  | Default                            |
| ------------ | --------------------------------------- | ---------------------------------- |
| `LOG_FORMAT` | `json` \| `plain`                       | `json`                             |
| `LOG_LEVEL`  | pino levels (`trace`…`fatal`, `silent`) | `info` (`silent` under `bun test`) |

```bash
LOG_FORMAT=plain bun dev   # human-readable, colorized output for local dev
```

```jsonc
// LOG_FORMAT=json
{
  "level": 30,
  "time": 1780215527104,
  "method": "GET",
  "path": "/api/v4",
  "status": 200,
  "durationMs": 0.51,
  "msg": "request",
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

An invalid `LOG_FORMAT` fails loudly at startup rather than guessing.

## Testing

```bash
bun test
```

## License

[MIT](./LICENSE) — do whatever you want with it.

## Project structure

```text
src/
  index.ts          Entry point — binds the port
  app.ts            Composes the Elysia app (importable by tests)
  logger.ts         pino logger + request-logging Elysia plugin
  schemas.ts        Shared TypeBox request/response schemas
  routes/
    generate.ts     GET /v0 /v1 /v3 /v4 /v5 /v6 /v7 /max /nanoid
    inspect.ts      POST /validate /version
tests/
  app.test.ts       Docs endpoint + generate→inspect round-trip
  generate.test.ts  Generation routes
  inspect.test.ts   Validation + version inspection
  logger.test.ts    Log format selection
```
