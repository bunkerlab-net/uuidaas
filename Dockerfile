FROM docker.io/oven/bun:1-alpine AS base
###
# Builder
###
FROM base AS builder
WORKDIR /app

COPY bun.lock bunfig.toml package.json ./
RUN bun install

COPY . .
RUN bun build --target=bun --production --splitting --outdir=dist ./src/index.ts

###
# Runner
###
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache tini
COPY --from=builder /app/dist /app/dist/

ENTRYPOINT [ "tini", "--" ]
CMD ["bun", "run", "/app/dist/index.js"]
