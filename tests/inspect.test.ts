import { describe, expect, it } from "bun:test";
import { MAX, NIL } from "uuid";
import { app } from "../src/app";

const post = (path: string, payload: unknown) =>
  app.handle(
    new Request(`http://localhost/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("POST /validate", () => {
  it("reports a valid UUID as valid", async () => {
    const res = await post("/validate", { uuid: DNS });
    const body = (await res.json()) as { uuid: string; valid: boolean };
    expect(res.status).toBe(200);
    expect(body).toEqual({ uuid: DNS, valid: true });
  });

  it("reports junk as invalid with a 400", async () => {
    const res = await post("/validate", { uuid: "definitely-not-a-uuid" });
    const body = (await res.json()) as { uuid: string; valid: boolean };
    expect(res.status).toBe(400);
    expect(body).toEqual({ uuid: "definitely-not-a-uuid", valid: false });
  });

  it("rejects a body missing the uuid field with 422", async () => {
    const res = await post("/validate", {});
    expect(res.status).toBe(422);
  });
});

describe("POST /version", () => {
  it.each([
    [NIL, 0],
    [DNS, 1],
    [MAX, 15],
  ] as const)("reports %s as version %d", async (uuid, expected) => {
    const res = await post("/version", { uuid });
    const body = (await res.json()) as { uuid: string; version: number };
    expect(res.status).toBe(200);
    expect(body).toEqual({ uuid, version: expected });
  });

  it("returns 400 for an invalid UUID", async () => {
    const res = await post("/version", { uuid: "bad" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid UUID");
  });
});
