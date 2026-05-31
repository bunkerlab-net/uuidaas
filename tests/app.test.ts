import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("app", () => {
  it("serves the OpenAPI docs at /docs", async () => {
    const res = await app.handle(new Request("http://localhost/docs"));
    expect(res.status).toBe(200);
  });

  it("redirects GET / to /docs with a 301", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/docs");
  });

  it("round-trips: a generated v7 decodes to version 7 with a recent timestamp", async () => {
    const gen = await app.handle(new Request("http://localhost/api/v7"));
    const { uuid } = (await gen.json()) as { uuid: string };

    const res = await app.handle(
      new Request("http://localhost/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uuid }),
      }),
    );
    const body = (await res.json()) as {
      version: number;
      fields: { timestamp: string };
    };
    expect(body.version).toBe(7);
    expect(Date.parse(body.fields.timestamp)).toBeGreaterThan(
      Date.now() - 60000,
    );
  });

  it("round-trips: a generated ULID is auto-detected by /validate", async () => {
    const gen = await app.handle(new Request("http://localhost/api/ulid"));
    const { id } = (await gen.json()) as { id: string };

    const res = await app.handle(
      new Request("http://localhost/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    );
    const body = (await res.json()) as {
      ulid: string;
      valid: boolean;
      fields: { time: number };
    };
    expect(body.valid).toBe(true);
    expect(body.ulid).toBe(id);
    expect(body.fields.time).toBeGreaterThan(Date.now() - 60000);
  });

  it("marks POST /api/version as deprecated in the OpenAPI spec", async () => {
    const res = await app.handle(new Request("http://localhost/docs/json"));
    const spec = (await res.json()) as {
      paths: { "/api/version": { post: { deprecated?: boolean } } };
    };
    expect(spec.paths["/api/version"].post.deprecated).toBe(true);
  });
});
